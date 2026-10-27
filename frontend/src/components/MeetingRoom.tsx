import { useState, useEffect, lazy, Suspense } from "react";
import {
  ReactionsButton,
  RecordCallButton,
  CancelCallButton,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from "@stream-io/video-react-sdk";
import { useSearchParams } from "react-router-dom";
import { useToast } from "./ui/use-toast";
import Chatbot from "./Chatbot";
import CustomParticipantsList from "./CustomParticipantsList";
import MeetingChat from "./MeetingChat";
import GithubRepoImporter from "./GithubRepoImporter";
const Whiteboard = lazy(() => import("./Whiteboard"));
import MeetingSideDock, { SideDockTab } from "./MeetingSideDock";
import {
  CustomVideoPlaceholder,
  CustomParticipantViewUI,
} from "./CustomVideoTileUI";
import {
  Users,
  Loader2,
  MonitorUp,
  MessageSquare,
  Github,
  Bot,
  Edit,
  Copy,
  Info,
  LayoutList,
  PhoneOff,
  Clock,
  ArrowRight,
  Radio,
  ShieldCheck,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronUp,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import Loader from "./Loader";
import EndCallButton from "./EndCallButton";
import { formatMeetingCode } from "@/lib/meetingUtils";
import AttendanceService from "@/services/AttendanceService";
import { useUser } from "@clerk/clerk-react";
import { useChat } from "@/contexts/ChatContext";
import { ClassroomProvider, useClassroom } from "@/contexts/ClassroomContext";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

// Animated SVG wave layer with dual-theme smooth crossfade
const OceanWaves = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg
      className="absolute bottom-0 left-0 w-full opacity-40 dark:opacity-60"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "70px" }}
    >
      <path
        d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1380,40 1440,60 L1440,120 L0,120 Z"
        fill="rgba(0, 100, 180, 0.08)"
        style={{ animation: "waveMove 8s ease-in-out infinite" }}
      />
      <path
        d="M0,80 C200,40 400,100 600,70 C800,40 1000,90 1200,65 C1320,50 1400,80 1440,75 L1440,120 L0,120 Z"
        fill="rgba(0, 150, 220, 0.05)"
        style={{ animation: "waveMove 12s ease-in-out infinite reverse" }}
      />
    </svg>

    <style>{`
      @keyframes waveMove {
        0%, 100% { d: path("M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1380,40 1440,60 L1440,120 L0,120 Z"); }
        50% { d: path("M0,40 C180,70 360,10 540,50 C720,90 900,10 1080,50 C1260,90 1380,30 1440,45 L1440,120 L0,120 Z"); }
      }
      @keyframes floatBubble {
        0% { transform: translateY(0) scale(1); opacity: 0.6; }
        50% { transform: translateY(-25px) scale(1.1); opacity: 0.9; }
        100% { transform: translateY(-50px) scale(0.8); opacity: 0; }
      }
    `}</style>
  </div>
);

// Floating particle bubbles
const Bubbles = () => {
  const bubbles = [
    { size: 3, left: "8%", delay: "0s", duration: "7s", bottom: "10%" },
    { size: 2, left: "28%", delay: "1.5s", duration: "9s", bottom: "5%" },
    { size: 4, left: "68%", delay: "3s", duration: "8s", bottom: "12%" },
    { size: 2, left: "88%", delay: "0.8s", duration: "10s", bottom: "8%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            bottom: b.bottom,
            background: `radial-gradient(circle at 30% 30%, rgba(150,220,255,0.9), rgba(0,150,220,0.3))`,
            border: "1px solid rgba(0,200,255,0.4)",
            boxShadow: "0 0 6px rgba(0,200,255,0.4)",
            animation: `floatBubble ${b.duration} ${b.delay} ease-in infinite`,
          }}
        />
      ))}
    </div>
  );
};

// Scanlines overlay for cyber depth
const Scanlines = () => (
  <div
    className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.025]"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,255,1) 2px, rgba(0,200,255,1) 3px)",
      backgroundSize: "100% 3px",
    }}
  />
);

interface ClassroomEndedModalProps {
  onLeave: () => void;
  endedByName?: string;
}

