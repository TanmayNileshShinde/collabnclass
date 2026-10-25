import React from "react";
import { MessageSquare, Users, Bot, Github, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallStateHooks } from "@stream-io/video-react-sdk";

export type SideDockTab = "chat" | "participants" | "ai" | "github";

interface MeetingSideDockProps {
  isOpen: boolean;
  activeTab: SideDockTab;
  onTabChange: (tab: SideDockTab) => void;
  onClose: () => void;
  participantCount?: number;
  unreadCount?: number;
  children: React.ReactNode;
}

const MeetingSideDock = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  participantCount,
  unreadCount,
  children,
}: MeetingSideDockProps) => {
  const { useDominantSpeaker, useParticipants } = useCallStateHooks();
  const dominantSpeaker = useDominantSpeaker();
  const participants = useParticipants();

  // Find active speaker if any
  const speakingParticipant =
    (dominantSpeaker?.isSpeaking ? dominantSpeaker : null) ||
    participants.find((p) => p.isSpeaking);

  const tabs: { id: SideDockTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "chat",
      label: "Chat",
      icon: <MessageSquare className="h-4 w-4" />,
      badge: unreadCount,
    },
    {
      id: "participants",
      label: "People",
      icon: <Users className="h-4 w-4" />,
      badge: participantCount,
    },
    {
      id: "ai",
      label: "AI Tutor",
      icon: <Bot className="h-4 w-4" />,
    },
    {
      id: "github",
      label: "Code",
      icon: <Github className="h-4 w-4" />,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[420px] flex flex-col transition-transform duration-300 ease-in-out",
        "bg-[#040e1c]/95 backdrop-blur-2xl border-l border-[rgba(0,180,255,0.18)] shadow-[-16px_0_40px_rgba(0,0,0,0.6)]",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      )}
      aria-label="Meeting tools side dock"
    >
      {/* Top Edge Glow */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(0,200,255,0.6), rgba(0,120,255,0.3), transparent)",
        }}
      />

      {/* Dock Header with Tabs */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[rgba(0,180,255,0.14)] bg-[#020b16]/70 gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "text-white bg-gradient-to-r from-blue-600/90 to-cyan-600/90 shadow-[0_0_14px_rgba(0,180,255,0.35)] border border-[rgba(0,220,255,0.4)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span
                    className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none",
                      isActive
                        ? "bg-white text-blue-900"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Header Section: Active Speaker Indicator + Close */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          {speakingParticipant && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs shadow-[0_0_12px_rgba(0,180,255,0.25)] animate-pulse"
              title={`${speakingParticipant.name || "Participant"} is currently speaking`}
            >
              <Volume2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[110px] text-[11px] font-semibold text-cyan-200">
                {speakingParticipant.name || "Speaking..."}
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dock Body / Active Tab Content */}
      <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </div>
    </aside>
  );
};

export default MeetingSideDock;
