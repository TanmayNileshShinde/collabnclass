import { useState, useCallback, useEffect, useRef } from "react";
import { X, Download, Upload, Trash2, FileImage, FileCode, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Excalidraw, exportToBlob, exportToSvg } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCall } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "./ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";

interface WhiteboardProps {
  onClose: () => void;
}

const STORAGE_KEY_PREFIX = "excalidraw-whiteboard-data";

const Whiteboard = ({ onClose }: WhiteboardProps) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(false);
  const [lastSyncedBy, setLastSyncedBy] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const call = useCall();
  const { user } = useUser();
  const { toast } = useToast();

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteUpdateRef = useRef(false);

  // Dynamic storage key scoped to current meeting room
  const storageKey = call?.id
    ? `${STORAGE_KEY_PREFIX}-${call.id}`
    : STORAGE_KEY_PREFIX;

  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : { elements: [], appState: {} };
    } catch (error) {
      console.error("Error loading whiteboard data:", error);
      return { elements: [], appState: {} };
    }
  }, [storageKey]);

  const saveToStorage = useCallback((elements: any, appState: any) => {
    try {
      const dataToSave = {
        elements,
        appState: {
          viewBackgroundColor: appState?.viewBackgroundColor || "#0a0a0a",
          currentItemStrokeColor: appState?.currentItemStrokeColor || "#ffffff",
          currentItemBackgroundColor: appState?.currentItemBackgroundColor || "transparent",
        },
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving whiteboard data:", error);
    }
  }, [storageKey]);

  // Handle local drawing changes and broadcast to all peers in call
  const handleChange = useCallback(
    (elements: any, appState: any) => {
      // If this change was triggered by receiving remote elements, skip re-broadcasting
      if (isRemoteUpdateRef.current) {
        isRemoteUpdateRef.current = false;
        return;
      }

      saveToStorage(elements, appState);

      // Debounce network broadcasts to avoid flooding WebRTC channels during drawing strokes
      if (call) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(async () => {
          try {
            await call.sendCustomEvent({
              type: "whiteboard-elements-update",
              elements,
              senderId: user?.id || "anonymous",
              senderName: user?.fullName || user?.firstName || "Peer",
              timestamp: Date.now(),
            });
            setIsLiveSyncActive(true);
            setTimeout(() => setIsLiveSyncActive(false), 1200);
          } catch (err) {
            console.error("Failed to broadcast whiteboard update:", err);
          }
        }, 120);
      }
    },
    [call, user, saveToStorage],
  );

  // Listen to remote Stream custom events
  useEffect(() => {
    if (!call) return;

    const handleCustomEvent = (event: any) => {
      if (!event || event.type !== "custom") return;
      const customData = event.custom;
      if (!customData) return;

      // 1. Remote peer updated the board
      if (customData.type === "whiteboard-elements-update") {
        if (customData.senderId && customData.senderId === user?.id) return; // Ignore own echoes

        if (excalidrawAPI && Array.isArray(customData.elements)) {
          isRemoteUpdateRef.current = true;
          excalidrawAPI.updateScene({
            elements: customData.elements,
          });
          saveToStorage(customData.elements, excalidrawAPI.getAppState());
          setLastSyncedBy(customData.senderName || "Peer");
          setIsLiveSyncActive(true);
        }
      }

      // 2. Newly joined peer requested initial whiteboard state
      if (customData.type === "whiteboard-request-state") {
        if (customData.requesterId && customData.requesterId === user?.id) return;
        if (!excalidrawAPI) return;

        const currentElements = excalidrawAPI.getSceneElements();
        if (currentElements && currentElements.length > 0) {
          call.sendCustomEvent({
            type: "whiteboard-elements-response",
            elements: currentElements,
            targetId: customData.requesterId,
            senderId: user?.id,
            senderName: user?.fullName || user?.firstName || "Peer",
            timestamp: Date.now(),
          }).catch(console.error);
        }
      }

      // 3. Response to our initial state request
      if (customData.type === "whiteboard-elements-response") {
        if (customData.targetId && customData.targetId !== user?.id) return;
        if (excalidrawAPI && Array.isArray(customData.elements)) {
          isRemoteUpdateRef.current = true;
          excalidrawAPI.updateScene({
            elements: customData.elements,
          });
          saveToStorage(customData.elements, excalidrawAPI.getAppState());
          setLastSyncedBy(customData.senderName || "Peer");
          setIsLiveSyncActive(true);
        }
      }

      // 4. Whiteboard cleared by peer
      if (customData.type === "whiteboard-clear") {
        if (customData.senderId && customData.senderId === user?.id) return;
        if (excalidrawAPI) {
          isRemoteUpdateRef.current = true;
          excalidrawAPI.updateScene({
            elements: [],
            appState: {},
          });
          localStorage.removeItem(storageKey);
          setLastSyncedBy(customData.senderName || "Peer");
          toast({
            title: "Whiteboard Cleared",
            description: `${customData.senderName || "A participant"} cleared the shared canvas.`,
          });
        }
      }
    };

    (call as any).on("custom", handleCustomEvent);

    // Upon opening the whiteboard, request existing canvas state from active peers
    call.sendCustomEvent({
      type: "whiteboard-request-state",
      requesterId: user?.id,
      timestamp: Date.now(),
    }).catch(console.error);

    return () => {
      (call as any).off("custom", handleCustomEvent);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [call, user?.id, excalidrawAPI, saveToStorage, storageKey, toast]);

  // Export as PNG (P5-3)
  const handleExportPNG = useCallback(async () => {
    if (!excalidrawAPI) return;
    try {
      setIsExporting(true);
      const elements = excalidrawAPI.getSceneElements();
      if (!elements || elements.length === 0) {
        toast({ title: "Canvas is empty", description: "Draw something before exporting." });
        return;
      }
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: true,
          exportBackground: true,
        },
        files,
        mimeType: "image/png",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `collabclass-whiteboard-${Date.now()}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Whiteboard exported as PNG!" });
    } catch (err) {
      console.error("Export PNG failed:", err);
      toast({ title: "Export failed", description: "Could not export image.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [excalidrawAPI, toast]);

  // Export as SVG (P5-3)
  const handleExportSVG = useCallback(async () => {
    if (!excalidrawAPI) return;
    try {
      setIsExporting(true);
      const elements = excalidrawAPI.getSceneElements();
      if (!elements || elements.length === 0) {
        toast({ title: "Canvas is empty", description: "Draw something before exporting." });
        return;
      }
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const svg = await exportToSvg({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: true,
          exportBackground: true,
        },
        files,
      });

      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `collabclass-whiteboard-${Date.now()}.svg`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Whiteboard exported as SVG vector!" });
    } catch (err) {
      console.error("Export SVG failed:", err);
      toast({ title: "Export failed", description: "Could not export vector SVG.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [excalidrawAPI, toast]);

  // Export as JSON backup
  const handleExportJSON = useCallback(() => {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();

    const dataStr = JSON.stringify({ elements, appState }, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", `collabclass-whiteboard-${Date.now()}.json`);
    linkElement.click();
    toast({ title: "Whiteboard exported as JSON!" });
  }, [excalidrawAPI, toast]);

  // Import JSON backup
  const handleImportJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (!target?.files?.[0]) return;

      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) return;

        try {
          const data = JSON.parse(e.target.result as string);
          if (excalidrawAPI) {
            const elements = data.elements || data;
            const appState = data.appState || {};
            excalidrawAPI.updateScene({
              elements,
              appState,
            });
            saveToStorage(elements, appState);

            // Broadcast imported canvas to all peers in call
            if (call) {
              call.sendCustomEvent({
                type: "whiteboard-elements-update",
                elements,
                senderId: user?.id,
                senderName: user?.fullName || user?.firstName || "Peer",
                timestamp: Date.now(),
              }).catch(console.error);
            }

            toast({ title: "Whiteboard imported and synced with peers!" });
          }
        } catch (error) {
          console.error("Error importing whiteboard data:", error);
          toast({
            title: "Import Failed",
            description: "Please check that the JSON file is a valid Excalidraw format.",
            variant: "destructive",
          });
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }, [excalidrawAPI, saveToStorage, call, user, toast]);

  // Clear whiteboard for all participants
  const handleClear = useCallback(() => {
    if (!excalidrawAPI) return;

    if (
      confirm(
        "Are you sure you want to clear the collaborative whiteboard for everyone in this call?",
      )
    ) {
      excalidrawAPI.updateScene({
        elements: [],
        appState: {},
      });
      localStorage.removeItem(storageKey);

      if (call) {
        call.sendCustomEvent({
          type: "whiteboard-clear",
          senderId: user?.id,
          senderName: user?.fullName || user?.firstName || "Host",
          timestamp: Date.now(),
        }).catch(console.error);
      }

      toast({ title: "Whiteboard Cleared" });
    }
  }, [excalidrawAPI, storageKey, call, user, toast]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020813] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#040e1c] border-b border-cyan-500/20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="size-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Collaborative Whiteboard
              </h2>
              {/* Real-time Collaboration Status Pill */}
              {call ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold">
                  <span className={`size-1.5 rounded-full inline-block ${isLiveSyncActive ? "bg-cyan-400 animate-ping" : "bg-emerald-400"}`} />
                  <span>{isLiveSyncActive ? "Syncing..." : "Real-Time Sync Active"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                  <span>Local Canvas</span>
                </div>
              )}
            </div>
            {lastSyncedBy && (
              <p className="text-[11px] text-cyan-300/80 font-mono">
                Last updated by <span className="text-white font-bold">{lastSyncedBy}</span>
              </p>
            )}
          </div>
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Import Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImportJSON}
            className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-9 px-2.5 sm:px-3 text-xs flex items-center gap-1.5 border border-white/5"
            title="Import Excalidraw JSON"
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isExporting}
                className="btn-cyber-primary text-xs h-9 px-3 rounded-xl flex items-center gap-1.5 shadow-sm"
                title="Export Whiteboard"
              >
                <Download className="size-3.5" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#040e1c] border-cyan-500/20 text-white rounded-xl shadow-2xl p-1.5">
              <DropdownMenuLabel className="text-[10px] font-mono uppercase text-cyan-400 font-bold px-2 py-1">
                Save Lecture Notes
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleExportPNG}
                className="text-xs flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 focus:bg-cyan-500/20 focus:text-cyan-300"
              >
                <FileImage className="size-4 text-emerald-400" />
                <span>Download as PNG Image</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportSVG}
                className="text-xs flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 focus:bg-cyan-500/20 focus:text-cyan-300"
              >
                <FileCode className="size-4 text-sky-400" />
                <span>Download as SVG Vector</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10 my-1" />
              <DropdownMenuItem
                onClick={handleExportJSON}
                className="text-xs flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 focus:bg-cyan-500/20 focus:text-cyan-300"
              >
                <Download className="size-4 text-cyan-400" />
                <span>Backup Scene (JSON)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl h-9 px-2.5 sm:px-3 text-xs flex items-center gap-1.5 border border-rose-500/20"
            title="Clear canvas for all attendees"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl size-9 border border-white/5 ml-1"
            title="Close Whiteboard"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 min-h-0">
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          onChange={handleChange}
          theme="dark"
          initialData={{
            ...loadFromStorage(),
            appState: {
              viewBackgroundColor: "#020813",
              currentItemStrokeColor: "#00e5ff",
              currentItemBackgroundColor: "transparent",
              ...loadFromStorage().appState,
            },
          }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