const ClassroomEndedModal = ({ onLeave, endedByName }: ClassroomEndedModalProps) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLeave();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onLeave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020813]/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[rgba(0,180,255,0.25)] bg-[#040e1c]/95 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(0,180,255,0.2)]">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,200,255,0.3) 0%, transparent 70%)",
          }}
        />

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shadow-[0_0_20px_rgba(0,180,255,0.2)]">
          <PhoneOff className="h-8 w-8" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 font-syne">
          Classroom Session Concluded
        </h2>
        <p className="text-sm text-neutral-300 mb-6 leading-relaxed">
          {endedByName
            ? `${endedByName} has ended this session for all participants.`
            : "The host has ended this classroom session for everyone."}
        </p>

        <div className="mb-6 flex items-center justify-center gap-2 text-xs text-neutral-400 bg-white/[0.04] py-2.5 px-4 rounded-xl border border-white/10">
          <Clock className="h-4 w-4 text-cyan-400 animate-spin" />
          <span>
            Redirecting to dashboard in{" "}
            <strong className="text-cyan-300 text-sm">{countdown}s</strong>
          </span>
        </div>

        <button
          onClick={onLeave}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(0,180,255,0.3)] hover:shadow-[0_0_28px_rgba(0,180,255,0.5)] active:scale-[0.98]"
        >
          <span>Return to Dashboard Now</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const MeetingRoomContent = () => {
  const [searchParams] = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const navigate = useNavigate();

  // Default to grid layout so single and multi-participant rooms are centered and spacious
  const [layout, setLayout] = useState<CallLayoutType>("grid");

  // Unified Side Dock state
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [activeDockTab, setActiveDockTab] = useState<SideDockTab>("chat");
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  const {
    useCallCallingState,
    useCallEndedAt,
    useParticipants,
    useLocalParticipant,
    useCameraState,
    useMicrophoneState,
    useScreenShareState,
  } = useCallStateHooks();

  const {
    screenShare,
    isMute: isScreenShareMuted,
  } = useScreenShareState();

  const {
    camera,
    isMute: isCameraMuted,
    devices: cameraDevices,
    selectedDevice: selectedCamera,
  } = useCameraState();

  const {
    microphone,
    isMute: isMicMuted,
    devices: micDevices,
    selectedDevice: selectedMicrophone,
  } = useMicrophoneState();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const { messages } = useChat();
  const { isHandRaised, toggleHandRaise, raisedHands } = useClassroom();

  const call = useCall();
  const { toast } = useToast();
  const { user } = useUser();

  const handleToggleScreenShare = async () => {
    const isDisplayMediaSupported =
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getDisplayMedia);

    if (!isDisplayMediaSupported) {
      toast({
        title: "Screen Share Unavailable",
        description:
          "Screen sharing is not supported on this mobile browser or device. Please use a desktop browser to share your screen.",
        variant: "destructive",
      });
      return;
    }

    try {
      await screenShare.toggle();
    } catch (err: any) {
      if (
        err?.name === "NotAllowedError" ||
        err?.message?.includes("Permission denied")
      ) {
        return; // User cancelled prompt
      }
      console.error("Screen share error:", err);
      toast({
        title: "Screen Share Failed",
        description: err?.message || "Could not toggle screen sharing.",
        variant: "destructive",
      });
    }
  };

  const callingState = useCallCallingState();
  const callEndedAt = useCallEndedAt();

  const [isEndedByHost, setIsEndedByHost] = useState(false);
  const [endedByName, setEndedByName] = useState<string | undefined>();

    // Ensure local video & audio are active and published upon entering joined call
  useEffect(() => {
    if (!call || callingState !== CallingState.JOINED) return;
    const isJoinMuted = window.sessionStorage.getItem("join_muted") === "true";
    if (isJoinMuted) {
      call.camera.disable().catch(console.warn);
      call.microphone.disable().catch(console.warn);
      return;
    }

    const ensureMediaTracks = async () => {
      try {
        const isCamPublishing = call.publisher?.isPublishing?.("video" as any);
        if (!isCamPublishing || !localParticipant?.videoStream) {
          if (call.camera.state.status === "enabled") {
            if (call.camera.state.mediaStream) {
              await call.publishVideoStream(call.camera.state.mediaStream, {
                preferredCodec: call.camera.preferredCodec,
              }).catch(async () => {
                await call.camera.disable();
                await call.camera.enable();
              });
            } else {
              await call.camera.disable();
              await call.camera.enable();
            }
          } else {
            await call.camera.enable();
          }
        }
      } catch (err) {
        console.warn("MeetingRoom camera auto-sync warning:", err);
      }

      try {
        const isMicPublishing = call.publisher?.isPublishing?.("audio" as any);
        if (!isMicPublishing) {
          if (call.microphone.state.status === "enabled") {
            if (call.microphone.state.mediaStream) {
              await call.publishAudioStream(call.microphone.state.mediaStream).catch(async () => {
                await call.microphone.disable();
                await call.microphone.enable();
              });
            } else {
              await call.microphone.disable();
              await call.microphone.enable();
            }
          } else {
            await call.microphone.enable();
          }
        }
      } catch (err) {
        console.warn("MeetingRoom mic auto-sync warning:", err);
      }
    };

    ensureMediaTracks();
  }, [call, callingState, localParticipant?.videoStream]);

  const handleToggleCamera = async () => {
    try {
      if (isCameraMuted) {
        await call?.camera.enable();
      } else {
        await call?.camera.disable();
      }
    } catch (err) {
      console.warn("Camera toggle fallback:", err);
      camera.toggle();
    }
  };

  const handleToggleMic = async () => {
    try {
      if (isMicMuted) {
        await call?.microphone.enable();
      } else {
        await call?.microphone.disable();
      }
    } catch (err) {
      console.warn("Mic toggle fallback:", err);
      microphone.toggle();
    }
  };

