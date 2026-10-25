import { useEffect, useState } from "react";
import {
  VideoPreview,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings2,
  Check,
  Copy,
  ChevronLeft,
  ShieldCheck,
  Radio,
  Clock,
  Volume2,
  Loader2,
  Camera,
  Play,
  SlidersHorizontal,
  X,
} from "lucide-react";

import Alert from "./Alert";
import { useToast } from "./ui/use-toast";
import { formatMeetingCode } from "@/lib/meetingUtils";
import { cn } from "@/lib/utils";

// Animated SVG wave layer with dual-theme smooth crossfade (aligned with Home & Upcoming)
const OceanWaves = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Dark Theme Waves */}
    <svg
      className="absolute bottom-0 left-0 w-full transition-opacity duration-300 dark:opacity-100 opacity-0"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "80px" }}
    >
      <path
        d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1380,40 1440,60 L1440,120 L0,120 Z"
        fill="rgba(0, 100, 180, 0.07)"
        style={{ animation: "waveMove 8s ease-in-out infinite" }}
      />
      <path
        d="M0,80 C200,40 400,100 600,70 C800,40 1000,90 1200,65 C1320,50 1400,80 1440,75 L1440,120 L0,120 Z"
        fill="rgba(0, 150, 220, 0.05)"
        style={{ animation: "waveMove 12s ease-in-out infinite reverse" }}
      />
    </svg>

    {/* Light Theme Waves */}
    <svg
      className="absolute bottom-0 left-0 w-full transition-opacity duration-300 dark:opacity-0 opacity-100"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "80px" }}
    >
      <path
        d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1380,40 1440,60 L1440,120 L0,120 Z"
        fill="rgba(2, 132, 199, 0.08)"
        style={{ animation: "waveMove 8s ease-in-out infinite" }}
      />
      <path
        d="M0,80 C200,40 400,100 600,70 C800,40 1000,90 1200,65 C1320,50 1400,80 1440,75 L1440,120 L0,120 Z"
        fill="rgba(14, 165, 233, 0.06)"
        style={{ animation: "waveMove 12s ease-in-out infinite reverse" }}
      />
    </svg>

    <style>{`
      @keyframes waveMove {
        0%, 100% { d: path("M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1380,40 1440,60 L1440,120 L0,120 Z"); }
        50% { d: path("M0,40 C180,70 360,10 540,50 C720,90 900,10 1080,50 C1260,90 1380,30 1440,45 L1440,120 L0,120 Z"); }
      }
      @keyframes floatBubble {
        0% { transform: translateY(0) scale(1); opacity: 0.7; }
        50% { transform: translateY(-30px) scale(1.1); opacity: 1; }
        100% { transform: translateY(-60px) scale(0.8); opacity: 0; }
      }
    `}</style>
  </div>
);

// Floating particle bubbles
const Bubbles = () => {
  const bubbles = [
    { size: 4, left: "10%", delay: "0s", duration: "6s", bottom: "12%" },
    { size: 3, left: "30%", delay: "1.5s", duration: "8s", bottom: "6%" },
    { size: 5, left: "60%", delay: "3s", duration: "7s", bottom: "14%" },
    { size: 3, left: "85%", delay: "0.8s", duration: "9s", bottom: "9%" },
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
    className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-300 dark:opacity-[0.03] opacity-0"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,255,1) 2px, rgba(0,200,255,1) 3px)",
      backgroundSize: "100% 3px",
    }}
  />
);

interface MeetingSetupProps {
  setIsSetupComplete: (value: boolean) => void;
}

