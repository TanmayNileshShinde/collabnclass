import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Video,
  Link2,
  Calendar,
  Check,
  Radio,
  Clock,
  Sparkles,
  ShieldCheck,
  Share2,
  Play,
  UserCheck,
} from "lucide-react";

import { useGetCallById } from "@/hooks/useGetCallById";
import { useToast } from "@/components/ui/use-toast";
import { formatMeetingCode } from "@/lib/meetingUtils";

// Animated SVG wave layer with dual-theme smooth crossfade (aligned with Home & Upcoming)
const OceanWaves = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Dark Theme Waves */}
    <svg
      className="absolute bottom-0 left-0 w-full transition-opacity duration-300 dark:opacity-100 opacity-0"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "100px" }}
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
      style={{ height: "100px" }}
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
        50% { transform: translateY(-40px) scale(1.1); opacity: 1; }
        100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
      }
    `}</style>
  </div>
);

// Floating particle bubbles
const Bubbles = () => {
  const bubbles = [
    { size: 5, left: "10%", delay: "0s", duration: "6s", bottom: "12%" },
    { size: 4, left: "30%", delay: "1.5s", duration: "8s", bottom: "6%" },
    { size: 6, left: "60%", delay: "3s", duration: "7s", bottom: "14%" },
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

const PersonalRoom = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);
  const [isCopiedInvitation, setIsCopiedInvitation] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Live ticking clock
  const now = new Date();
  const [time, setTime] = useState(
    now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
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

  const meetingId = user?.id || "";
  const { call } = useGetCallById(meetingId);

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const meetingLink = `${baseUrl}/meeting/${meetingId}?personal=true`;
  const roomTopic = `${user?.fullName || user?.username || "Host"}'s Personal Classroom`;

  const startRoom = async () => {
    if (!client || !user || !meetingId) return;
    try {
      setIsStarting(true);
      const newCall = client.call("default", meetingId);
      if (!call) {
        await newCall.getOrCreate({
          data: {
            starts_at: new Date().toISOString(),
            custom: {
              heading: roomTopic,
              description: "Personal Classroom Stage Session",
            },
          },
        });
      }
      navigate(`/meeting/${meetingId}?personal=true`);
    } catch (err) {
      console.error("Error starting personal room:", err);
      toast({
        title: "Launch Failed",
        description: "Could not initialize personal room call. Please try again.",
        variant: "destructive",
      });
      setIsStarting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setIsCopiedLink(true);
    toast({
      title: "Classroom Link Copied",
      description: "Direct invitation URL copied to your clipboard.",
    });
    setTimeout(() => setIsCopiedLink(false), 2200);
  };

  const handleCopyId = () => {
    if (!meetingId) return;
    navigator.clipboard.writeText(meetingId);
    setIsCopiedId(true);
    toast({
      title: "Meeting ID Copied",
      description: meetingId,
    });
    setTimeout(() => setIsCopiedId(false), 2200);
  };

  const handleCopyInvitation = () => {
    const invitationText = `Join my personal classroom on CollabClass!\nTopic: ${roomTopic}\nMeeting ID: ${meetingId}\nJoin Link: ${meetingLink}`;
    navigator.clipboard.writeText(invitationText);
    setIsCopiedInvitation(true);
    toast({
      title: "Full Invitation Copied",
      description: "Complete classroom invitation ready to share.",
    });
    setTimeout(() => setIsCopiedInvitation(false), 2200);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden transition-colors duration-300 dark:bg-[#020813] bg-slate-50 flex flex-col gap-8 pb-16">
      {/* Background Atmosphere */}
      <OceanWaves />
      <Bubbles />
      <Scanlines />

      {/* Ambient background glow orbs */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none blur-3xl transition-opacity duration-300 dark:opacity-30 opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 180, 255, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none blur-3xl transition-opacity duration-300 dark:opacity-20 opacity-10"
        style={{
          background:
            "radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* ========================================================
            HERO CYBER COMMAND BANNER (Aligned with Home & Upcoming)
        ======================================================== */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all duration-300 dark:bg-gradient-to-br dark:from-[#040e1c]/90 dark:via-[#07162b]/85 dark:to-[#020813]/95 bg-gradient-to-br from-white/95 via-sky-50/90 to-slate-100/90 backdrop-blur-2xl dark:border-[rgba(0,180,255,0.22)] border-sky-200/90 shadow-[0_12px_44px_rgba(0,0,0,0.25)]">
          {/* Top highlight glow */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Titles & Tag */}
            <div className="flex flex-col gap-3 max-w-2xl">
              {/* Radar Live Status Tag */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border dark:border-cyan-500/30 border-sky-400/40 dark:bg-cyan-950/40 bg-sky-100/80 dark:text-cyan-300 text-sky-700 shadow-sm w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <span>Transmission Hub • Personal Classroom Stage</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-syne tracking-tight dark:text-white text-slate-900 leading-[1.15]">
                Personal{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  Classroom Stage
                </span>
              </h1>

              <p className="text-sm sm:text-base dark:text-neutral-300 text-slate-600 font-normal leading-relaxed">
                Your dedicated, permanent video broadcast space. Share your persistent meeting ID or invitation link with students and peers for instant zero-friction sessions.
              </p>
            </div>

            {/* Right: Live Telemetry & Bento Counter Pill */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0 w-full sm:w-auto">
              {/* Live Clock Card */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl dark:bg-[#030b17]/80 bg-white/80 border dark:border-[rgba(0,180,255,0.2)] border-sky-200/80 shadow-md backdrop-blur-xl">
                <div className="p-2 rounded-xl dark:bg-cyan-500/10 bg-sky-50 text-cyan-500 dark:text-cyan-400">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-bold font-mono tracking-wider dark:text-cyan-300 text-slate-800">
                    {time}
                  </span>
                  <span className="text-[11px] font-medium dark:text-neutral-400 text-slate-500">
                    {dateStr}
                  </span>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Stage Active & Ready</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold dark:bg-cyan-500/10 bg-sky-50 border dark:border-cyan-500/25 border-sky-200 dark:text-cyan-300 text-sky-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>E2E Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            PERSONAL ROOM BENTO GRID
        ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Host Identity & Stage Info (Col Span 2) */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all duration-300 backdrop-blur-2xl dark:bg-[#040e1c]/85 bg-white/90 dark:border-[rgba(0,180,255,0.18)] border-sky-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col justify-between gap-6 group hover:dark:border-[rgba(0,229,255,0.35)] hover:border-sky-400">
            {/* Top highlight glow */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Header / Host identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "Host"}
                    className="w-14 h-14 rounded-2xl object-cover border-2 dark:border-cyan-400/50 border-sky-400 shadow-[0_0_16px_rgba(0,180,255,0.3)] ring-2 ring-cyan-500/20"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center dark:bg-cyan-500/15 bg-sky-100 border-2 dark:border-cyan-400/40 border-sky-300 text-cyan-500 dark:text-cyan-300 font-bold font-syne text-xl shadow-[0_0_16px_rgba(0,180,255,0.2)]">
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "H"}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-syne dark:text-white text-slate-900 tracking-tight">
                      {user?.fullName || user?.username || "Lead Instructor"}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-cyan-500/15 bg-sky-100 text-cyan-600 dark:text-cyan-300 border dark:border-cyan-500/30 border-sky-300">
                      <UserCheck className="w-3 h-3 text-cyan-400" />
                      Host
                    </span>
                  </div>
                  <p className="text-xs dark:text-neutral-400 text-slate-500 mt-0.5">
                    {user?.primaryEmailAddress?.emailAddress || `@${user?.username || "user"}`}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold dark:bg-[#030b17]/80 bg-slate-100 dark:text-neutral-300 text-slate-700 border dark:border-white/10 border-slate-200">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>WebRTC Mesh Stream</span>
              </div>
            </div>

            {/* Room Properties Bento Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Topic Strip */}
              <div className="flex items-start gap-3.5 p-4 rounded-2xl dark:bg-[#030b17]/60 bg-sky-50/70 border dark:border-white/5 border-sky-100 transition-colors">
                <div className="p-2 rounded-xl dark:bg-cyan-500/10 bg-sky-100 text-cyan-500 dark:text-cyan-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Classroom Topic
                  </span>
                  <span className="text-sm font-semibold dark:text-white text-slate-900 truncate mt-0.5">
                    {roomTopic}
                  </span>
                </div>
              </div>

              {/* Direct Room ID Strip */}
              <div className="flex items-start justify-between gap-2 p-4 rounded-2xl dark:bg-[#030b17]/60 bg-sky-50/70 border dark:border-white/5 border-sky-100 transition-colors">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2 rounded-xl dark:bg-cyan-500/10 bg-sky-100 text-cyan-500 dark:text-cyan-400 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Personal Meeting ID
                    </span>
                    <span className="text-sm font-mono font-semibold dark:text-cyan-300 text-cyan-700 truncate mt-0.5">
                      {meetingId ? formatMeetingCode(meetingId) : "Generating..."}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyId}
                  className="p-2 rounded-xl dark:bg-white/[0.04] bg-white border dark:border-white/10 border-slate-200 hover:border-cyan-400 text-neutral-400 hover:text-cyan-400 transition-all shrink-0 active:scale-95"
                  title="Copy Meeting ID"
                >
                  {isCopiedId ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            {/* Permanent Invite URL Bar */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl dark:bg-[#030b17]/80 bg-sky-50/90 border dark:border-[rgba(0,180,255,0.16)] border-sky-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider dark:text-cyan-300 text-sky-700">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Permanent Classroom URL</span>
                </div>
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  Never expires • Reusable
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 px-3 py-2 rounded-xl dark:bg-black/40 bg-white border dark:border-white/10 border-slate-200 text-xs font-mono dark:text-neutral-300 text-slate-700 truncate select-all">
                  {meetingLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold dark:bg-cyan-500/15 bg-sky-100 hover:bg-sky-200 dark:hover:bg-cyan-500/25 border dark:border-cyan-500/30 border-sky-300 dark:text-cyan-300 text-sky-700 transition-all active:scale-95 shrink-0"
                >
                  {isCopiedLink ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Launch Command Hub (Col Span 1) */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all duration-300 backdrop-blur-2xl dark:bg-[#040e1c]/85 bg-white/90 dark:border-[rgba(0,180,255,0.18)] border-sky-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col justify-between gap-6 group hover:dark:border-[rgba(0,229,255,0.35)] hover:border-sky-400">
            {/* Top highlight glow */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center dark:bg-cyan-500/10 bg-sky-50 dark:border-cyan-500/25 border-sky-300 text-cyan-400 shadow-[0_0_16px_rgba(0,180,255,0.2)]">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold dark:bg-cyan-500/10 bg-sky-50 text-cyan-400 dark:text-cyan-300 border dark:border-cyan-500/25 border-sky-200">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Instant Entry</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold font-syne dark:text-white text-slate-900">
                  Broadcast Stage
                </h3>
                <p className="text-xs dark:text-neutral-400 text-slate-500 mt-1 leading-relaxed">
                  Start your personal classroom room immediately. Attendees with your link or meeting code can join anytime.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs dark:text-neutral-300 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>HD Video & Low-Latency Audio</span>
                </div>
                <div className="flex items-center gap-2 text-xs dark:text-neutral-300 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Integrated Real-time Whiteboard</span>
                </div>
                <div className="flex items-center gap-2 text-xs dark:text-neutral-300 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Screen Sharing & Peer Code Review</span>
                </div>
              </div>
            </div>

            {/* Launch & Copy Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={startRoom}
                disabled={isStarting}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 shadow-[0_0_24px_rgba(0,180,255,0.35)] hover:shadow-[0_0_36px_rgba(0,180,255,0.55)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isStarting ? "Initializing Call..." : "Start Personal Meeting"}</span>
              </button>

              <button
                onClick={handleCopyInvitation}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold dark:bg-white/[0.04] bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/10 border dark:border-white/10 border-slate-200 dark:text-neutral-200 text-slate-700 transition-all active:scale-[0.98]"
              >
                {isCopiedInvitation ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Invitation Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} className="text-cyan-400" />
                    <span>Copy Full Invitation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalRoom;