// Live ticking clock
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Listen for host end-call broadcast
  useEffect(() => {
    if (!call) return;

    const handleCustomEvent = (event: any) => {
      const data = event?.custom || event;
      if (data?.type === "meeting-ended-by-host") {
        setIsEndedByHost(true);
        if (data?.endedBy) {
          setEndedByName(data.endedBy);
        }
      }
    };

    call.on("custom", handleCustomEvent);
    return () => {
      call.off("custom", handleCustomEvent);
    };
  }, [call]);

  // Track attendance when user joins or leaves meeting
  useEffect(() => {
    if (!call || !user || callingState !== CallingState.JOINED) return;

    const meetingId = call.id;
    const userId = user.id;
    const userName = user.fullName || user.username || "Unknown User";

    if (callingState === CallingState.JOINED && meetingId && userId) {
      AttendanceService.recordJoin(meetingId, userId, userName).catch(
        (error) => {
          console.error("Failed to record attendance join:", error);
        }
      );
    }

    const handleLeave = (isUnload = false) => {
      if (meetingId && userId) {
        if (isUnload) {
          AttendanceService.recordLeaveBeacon(meetingId, userId);
        } else {
          AttendanceService.recordLeave(meetingId, userId).catch((error) => {
            console.error("Failed to record attendance leave:", error);
          });
        }
      }
    };

    const handleBeforeUnload = () => {
      handleLeave(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      handleLeave(false);
    };
  }, [call, user, callingState]);

  // Track participant join/leave events
  useEffect(() => {
    if (!call) return;

    const handleParticipantJoined = (event: any) => {
      const participant = event.participant;
      if (participant && participant.userId && participant.name) {
        AttendanceService.recordJoin(
          call.id,
          participant.userId,
          participant.name
        ).catch((error) => {
          console.error("Failed to record participant join:", error);
        });
      }
    };

    const handleParticipantLeft = (event: any) => {
      const participant = event.participant;
      if (participant && participant.userId) {
        AttendanceService.recordLeave(call.id, participant.userId).catch(
          (error) => {
            console.error("Failed to record participant leave:", error);
          }
        );
      }
    };

    call.on("participantJoined", handleParticipantJoined);
    call.on("participantLeft", handleParticipantLeft);

    return () => {
      call.off("participantJoined", handleParticipantJoined);
      call.off("participantLeft", handleParticipantLeft);
    };
  }, [call]);

  const isCallEnded =
    Boolean(callEndedAt) ||
    Boolean(call?.state.endedAt) ||
    isEndedByHost;

  if (isCallEnded) {
    return (
      <ClassroomEndedModal
        onLeave={() => navigate("/")}
        endedByName={endedByName}
      />
    );
  }

  if (callingState !== CallingState.JOINED) return <Loader />;

  const meetingCode = call?.state.custom?.meetingCode || call?.id;
  const meetingHeading = call?.state.custom?.heading || "Instant Meeting";
  const meetingSubheading = call?.state.custom?.subheading;
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const meetingLink = call ? `${baseUrl}/meeting/${call.id}` : "";

  const totalParticipantsCount =
    (localParticipant ? 1 : 0) +
    participants.filter((p) => p.userId !== localParticipant?.userId).length;

  const handleToggleDock = (tab: SideDockTab) => {
    if (isDockOpen && activeDockTab === tab) {
      setIsDockOpen(false);
    } else {
      setActiveDockTab(tab);
      setIsDockOpen(true);
    }
  };

  const copyMeetingCode = () => {
    if (meetingCode) {
      navigator.clipboard.writeText(meetingCode);
      toast({ title: "Meeting Code Copied", description: meetingCode });
    }
  };

  const copyMeetingLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      toast({ title: "Meeting Link Copied", description: "URL ready to share." });
    }
  };

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return (
          <PaginatedGridLayout
            VideoPlaceholder={CustomVideoPlaceholder}
            ParticipantViewUI={CustomParticipantViewUI}
          />
        );
      case "speaker-right":
        return (
          <SpeakerLayout
            participantsBarPosition="left"
            VideoPlaceholder={CustomVideoPlaceholder}
            ParticipantViewUISpotlight={CustomParticipantViewUI}
            ParticipantViewUIBar={CustomParticipantViewUI}
          />
        );
      default:
        return (
          <SpeakerLayout
            participantsBarPosition="right"
            VideoPlaceholder={CustomVideoPlaceholder}
            ParticipantViewUISpotlight={CustomParticipantViewUI}
            ParticipantViewUIBar={CustomParticipantViewUI}
          />
        );
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden text-white bg-[#020813] select-none flex flex-col justify-between">
      {/* Background Atmosphere */}
      <OceanWaves />
      <Bubbles />
      <Scanlines />

      {/* Ambient Radial Glowing Orbs */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 180, 255, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, transparent 70%)",
        }}
      />

      {/* Scoped Stream CSS Overrides to hide duplicate labels and style tiles & controls */}
      <style>{`
        /* Suppress Stream's default label so text duplicates never show */
        .str-video__participant-details {
          display: none !important;
        }
        /* Style Stream's video tile container with Cyberpunk border & 16:9 ratio */
        .str-video__participant-view {
          border-radius: 1.25rem !important;
          border: 1px solid rgba(0, 180, 255, 0.25) !important;
          overflow: hidden !important;
          background: #030a16 !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
          aspect-ratio: 16/9 !important;
        }
        .str-video__participant-view video,
        .str-video__participant-view .str-video__video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.25rem !important;
        }
        /* Stream's grid layout centering and full widescreen fitting */
        .str-video__paginated-grid-layout {
          height: 100% !important;
          width: 100% !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .str-video__paginated-grid-layout .str-video__paginated-grid-layout__group {
          max-width: min(94vw, 1400px) !important;
          max-height: calc(100vh - 160px) !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 1rem !important;
          padding: 0 !important;
        }
        .str-video__paginated-grid-layout .str-video__paginated-grid-layout__group.str-video__paginated-grid-layout--one .str-video__participant-view {
          width: 100% !important;
          max-width: min(88vw, 1200px) !important;
          max-height: calc(100vh - 170px) !important;
          aspect-ratio: 16/9 !important;
          height: auto !important;
          margin: auto !important;
        }
        /* Stream circle icon buttons (ScreenShare, Reactions, Record) */
        .str-video__circle-button,
        .str-video__call-controls__button {
          background: #0e1e33 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 0.75rem !important;
          color: #e0f2fe !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
        }
        .str-video__circle-button:hover,
        .str-video__call-controls__button:hover {
          background: #152c4a !important;
          border-color: rgba(0, 180, 255, 0.45) !important;
          color: #38bdf8 !important;
          box-shadow: 0 0 12px rgba(0, 180, 255, 0.25) !important;
        }
        .str-video__cancel-call-button,
        button[data-testid="cancel-call-button"] {
          background: rgba(225, 29, 72, 0.2) !important;
          border: 1px solid rgba(244, 63, 94, 0.45) !important;
          color: #fb7185 !important;
          border-radius: 0.75rem !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .str-video__cancel-call-button:hover,
        button[data-testid="cancel-call-button"]:hover {
          background: rgba(225, 29, 72, 0.4) !important;
          border-color: rgba(244, 63, 94, 0.75) !important;
          box-shadow: 0 0 16px rgba(244, 63, 94, 0.45) !important;
        }
      `}</style>

      {/* ========================================================
          FLAGSHIP CYBER TOP COCKPIT BAR
      ======================================================== */}
      <header className="fixed top-3 left-3 right-3 sm:left-6 sm:right-6 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Meeting Branding & Title Pill */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[#040e1c]/90 backdrop-blur-xl border border-[rgba(0,180,255,0.22)] shadow-lg max-w-sm sm:max-w-md">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-cyan-400">
                LIVE STAGE
              </span>
              {meetingCode && (
                <button
                  onClick={copyMeetingCode}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                  title="Copy meeting code"
                >
                  <span>{formatMeetingCode(meetingCode)}</span>
                  <Copy size={10} />
                </button>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate font-syne">
              {meetingHeading}
            </h1>
          </div>
        </div>

        {/* Center: Live Broadcast Telemetry (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-[#040e1c]/85 backdrop-blur-xl border border-[rgba(0,180,255,0.2)] shadow-lg">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
            <Clock size={12} className="text-cyan-400 animate-pulse" />
            <span>{time}</span>
          </div>
          <span className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
            <Radio size={12} className="text-cyan-400" />
            <span>SFU Mesh</span>
          </div>
          <span className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <ShieldCheck size={13} />
            <span>Encrypted</span>
          </div>
        </div>

        {/* Right: Quick Tools (People Count & Info Dropdown) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* People Count Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#040e1c]/85 backdrop-blur-xl border border-white/10 text-xs text-neutral-300 shadow-lg">
            <Users size={13} className="text-cyan-400" />
            <span className="font-bold text-white">{totalParticipantsCount}</span>
            <span className="text-neutral-400 text-[11px]">in stage</span>
          </div>

          {/* Meeting Info Dropdown Button */}
          {meetingCode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="cursor-pointer rounded-2xl bg-[#040e1c]/85 backdrop-blur-xl border border-white/10 p-2 hover:bg-[#091b33] text-neutral-300 hover:text-white transition-colors shadow-lg"
                  title="Classroom Information"
                >
                  <Info size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                className="border-[rgba(0,180,255,0.25)] bg-[#040e1c]/95 backdrop-blur-2xl text-white min-w-[290px] p-4 shadow-2xl rounded-2xl"
              >
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Classroom Information
                </DropdownMenuLabel>

                <div className="mb-3 p-3 bg-white/[0.04] rounded-xl border border-white/5">
                  <h3 className="font-bold text-white text-sm font-syne mb-0.5">
                    {meetingHeading}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {meetingSubheading || "Interactive Collaborative Classroom"}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Meeting Code */}
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-neutral-400 mb-1 block">
                      Stage ID Code
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl">
                        <p className="text-sm font-mono font-bold tracking-wider text-center text-cyan-300 uppercase">
                          {formatMeetingCode(meetingCode)}
                        </p>
                      </div>
                      <button
                        onClick={copyMeetingCode}
                        className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-300 border border-white/10 transition-colors"
                        title="Copy Code"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Meeting URL */}
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-neutral-400 mb-1 block">
                      Direct Invite Link
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl">
                        <p className="text-xs text-neutral-300 truncate font-mono">
                          {meetingLink}
                        </p>
                      </div>
                      <button
                        onClick={copyMeetingLink}
                        className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-300 border border-white/10 transition-colors"
                        title="Copy Link"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* ========================================================
          MAIN VIDEO STAGE (Centered & Responsive)
      ======================================================== */}
      <div
        className={cn(
          "relative flex flex-1 size-full items-center justify-center pt-14 pb-20 px-2 sm:px-4 transition-all duration-300 ease-in-out",
          isDockOpen && "xl:pr-[420px]"
        )}
      >
        <div
          className={cn(
            "flex size-full items-center justify-center transition-all duration-300",
            isDockOpen ? "max-w-[calc(100%-420px)]" : "max-w-7xl"
          )}
        >
          <div className="w-full h-full flex items-center justify-center">
            <CallLayout />
          </div>
        </div>
      </div>

      {/* Unified In-Meeting Sliding Side Dock */}
      <MeetingSideDock
        isOpen={isDockOpen}
        activeTab={activeDockTab}
        onTabChange={(tab) => setActiveDockTab(tab)}
        onClose={() => setIsDockOpen(false)}
        participantCount={totalParticipantsCount}
        unreadCount={messages.length}
      >
        {activeDockTab === "chat" && (
          <MeetingChat embedded onClose={() => setIsDockOpen(false)} />
        )}
        {activeDockTab === "participants" && (
          <CustomParticipantsList embedded onClose={() => setIsDockOpen(false)} />
        )}
        {activeDockTab === "ai" && (
          <Chatbot embedded onClose={() => setIsDockOpen(false)} />
        )}
        {activeDockTab === "github" && (
          <GithubRepoImporter embedded onClose={() => setIsDockOpen(false)} />
        )}
      </MeetingSideDock>

      {/* Fullscreen Whiteboard Overlay (Lazy Loaded) */}
      {showWhiteboard && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020813]/90 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[#071322] border border-cyan-500/30 text-cyan-400 shadow-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-sm font-medium text-slate-200">
                  Initializing Collaborative Canvas...
                </span>
              </div>
            </div>
          }
        >
          <Whiteboard onClose={() => setShowWhiteboard(false)} />
        </Suspense>
      )}

      {/* ========================================================
          UNIFIED BOTTOM COCKPIT DOCK (Single Sleek Bar, Industry-Standard Groups)
      ======================================================== */}
      <div className="fixed bottom-3 inset-x-0 z-40 flex items-center justify-center px-2 pointer-events-none">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto px-3.5 py-2 rounded-2xl bg-[#040e1c]/95 backdrop-blur-2xl border border-[rgba(0,180,255,0.28)] shadow-[0_10px_40px_rgba(0,0,0,0.75)] max-w-[98vw] overflow-x-auto no-scrollbar">

          {/* 1. Core Media Controls (Sleek Mic & Cam with Dropdown Device Selector) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Microphone Toggle & Device Selector */}
            <div
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 border shadow-sm",
                isMicMuted
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                  : "bg-[#0e1e33] border-white/10 hover:border-cyan-400/40 text-neutral-200 hover:text-cyan-300"
              )}
            >
              <button
                onClick={handleToggleMic}
                className="cursor-pointer rounded-l-xl p-2 sm:px-2.5 sm:py-1.5 transition-colors flex items-center gap-1.5 active:scale-95"
                title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMicMuted ? (
                  <MicOff size={16} className="text-rose-400" />
                ) : (
                  <Mic size={16} className="text-cyan-400" />
                )}
                <span className="hidden xl:inline text-xs font-medium">
                  {isMicMuted ? "Mic Off" : "Mic On"}
                </span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="cursor-pointer rounded-r-xl py-2 px-1 sm:py-1.5 sm:px-1.5 text-neutral-400 hover:text-white hover:bg-white/10 border-l border-white/10 transition-colors"
                    title="Select Microphone Input"
                  >
                    <ChevronUp size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="border-[rgba(0,180,255,0.25)] bg-[#040e1c]/95 backdrop-blur-2xl text-white rounded-xl min-w-[210px] p-1.5 shadow-2xl z-50"
                >
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-1 flex items-center gap-1.5">
                    <Mic size={11} />
                    Microphone Input
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="border-white/10" />
                  {micDevices && micDevices.length > 0 ? (
                    micDevices.map((d) => (
                      <DropdownMenuItem
                        key={d.deviceId}
                        onClick={() => microphone.select(d.deviceId)}
                        className={cn(
                          "cursor-pointer text-xs py-1.5 px-2 rounded-lg flex items-center justify-between transition-colors",
                          selectedMicrophone === d.deviceId
                            ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                            : "hover:bg-white/5 text-neutral-300 hover:text-white"
                        )}
                      >
                        <span className="truncate max-w-[170px]">
                          {d.label || `Microphone ${d.deviceId.slice(0, 5)}...`}
                        </span>
                        {selectedMicrophone === d.deviceId && (
                          <Check size={12} className="text-cyan-400 ml-1.5 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-xs text-neutral-400">
                      Default System Microphone
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Camera Toggle & Device Selector */}
            <div
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 border shadow-sm",
                isCameraMuted
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                  : "bg-[#0e1e33] border-white/10 hover:border-cyan-400/40 text-neutral-200 hover:text-cyan-300"
              )}
            >
              <button
                onClick={handleToggleCamera}
                className="cursor-pointer rounded-l-xl p-2 sm:px-2.5 sm:py-1.5 transition-colors flex items-center gap-1.5 active:scale-95"
                title={isCameraMuted ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isCameraMuted ? (
                  <VideoOff size={16} className="text-rose-400" />
                ) : (
                  <Video size={16} className="text-cyan-400" />
                )}
                <span className="hidden xl:inline text-xs font-medium">
                  {isCameraMuted ? "Cam Off" : "Cam On"}
                </span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="cursor-pointer rounded-r-xl py-2 px-1 sm:py-1.5 sm:px-1.5 text-neutral-400 hover:text-white hover:bg-white/10 border-l border-white/10 transition-colors"
                    title="Select Camera Input"
                  >
                    <ChevronUp size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="border-[rgba(0,180,255,0.25)] bg-[#040e1c]/95 backdrop-blur-2xl text-white rounded-xl min-w-[210px] p-1.5 shadow-2xl z-50"
                >
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-1 flex items-center gap-1.5">
                    <Video size={11} />
                    Camera Device
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="border-white/10" />
                  {cameraDevices && cameraDevices.length > 0 ? (
                    cameraDevices.map((d) => (
                      <DropdownMenuItem
                        key={d.deviceId}
                        onClick={() => camera.select(d.deviceId)}
                        className={cn(
                          "cursor-pointer text-xs py-1.5 px-2 rounded-lg flex items-center justify-between transition-colors",
                          selectedCamera === d.deviceId
                            ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                            : "hover:bg-white/5 text-neutral-300 hover:text-white"
                        )}
                      >
                        <span className="truncate max-w-[170px]">
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}...`}
                        </span>
                        {selectedCamera === d.deviceId && (
                          <Check size={12} className="text-cyan-400 ml-1.5 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-xs text-neutral-400">
                      Default System Camera
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 shrink-0" />

          {/* 2. Collaboration & Sharing (Screen Share, Whiteboard, Hand, Reactions) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Screen Share Control with Mobile Capability Guard */}
            <button
              onClick={handleToggleScreenShare}
              className={cn(
                "cursor-pointer rounded-xl p-2 sm:px-2.5 sm:py-1.5 transition-all flex items-center gap-1.5 border shrink-0 active:scale-95",
                !isScreenShareMuted
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-[#0e1e33] text-neutral-300 hover:text-cyan-300 hover:bg-[#152c4a] border-white/10"
              )}
              title={!isScreenShareMuted ? "Stop Sharing Screen" : "Share Your Screen"}
            >
              <MonitorUp
                size={16}
                className={!isScreenShareMuted ? "text-white" : "text-cyan-400"}
              />
              <span className="hidden xl:inline text-xs font-medium">
                {!isScreenShareMuted ? "Sharing" : "Share"}
              </span>
            </button>

            {/* Whiteboard Button */}
            <button
              onClick={() => setShowWhiteboard((prev) => !prev)}
              className={cn(
                "cursor-pointer rounded-xl p-2 sm:px-2.5 sm:py-1.5 transition-all flex items-center gap-1.5 border shrink-0",
                showWhiteboard
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                  : "bg-[#0e1e33] text-neutral-300 hover:text-cyan-300 hover:bg-[#152c4a] border-white/10"
              )}
              title="Toggle Collaborative Whiteboard"
            >
              <Edit size={16} />
              <span className="hidden xl:inline text-xs font-medium">Board</span>
            </button>

            {/* Hand Raise Button */}
            <button
              onClick={toggleHandRaise}
              className={cn(
                "cursor-pointer rounded-xl p-2 sm:px-2.5 sm:py-1.5 transition-all flex items-center gap-1.5 border shrink-0",
                isHandRaised
                  ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.5)] animate-pulse"
                  : "bg-[#0e1e33] text-neutral-300 hover:text-amber-300 hover:bg-[#152c4a] border-white/10"
              )}
              title={isHandRaised ? "Lower your hand" : "Raise your hand to ask a question"}
            >
              <span className="text-sm leading-none">✋</span>
              <span className="hidden xl:inline text-xs font-medium">
                {isHandRaised ? "Raised" : "Hand"}
              </span>
            </button>

            <ReactionsButton />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 shrink-0" />

          {/* 3. Sliding Drawers (Chat, People, AI Tutor, Code Importer) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Chat Drawer Toggle */}
            <button
              onClick={() => handleToggleDock("chat")}
              className={cn(
                "cursor-pointer rounded-xl p-2 sm:px-2.5 sm:py-1.5 transition-all flex items-center gap-1.5 border shrink-0 relative",
                isDockOpen && activeDockTab === "chat"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                  : "bg-[#0e1e33] text-neutral-300 hover:text-cyan-300 hover:bg-[#152c4a] border-white/10"
              )}
              title="Toggle Live Chat"
            >
              <MessageSquare size={16} />
              <span className="hidden xl:inline text-xs font-medium">Chat</span>
              {messages.length > 0 && (
                <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-cyan-400 text-[#020b16] px-1 text-[9px] font-bold">
                  {messages.length}
                </span>
              )}
            </button>

            {/* Participants Drawer Toggle */}
            <button
              onClick={() => handleToggleDock("participants")}
              className={cn(
                "cursor-pointer rounded-xl p-2 sm:px-2.5 sm:py-1.5 transition-all flex items-center gap-1.5 border shrink-0",
                isDockOpen && activeDockTab === "participants"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                  : "bg-[#0e1e33] text-neutral-300 hover:text-cyan-300 hover:bg-[#152c4a] border-white/10"
              )}
              title="View Stage Participants"
            >
              <Users size={16} />
              <span className="hidden xl:inline text-xs font-medium">People</span>
              {raisedHands.size > 0 ? (
                <span
                  className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-400 text-black px-1 text-[9px] font-extrabold animate-pulse"
                  title={`${raisedHands.size} hand(s) raised`}
                >
                  ✋ {raisedHands.size}
                </span>
              ) : totalParticipantsCount > 0 ? (
                <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 px-1 text-[9px] font-bold">
                  {totalParticipantsCount}
                </span>
              ) : null}
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => handleToggleDock("ai")}
              className={cn(
                "cursor-pointer rounded-xl p-2 sm:px-2.5 sm:py-1.5 transition-all flex items-center gap-1.5 border shrink-0",
                isDockOpen && activeDockTab === "ai"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                  : "bg-[#0e1e33] text-neutral-300 hover:text-cyan-300 hover:bg-[#152c4a] border-white/10"
              )}
              title="AI Study Tutor"
            >
              <Bot size={16} />
              <span className="hidden xl:inline text-xs font-medium">AI</span>
            </button>

            {/* GitHub Code Explorer Button */}
            <button
              onClick={() => handleToggleDock("github")}
              className={cn(
                "cursor-pointer rounded-xl p-2 sm:px-2.5 sm:py-1.5 transition-all flex items-center gap-1.5 border shrink-0",
                isDockOpen && activeDockTab === "github"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                  : "bg-[#0e1e33] text-neutral-300 hover:text-cyan-300 hover:bg-[#152c4a] border-white/10"
              )}
              title="GitHub Repository Code Review"
            >
              <Github size={16} />
              <span className="hidden xl:inline text-xs font-medium">Code</span>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 shrink-0" />

          {/* 4. Controls & Layout Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="cursor-pointer rounded-xl bg-[#0e1e33] p-2 hover:bg-[#152c4a] text-neutral-300 hover:text-cyan-300 transition-colors border border-white/10 shrink-0 shadow-sm"
                  title="Switch Video Layout"
                >
                  <LayoutList size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-[rgba(0,180,255,0.2)] bg-[#040e1c] text-white rounded-xl">
                {["Grid", "Speaker-Left", "Speaker-Right"].map((item, index) => (
                  <div key={index}>
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-cyan-500/20 text-xs py-1.5"
                      onClick={() =>
                        setLayout(item.toLowerCase() as CallLayoutType)
                      }
                    >
                      {item}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="border-white/10" />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <CallStatsButton />
            <RecordCallButton />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 shrink-0" />

          {/* 5. Call Termination Group (Leave & End for All) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <CancelCallButton onLeave={() => navigate("/")} />
            {!isPersonalRoom && <EndCallButton />}
          </div>

        </div>
      </div>
    </section>
  );
};

const MeetingRoom = () => {
  return (
    <ClassroomProvider>
      <MeetingRoomContent />
    </ClassroomProvider>
  );
};

export default MeetingRoom;