const MeetingSetup = ({ setIsSetupComplete }: MeetingSetupProps) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const call = useCall();
  const { toast } = useToast();

  const {
    useCallEndedAt,
    useCallStartsAt,
    useCameraState,
    useMicrophoneState,
    useSpeakerState,
  } = useCallStateHooks();

  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  const {
    devices: cameraDevices,
    selectedDevice: selectedCamera,
    isMute: isCameraMuted,
  } = useCameraState();

  const {
    devices: micDevices,
    selectedDevice: selectedMicrophone,
    isMute: isMicMuted,
  } = useMicrophoneState();

  const {
    devices: speakerDevices,
    selectedDevice: selectedSpeaker,
  } = useSpeakerState();

  const [isJoining, setIsJoining] = useState(false);
  const [isMicCamToggled, setIsMicCamToggled] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // Live ticking clock
  const now = new Date();
  const [time, setTime] = useState(
    now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!call) {
    throw new Error("useStreamCall must be used within a StreamCall component.");
  }

  // Handle master "Join with mic & camera off" toggle
  useEffect(() => {
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call.camera, call.microphone]);

  const toggleCamera = async () => {
    try {
      if (isCameraMuted) {
        await call.camera.enable();
      } else {
        await call.camera.disable();
      }
    } catch (err) {
      console.error("Camera toggle failed:", err);
    }
  };

  const toggleMic = async () => {
    try {
      if (isMicMuted) {
        await call.microphone.enable();
      } else {
        await call.microphone.disable();
      }
    } catch (err) {
      console.error("Microphone toggle failed:", err);
    }
  };

  const handleJoin = async () => {
    try {
      setIsJoining(true);
      await call.join();
      setIsSetupComplete(true);
    } catch (error) {
      console.error("Failed to join call:", error);
      toast({
        title: "Failed to join meeting",
        description:
          error instanceof Error
            ? error.message
            : "Unable to connect to the call. Please check your camera/mic permissions and internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const meetingId = call.id;
  const isPersonalRoom = window.location.search.includes("personal=true");
  const meetingTitle =
    call.state.custom?.heading ||
    call.state.custom?.description ||
    (isPersonalRoom
      ? `${user?.fullName || user?.username || "Host"}'s Personal Classroom`
      : "Classroom Stage Session");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meetingId);
    setIsCopiedCode(true);
    toast({
      title: "Meeting Code Copied",
      description: meetingId,
    });
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  if (callTimeNotArrived) {
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );
  }

  if (callHasEnded) {
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );
  }

  // Custom Viewport when Camera is Disabled
  const CustomDisabledVideoPreview = () => (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4 text-center select-none dark:bg-[#030b17]/95 bg-slate-900/95 overflow-hidden">
      {/* Ambient Pulsing Radar Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-cyan-500/20 animate-ping opacity-30" />
        <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-sky-500/10" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2.5 sm:gap-3">
        {/* User Avatar with Glowing Cyber Ring */}
        <div className="relative">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="User"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-[0_0_24px_rgba(0,180,255,0.35)]"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center bg-cyan-500/15 border-2 border-cyan-400/50 text-cyan-300 font-bold text-2xl font-syne shadow-[0_0_24px_rgba(0,180,255,0.35)]">
              {user?.firstName?.charAt(0) || "U"}
            </div>
          )}
          <span className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg bg-rose-500/25 border border-rose-500/50 text-rose-400 shadow-md">
            <VideoOff size={13} />
          </span>
        </div>

        <div>
          <h4 className="text-sm sm:text-base font-bold font-syne text-white tracking-tight">
            Camera is Off
          </h4>
          <p className="text-[11px] sm:text-xs text-neutral-400 max-w-xs mt-0.5">
            Turn on camera to preview your video before joining.
          </p>
        </div>

        <button
          onClick={toggleCamera}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-all active:scale-95 shadow-[0_0_12px_rgba(0,180,255,0.2)]"
        >
          <Camera size={13} />
          <span>Turn On Camera</span>
        </button>
      </div>
    </div>
  );

  // Custom Viewport when No Camera is Detected
  const CustomNoCameraPreview = () => (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4 text-center select-none dark:bg-[#030b17]/95 bg-slate-900/95">
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2 shadow-[0_0_16px_rgba(245,158,11,0.2)]">
        <VideoOff size={22} />
      </div>
      <h4 className="text-sm font-bold font-syne text-white">
        No Camera Detected
      </h4>
      <p className="text-[11px] text-neutral-400 max-w-xs mt-0.5">
        You can still participate with your microphone and screen share.
      </p>
    </div>
  );

  return (
    <div className="relative h-screen max-h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden transition-colors duration-300 dark:bg-[#020813] bg-slate-50 flex flex-col justify-between p-2.5 sm:p-4 lg:p-5 select-none">
      {/* Background Atmosphere */}
      <OceanWaves />
      <Bubbles />
      <Scanlines />

      {/* Ambient Orbs */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none blur-3xl transition-opacity duration-300 dark:opacity-25 opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 180, 255, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none blur-3xl transition-opacity duration-300 dark:opacity-20 opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, transparent 70%)",
        }}
      />

      {/* Responsive Viewport CSS Overrides */}
      <style>{`
        .meeting-setup-viewport .str-video__video-preview-container {
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          min-height: 0 !important;
          max-height: 100% !important;
          border: none !important;
          border-radius: 1.25rem !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: hidden !important;
        }
        .meeting-setup-viewport .str-video__video-preview {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.25rem !important;
        }
      `}</style>

      {/* ========================================================
          COMPACT TOP HUD HEADER (Fixed Height, Never Causes Scroll)
      ======================================================== */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between gap-3 h-10 sm:h-12 shrink-0">
        {/* Left: Back / Exit */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold dark:bg-[#040e1c]/80 bg-white/80 backdrop-blur-xl border dark:border-[rgba(0,180,255,0.2)] border-sky-200/80 dark:text-neutral-300 text-slate-700 hover:dark:text-white hover:text-slate-900 transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft size={15} />
          <span>Dashboard</span>
        </button>

        {/* Center Tag: Cyber Stage Check-in */}
        <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border dark:border-cyan-500/30 border-sky-400/40 dark:bg-cyan-950/40 bg-sky-100/80 dark:text-cyan-300 text-sky-700 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span>Pre-Flight Chamber • Audio & Video Diagnostics</span>
        </div>

        {/* Right: Clock & Encryption */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl dark:bg-[#030b17]/80 bg-white/80 border dark:border-[rgba(0,180,255,0.2)] border-sky-200/80 text-xs font-mono dark:text-cyan-300 text-slate-800 shadow-sm backdrop-blur-xl">
            <Clock size={13} className="text-cyan-400 animate-pulse" />
            <span>{time} • {dateStr}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold dark:bg-cyan-500/10 bg-sky-50 border dark:border-cyan-500/25 border-sky-200 dark:text-cyan-300 text-sky-700">
            <ShieldCheck size={13} className="text-cyan-400" />
            <span>Encrypted</span>
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN VIEWPORT STAGE (Strictly Fills Remaining Height)
      ======================================================== */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 min-h-0 flex flex-col justify-center py-1 sm:py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 h-full max-h-full items-stretch">

          {/* ────────────────────────────────────────────────────────
              LEFT COLUMN: CAMERA VIEWFINDER & LIVE HUD (7 cols)
          ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-0 relative">
            <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-300 dark:bg-gradient-to-br dark:from-[#040e1c]/95 dark:to-[#020813]/95 bg-white/95 backdrop-blur-2xl dark:border-[rgba(0,180,255,0.25)] border-sky-200 shadow-[0_12px_44px_rgba(0,0,0,0.2)] flex flex-col justify-between">
              {/* Top Cyber Frame Highlight Line */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

              {/* Viewfinder Top HUD Bar (Slim) */}
              <div className="relative z-20 flex items-center justify-between px-3.5 sm:px-4 py-2 border-b dark:border-white/5 border-slate-200/70 bg-black/25 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        isCameraMuted ? "bg-rose-400" : "bg-emerald-400"
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        isCameraMuted ? "bg-rose-500" : "bg-emerald-500"
                      )}
                    />
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase dark:text-neutral-300 text-slate-700">
                    {isCameraMuted ? "CAM MUTED" : "LIVE PREVIEW"}
                  </span>
                </div>

                {/* Audio Waveform Live Visualizer */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg dark:bg-black/40 bg-white/60 border dark:border-white/5 border-slate-200">
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase text-neutral-400">
                    MIC:
                  </span>
                  {isMicMuted ? (
                    <span className="text-[9px] sm:text-[10px] font-bold text-rose-400">MUTED</span>
                  ) : (
                    <div className="flex items-end gap-0.5 h-2.5 w-6">
                      <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-1.5" />
                      <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2.5" />
                      <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1" />
                      <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Video Viewport (Fills Available Height) */}
              <div className="meeting-setup-viewport relative flex-1 min-h-0 w-full bg-black flex items-center justify-center overflow-hidden">
                {/* HUD Corner Cyber Brackets */}
                <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none z-10" />
                <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none z-10" />
                <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none z-10" />
                <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none z-10" />

                <VideoPreview
                  mirror
                  DisabledVideoPreview={CustomDisabledVideoPreview}
                  NoCameraPreview={CustomNoCameraPreview}
                />

                {/* In-Chamber Device Configuration Modal Overlay (Zero-Scroll Guarantee) */}
                {showDeviceModal && (
                  <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-center gap-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <SlidersHorizontal size={14} />
                        Connected Media Devices
                      </span>
                      <button
                        onClick={() => setShowDeviceModal(false)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Camera Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                          <Camera size={12} className="text-cyan-400" />
                          Camera Input
                        </label>
                        <select
                          value={selectedCamera || ""}
                          onChange={(e) => call.camera.select(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-400"
                        >
                          {cameraDevices && cameraDevices.length > 0 ? (
                            cameraDevices.map((d) => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Camera ${d.deviceId.slice(0, 5)}...`}
                              </option>
                            ))
                          ) : (
                            <option value="">No Camera Found</option>
                          )}
                        </select>
                      </div>

                      {/* Microphone Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                          <Mic size={12} className="text-cyan-400" />
                          Microphone Input
                        </label>
                        <select
                          value={selectedMicrophone || ""}
                          onChange={(e) => call.microphone.select(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-400"
                        >
                          {micDevices && micDevices.length > 0 ? (
                            micDevices.map((d) => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Microphone ${d.deviceId.slice(0, 5)}...`}
                              </option>
                            ))
                          ) : (
                            <option value="">No Mic Found</option>
                          )}
                        </select>
                      </div>

                      {/* Speaker Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                          <Volume2 size={12} className="text-cyan-400" />
                          Speakers Output
                        </label>
                        <select
                          value={selectedSpeaker || ""}
                          onChange={(e) => call.speaker.select(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-400"
                        >
                          {speakerDevices && speakerDevices.length > 0 ? (
                            speakerDevices.map((d) => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Speaker ${d.deviceId.slice(0, 5)}...`}
                              </option>
                            ))
                          ) : (
                            <option value="">Default Audio Output</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowDeviceModal(false)}
                      className="mt-2 w-full py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Viewfinder Bottom Dock (Compact Controls) */}
              <div className="relative z-20 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-t dark:from-[#030b17] dark:to-[#040e1c] from-sky-50 to-white border-t dark:border-white/5 border-slate-200 shrink-0">
                {/* Media Toggle Controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Microphone Toggle Button */}
                  <button
                    onClick={toggleMic}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 shadow-sm",
                      isMicMuted
                        ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40"
                        : "dark:bg-cyan-500/15 bg-sky-100 hover:dark:bg-cyan-500/25 hover:bg-sky-200 text-cyan-600 dark:text-cyan-300 border dark:border-cyan-500/35 border-sky-300"
                    )}
                    title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                  >
                    {isMicMuted ? <MicOff size={15} /> : <Mic size={15} />}
                    <span>{isMicMuted ? "Mic Off" : "Mic On"}</span>
                  </button>

                  {/* Camera Toggle Button */}
                  <button
                    onClick={toggleCamera}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 shadow-sm",
                      isCameraMuted
                        ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40"
                        : "dark:bg-cyan-500/15 bg-sky-100 hover:dark:bg-cyan-500/25 hover:bg-sky-200 text-cyan-600 dark:text-cyan-300 border dark:border-cyan-500/35 border-sky-300"
                    )}
                    title={isCameraMuted ? "Enable Camera" : "Turn Off Camera"}
                  >
                    {isCameraMuted ? <VideoOff size={15} /> : <Video size={15} />}
                    <span>{isCameraMuted ? "Cam Off" : "Cam On"}</span>
                  </button>
                </div>

                {/* Device Settings Button */}
                <button
                  onClick={() => setShowDeviceModal(!showDeviceModal)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold dark:bg-white/[0.05] bg-white border border-slate-200 dark:border-white/10 dark:text-neutral-300 text-slate-700 hover:border-cyan-400 transition-all active:scale-95 shadow-sm"
                  title="Configure Camera, Microphone & Speakers"
                >
                  <Settings2 size={15} />
                  <span className="hidden sm:inline">Devices</span>
                </button>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              RIGHT COLUMN: UNIFIED FLIGHT BRIEFING & JOIN HUB (5 cols)
          ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0">
            <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border transition-all duration-300 dark:bg-gradient-to-br dark:from-[#040e1c]/95 dark:via-[#07162b]/90 dark:to-[#020813]/95 bg-white/95 backdrop-blur-2xl dark:border-[rgba(0,180,255,0.22)] border-sky-200/90 shadow-[0_12px_44px_rgba(0,0,0,0.18)] flex flex-col justify-between gap-3 sm:gap-4">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75" />

              {/* 1. Header Information */}
              <div className="flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-cyan-500/15 bg-sky-100 text-cyan-600 dark:text-cyan-300 border dark:border-cyan-500/30 border-sky-300 w-fit">
                  <Radio size={11} className="text-cyan-400 animate-pulse" />
                  <span>Synchronized Video Stage</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold font-syne dark:text-white text-slate-900 tracking-tight leading-snug line-clamp-1">
                  {meetingTitle}
                </h2>

                <p className="text-[11px] sm:text-xs dark:text-neutral-300 text-slate-600 leading-relaxed line-clamp-2">
                  Integrated live stage with peer audio/video, collaborative whiteboarding, chat, and GitHub review.
                </p>
              </div>

              {/* 2. Meeting Code Badge */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl dark:bg-[#030b17]/80 bg-sky-50/80 border dark:border-white/5 border-sky-200/70">
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                    STAGE ID CODE
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold dark:text-cyan-300 text-cyan-700 truncate mt-0.5">
                    {formatMeetingCode(meetingId)}
                  </span>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg sm:rounded-xl text-xs font-semibold dark:bg-white/[0.06] bg-white border dark:border-white/10 border-slate-200 hover:border-cyan-400 dark:text-neutral-200 text-slate-700 transition-all active:scale-95 shadow-sm shrink-0"
                  title="Copy meeting code"
                >
                  {isCopiedCode ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3. Stealth Entry Toggle */}
              <label className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl dark:bg-[#030b17]/60 bg-sky-50/60 border dark:border-white/5 border-sky-100 cursor-pointer group hover:border-cyan-400/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isMicCamToggled}
                  onChange={(e) => setIsMicCamToggled(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 border-neutral-600 bg-neutral-800"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold dark:text-neutral-200 text-slate-800 group-hover:dark:text-white transition-colors">
                    Join with mic and camera off
                  </span>
                  <span className="text-[10px] text-neutral-400 hidden sm:inline">
                    Join silently without broadcasting audio or video immediately
                  </span>
                </div>
              </label>

              {/* 4. Telemetry Chips */}
              <div className="flex items-center justify-between text-[11px] px-1 dark:text-neutral-400 text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Hardware Ready
                </span>
                <span className="font-mono">WebRTC SFU Active</span>
              </div>

              {/* 5. Primary Action Buttons (Always Visible at Bottom) */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 shadow-[0_0_24px_rgba(0,180,255,0.4)] hover:shadow-[0_0_36px_rgba(0,180,255,0.6)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isJoining ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Join Classroom Stage</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate("/")}
                  disabled={isJoining}
                  className="w-full inline-flex items-center justify-center gap-1 py-1.5 sm:py-2 px-3 rounded-xl text-[11px] sm:text-xs font-medium dark:text-neutral-400 text-slate-600 hover:dark:text-white hover:text-slate-900 transition-colors"
                >
                  <span>Decline & Exit</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MeetingSetup;
