import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@clerk/clerk-react";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import MeetingTypeList from "@/components/MeetingTypeList";
import { useGetCalls } from "@/hooks/useGetCalls";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Video,
  ExternalLink,
  Users,
  Clock,
  PenTool,
  Bot,
  Activity,
  ShieldCheck,
  KeyRound,
  ClipboardPaste
} from "lucide-react";

// Animated SVG wave layer
const OceanWaves = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg
      className="absolute bottom-0 left-0 w-full"
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

    <style>{`
      @keyframes waveMove {
        0%, 100% { d: path("M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1380,40 1440,60 L1440,120 L0,120 Z"); }
        50% { d: path("M0,40 C180,70 360,10 540,50 C720,90 900,10 1080,50 C1260,90 1380,30 1440,45 L1440,120 L0,120 Z"); }
      }
      @keyframes depthPulse {
        0%, 100% { opacity: 0.15; transform: scale(1); }
        50% { opacity: 0.35; transform: scale(1.05); }
      }
      @keyframes floatBubble {
        0% { transform: translateY(0) scale(1); opacity: 0.7; }
        50% { transform: translateY(-40px) scale(1.1); opacity: 1; }
        100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
      }
      @keyframes shimmerText {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
    `}</style>
  </div>
);

// Floating bubble particles
const Bubbles = () => {
  const bubbles = [
    { size: 5, left: "12%", delay: "0s", duration: "6s", bottom: "10%" },
    { size: 4, left: "28%", delay: "1.5s", duration: "8s", bottom: "5%" },
    { size: 6, left: "48%", delay: "3s", duration: "7s", bottom: "15%" },
    { size: 3, left: "68%", delay: "0.8s", duration: "9s", bottom: "8%" },
    { size: 5, left: "85%", delay: "2.2s", duration: "6.5s", bottom: "12%" },
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

// Scanline overlay for depth
const Scanlines = () => (
  <div
    className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]"
    style={{
      backgroundImage:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,255,1) 2px, rgba(0,200,255,1) 3px)",
      backgroundSize: "100% 3px",
    }}
  />
);

// Depth sonar ring
const SonarRing = () => (
  <div className="absolute right-8 lg:right-14 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block opacity-35">
    <div
      className="w-16 h-16 rounded-full border flex items-center justify-center relative"
      style={{
        borderColor: "rgba(0,180,255,0.2)",
        background: "rgba(0,20,50,0.4)",
        backdropFilter: "blur(4px)",
      }}
    >
      {[12, 8, 4].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size * 4,
            height: size * 4,
            borderColor: `rgba(0,200,255,${0.15 + i * 0.08})`,
            animation: `depthPulse ${3 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
      <div
        className="absolute w-px h-6 origin-bottom"
        style={{
          background: "linear-gradient(to top, rgba(0,229,255,0.8), transparent)",
          transformOrigin: "bottom center",
          bottom: "50%",
          left: "50%",
          marginLeft: "-0.5px",
          animation: "spin 4s linear infinite",
        }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: "#00e5ff",
          boxShadow: "0 0 8px rgba(0,229,255,1)",
        }}
      />
    </div>
  </div>
);

// Depth meter on the left
const DepthMeter = () => {
  const [depth, setDepth] = useState(247);
  useEffect(() => {
    const id = setInterval(() => {
      setDepth((d) => d + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="absolute left-3 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-1 pointer-events-none"
      style={{ opacity: 0.6 }}
    >
      <div className="w-px h-10 rounded-full" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,200,255,0.6))" }} />
      <div
        className="text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded"
        style={{
          color: "rgba(0,229,255,0.8)",
          background: "rgba(0,20,50,0.5)",
          border: "1px solid rgba(0,180,255,0.2)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          letterSpacing: "0.15em",
        }}
      >
        {depth}m
      </div>
      <div className="w-px h-10 rounded-full" style={{ background: "linear-gradient(to top, transparent, rgba(0,200,255,0.6))" }} />
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();
  const { liveCalls, upcomingCalls, endedCalls } = useGetCalls();

  const now = new Date();
  const [time, setTime] = useState(
    now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  const date = new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(now);

  // Command bar quick join input
  const [quickCode, setQuickCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCopiedPersonal, setIsCopiedPersonal] = useState(false);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Personal meeting link
  const personalRoomLink = useMemo(() => {
    if (!user?.id) return "";
    const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
    return `${baseUrl}/meeting/${user.id}?personal=true`;
  }, [user?.id]);

  const copyPersonalRoomLink = () => {
    if (!personalRoomLink) return;
    navigator.clipboard.writeText(personalRoomLink);
    setIsCopiedPersonal(true);
    toast({ title: "Personal Classroom Link Copied!" });
    setTimeout(() => setIsCopiedPersonal(false), 2500);
  };

  // Direct Quick Join Handler
  const handleQuickJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawInput = quickCode.trim();
    if (!rawInput) {
      toast({
        title: "Please enter a code or URL",
        description: "Type an 8-character meeting code or paste a meeting link.",
      });
      return;
    }

    if (!client) {
      toast({ title: "Connecting video client, please retry..." });
      return;
    }

    setIsJoining(true);
    try {
      // 1. Full URL check
      const urlMatch = rawInput.match(/\/meeting\/([a-zA-Z0-9_\-]+)/);
      if (urlMatch && urlMatch[1]) {
        navigate(`/meeting/${urlMatch[1]}`);
        toast({ title: "Connecting to classroom..." });
        return;
      }

      // 2. UUID check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(rawInput)) {
        navigate(`/meeting/${rawInput}`);
        toast({ title: "Connecting to classroom..." });
        return;
      }

      // 3. 8-digit meeting code check
      const normalizedCode = rawInput.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (normalizedCode.length !== 8) {
        toast({
          title: "Invalid classroom code",
          description: "Meeting code must be 8 alphanumeric characters.",
          variant: "destructive",
        });
        return;
      }

      const { calls } = await client.queryCalls({
        filter_conditions: { "custom.meetingCode": normalizedCode },
        limit: 1,
      });

      if (calls.length === 0) {
        toast({
          title: "Meeting not found",
          description: "No active classroom found for this code.",
          variant: "destructive",
        });
        return;
      }

      const call = calls[0];
      if (call.state.endedAt) {
        toast({
          title: "Meeting has concluded",
          description: "This classroom session has already ended.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/meeting/${call.id}`);
      toast({ title: "Entering classroom..." });
    } catch (err) {
      toast({
        title: "Failed to join",
        description: err instanceof Error ? err.message : "Error joining meeting.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuickCode(text.trim());
        toast({ title: "Pasted from clipboard" });
      }
    } catch {
      toast({ title: "Could not access clipboard" });
    }
  };

  const getRelativeTime = (startsAt?: Date | string) => {
    if (!startsAt) return "";
    const timeMs = startsAt instanceof Date ? startsAt.getTime() : new Date(startsAt).getTime();
    const diffMs = timeMs - Date.now();
    if (diffMs <= 0) return "In progress";
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `in ${mins} min${mins === 1 ? "" : "s"}`;
    const hours = Math.round(mins / 60);
    return `in ${hours} hr${hours === 1 ? "" : "s"}`;
  };

  return (
    <section className="w-full flex flex-col gap-6 sm:gap-8 lg:gap-10 dark:text-white text-slate-900 transition-all duration-300 max-w-7xl mx-auto px-2 sm:px-0">
      {/* ===================== HERO CYBER BANNER ===================== */}
      <div
        className="min-h-[280px] sm:min-h-[320px] lg:h-[330px] w-full rounded-2xl sm:rounded-[28px] relative overflow-hidden group flex flex-col justify-between"
        style={{
          background: theme === "dark" ? "linear-gradient(135deg, #020813 0%, #041224 45%, #061c38 100%)" : "linear-gradient(135deg, #031e3d 0%, #053366 45%, #07478d 100%)",
          border: theme === "dark" ? "1px solid rgba(0, 180, 255, 0.2)" : "1px solid rgba(0, 140, 240, 0.35)",
          boxShadow: theme === "dark" ? "0 0 60px rgba(0, 100, 180, 0.22), inset 0 1px 0 rgba(0, 229, 255, 0.12)" : "0 10px 35px rgba(0, 80, 180, 0.15), inset 0 1px 0 rgba(0, 229, 255, 0.2)",
        }}
      >
        {/* Radial ambient lighting */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 70% 0%, rgba(0, 229, 255, 0.16) 0%, transparent 60%), radial-gradient(ellipse at 20% 100%, rgba(2, 132, 199, 0.25) 0%, transparent 55%)",
          }}
        />

        {/* Cyber grid overlay */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 70px, rgba(0, 180, 255, 0.05) 70px, rgba(0, 180, 255, 0.05) 71px), repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(0, 180, 255, 0.04) 100px, rgba(0, 180, 255, 0.04) 101px)",
          }}
        />

        <Scanlines />
        <OceanWaves />
        <Bubbles />
        <SonarRing />
        <DepthMeter />

        {/* Bottom backdrop gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(2, 8, 19, 0.85) 0%, transparent 60%)",
          }}
        />

        {/* Hero Content */}
        <div className="flex flex-col justify-between h-full p-5 sm:p-7 lg:p-9 relative z-10 gap-5">
          {/* Top Header Row: Greeting & Live Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="size-9 sm:size-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.25)] flex-shrink-0">
                <Sparkles className="size-4 sm:size-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold block">
                  ◈ COLLABCLASS OS
                </span>
                <h2 className="text-xs sm:text-sm font-semibold text-slate-200">
                  {greeting}, <span className="text-white font-bold">{user?.firstName || "Scholar"}</span>
                </h2>
              </div>
            </div>

            {/* Dynamic Live Status / Countdown pill */}
            {liveCalls && liveCalls.length > 0 ? (
              <div
                onClick={() => navigate(`/meeting/${liveCalls[0].id}`)}
                className="cursor-pointer rounded-xl sm:rounded-2xl py-1.5 px-3 sm:py-2 sm:px-4 text-center backdrop-blur-xl border border-rose-500/60 bg-rose-950/80 shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:scale-105 transition-all flex items-center gap-2.5 group/live"
              >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-rose-300 uppercase tracking-widest leading-none">
                    Live Class Now
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[160px] mt-0.5">
                    {liveCalls[0]?.state?.custom?.heading || liveCalls[0]?.state?.custom?.description || "In Session"}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-rose-500 group-hover/live:bg-rose-400 text-white shadow-md transition-colors flex items-center gap-1">
                  Enter →
                </span>
              </div>
            ) : upcomingCalls && upcomingCalls.length > 0 ? (
              <div
                onClick={() => navigate('/upcoming')}
                className="cursor-pointer rounded-xl sm:rounded-2xl py-1.5 px-3 sm:py-2 sm:px-4 backdrop-blur-xl border border-cyan-500/30 bg-[#001830]/80 shadow-[0_0_16px_rgba(0,229,255,0.2)] hover:scale-105 transition-all flex items-center gap-2.5"
              >
                <div className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-wider leading-none">
                    Next Lecture · {getRelativeTime(upcomingCalls[0]?.state?.startsAt)}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-100 truncate max-w-[140px] sm:max-w-[180px] mt-0.5">
                    {upcomingCalls[0]?.state?.custom?.heading || "Scheduled Session"}
                  </span>
                </div>
                <ArrowRight className="size-3.5 text-cyan-400" />
              </div>
            ) : (
              <div className="rounded-xl sm:rounded-2xl py-1.5 px-3.5 backdrop-blur-xl border border-cyan-500/20 bg-cyber-surface/70 flex items-center gap-2">
                <div className="size-1.5 sm:size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                <span className="text-[11px] sm:text-xs font-medium text-cyan-200/90">
                  Node Ready · All Systems Active
                </span>
              </div>
            )}
          </div>

          {/* Bottom Hero Info: Big Clock, Date & Quick Personal Link */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-auto">
            <div className="flex flex-col">
              <h1
                className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight select-none leading-none"
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #a5f3fc 35%, #00e5ff 70%, #0284c7 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 35px rgba(0, 229, 255, 0.45))",
                  animation: "shimmerText 5s linear infinite",
                }}
              >
                {time}
              </h1>
              <p className="text-xs sm:text-base font-medium text-cyan-100/80 mt-1 sm:mt-2 tracking-wide">
                {date}
              </p>
            </div>

            {/* Quick Personal Room Pill */}
            {user && (
              <div className="flex items-center gap-2 bg-cyber-elevated/90 border border-cyan-500/25 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 backdrop-blur-md shadow-lg max-w-full sm:max-w-sm">
                <div className="size-7 sm:size-8 rounded-lg sm:rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 flex-shrink-0">
                  <KeyRound className="size-3.5 sm:size-4" />
                </div>
                <div className="flex flex-col min-w-0 pr-1 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Personal Classroom Link
                  </span>
                  <span className="text-[11px] sm:text-xs font-mono text-slate-300 truncate">
                    {user.firstName ? `${user.firstName}'s Room` : "My Room"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyPersonalRoomLink}
                  className="px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0"
                >
                  {isCopiedPersonal ? <Check className="size-3 text-cyan-300" /> : <Copy className="size-3" />}
                  <span>{isCopiedPersonal ? "Copied" : "Copy"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== COMMAND / DIRECT JOIN BAR ===================== */}
      <div className="relative z-20">
        <form
          onSubmit={handleQuickJoin}
          className="glass-cyber-panel rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 border border-cyan-500/30 shadow-neon-cyan/20"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl dark:bg-cyber-surface/90 bg-cyan-50 dark:border-cyan-500/20 border-cyan-200 self-start sm:self-auto">
            <Zap className="size-4 text-cyan-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider dark:text-cyan-300 text-cyan-700 whitespace-nowrap">
              Quick Join
            </span>
          </div>

          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter 8-character code (e.g. 7X9K-2M4P) or URL..."
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              style={{
                backgroundColor: theme === "dark" ? "#020813" : "#ffffff",
                borderColor: theme === "dark" ? "rgba(0, 180, 255, 0.25)" : "rgba(0, 140, 240, 0.3)",
                color: theme === "dark" ? "#f0f9ff" : "#0f172a",
              }}
              className="w-full dark:!bg-[#020813] !bg-white dark:border-cyan-500/25 border-slate-300 dark:text-slate-100 text-slate-900 placeholder:text-slate-400 rounded-xl pr-20 font-mono text-xs sm:text-sm tracking-wide focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 h-10 sm:h-11 backdrop-blur-md"
            />
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg dark:bg-cyan-500/10 bg-cyan-50 dark:hover:bg-cyan-500/20 hover:bg-cyan-100 text-[11px] font-medium dark:text-cyan-300 text-cyan-700 dark:border-cyan-500/30 border-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ClipboardPaste className="size-3" />
              <span>Paste</span>
            </button>
          </div>

          <Button
            type="submit"
            disabled={isJoining}
            className="btn-cyber-primary w-full sm:w-auto px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg h-10 sm:h-11 text-xs sm:text-sm"
          >
            {isJoining ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>Join Classroom</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* ===================== METRICS HUD DOCK ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1 */}
        <div className="glass-cyber-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 border border-cyan-500/15">
          <div className="size-10 sm:size-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
            <Radio className="size-4 sm:size-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {liveCalls?.length ?? 0}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold dark:text-slate-400 text-slate-500 flex items-center gap-1.5 truncate">
              <span className="size-1.5 rounded-full bg-rose-500 animate-ping inline-block flex-shrink-0" />
              Live In Session
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-cyber-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 border border-cyan-500/15">
          <div className="size-10 sm:size-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Calendar className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {upcomingCalls?.length ?? 0}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold dark:text-slate-400 text-slate-500 truncate">
              Upcoming Classes
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-cyber-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 border border-cyan-500/15">
          <div className="size-10 sm:size-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Video className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {endedCalls?.length ?? 0}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold dark:text-slate-400 text-slate-500 truncate">
              Completed Classes
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="glass-cyber-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 border border-cyan-500/15">
          <div className="size-10 sm:size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Activity className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-emerald-300 truncate">
              Stream WebRTC
            </div>
            <div className="text-[11px] sm:text-xs font-semibold dark:text-slate-400 text-slate-500 truncate">
              P2P Low Latency
            </div>
          </div>
        </div>
      </div>

      {/* ===================== PRIMARY ACTION CARDS ===================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00e5ff] flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Classroom Operations
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Quick Actions & Session Controls
          </span>
        </div>
        <MeetingTypeList />
      </div>

      {/* ===================== LIVE & TODAY'S SCHEDULE DISPATCH ===================== */}
      <div className="glass-cyber-panel rounded-2xl sm:rounded-3xl p-5 sm:p-7 dark:border-cyan-500/20 border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00e5ff] flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Classroom Dispatch
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Active live sessions and scheduled upcoming lectures
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/upcoming')}
            className="btn-cyber-ghost text-xs rounded-xl flex items-center gap-1.5"
          >
            <span>View Full Calendar</span>
            <ExternalLink className="size-3.5" />
          </Button>
        </div>

        {/* Live / Upcoming Feed */}
        {liveCalls && liveCalls.length > 0 ? (
          <div className="flex flex-col gap-4">
            {/* Highlighted Live Session Card */}
            {liveCalls.map((call) => {
              const meetingTitle = call.state.custom?.heading || call.state.custom?.description || "Live Classroom";
              const meetingCode = call.state.custom?.meetingCode || "";
              const meetingUrl = `${window.location.origin}/meeting/${call.id}`;

              return (
                <div
                  key={call.id}
                  className="rounded-2xl p-5 sm:p-6 dark:bg-gradient-to-r dark:from-rose-950/40 dark:via-[#04162e] dark:to-[#020e20] bg-gradient-to-r from-rose-50 via-white to-sky-50 dark:border-rose-500/50 border border-rose-300 shadow-sm dark:shadow-[0_0_35px_rgba(244,63,94,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] flex-shrink-0">
                      <Radio className="size-6 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-rose-400 animate-ping" />
                          Live In Session
                        </span>
                        {meetingCode && (
                          <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-cyber-elevated border border-cyan-500/30">
                            {meetingCode.length === 8 ? `${meetingCode.slice(0, 4)}-${meetingCode.slice(4)}` : meetingCode}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                        {meetingTitle}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {call.state.custom?.subheading || "Active virtual lecture. Interactive whiteboard, audio & screen share enabled."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(meetingUrl);
                        toast({ title: "Class Link Copied!" });
                      }}
                      className="text-xs dark:text-slate-400 text-slate-600 dark:hover:text-cyan-300 hover:text-cyan-700 flex items-center gap-1 px-3 py-2 rounded-xl dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 transition-colors"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Link</span>
                    </button>

                    <Button
                      onClick={() => navigate(`/meeting/${call.id}`)}
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-lg flex items-center gap-1.5"
                    >
                      <span>Join Live Class</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Next upcoming sessions */}
            {upcomingCalls && upcomingCalls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {upcomingCalls.slice(0, 3).map((call) => {
                  const meetingTitle = call.state.custom?.heading || call.state.custom?.description || "Scheduled Lecture";
                  const startsAt = call.state.startsAt ? new Date(call.state.startsAt) : null;
                  const meetingCode = call.state.custom?.meetingCode || "";

                  return (
                    <div
                      key={call.id}
                      className="rounded-2xl p-4 sm:p-5 dark:bg-cyber-elevated/70 bg-white dark:border-cyan-500/20 border-slate-200 flex flex-col justify-between gap-3 hover:-translate-y-1 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {startsAt ? getRelativeTime(call.state.startsAt) : "Scheduled"}
                        </span>
                        {meetingCode && (
                          <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-cyber-surface border border-cyan-500/20">
                            {meetingCode.length === 8 ? `${meetingCode.slice(0, 4)}-${meetingCode.slice(4)}` : meetingCode}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-bold dark:text-white text-slate-900 truncate">
                          {meetingTitle}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {startsAt
                            ? startsAt.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Scheduled"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="size-3.5" />
                          <span>Classroom</span>
                        </span>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/meeting/${call.id}`)}
                          className="btn-cyber-primary text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1"
                        >
                          <span>Enter</span>
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : upcomingCalls && upcomingCalls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingCalls.slice(0, 3).map((call) => {
              const meetingTitle = call.state.custom?.heading || call.state.custom?.description || "Scheduled Lecture";
              const startsAt = call.state.startsAt ? new Date(call.state.startsAt) : null;
              const meetingCode = call.state.custom?.meetingCode || "";
              const meetingUrl = `${window.location.origin}/meeting/${call.id}`;

              return (
                <div
                  key={call.id}
                  className="rounded-2xl p-4 sm:p-5 dark:bg-cyber-elevated/70 bg-white dark:border-cyan-500/20 border-slate-200 flex flex-col justify-between gap-3 hover:-translate-y-1 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                      <Clock className="size-3" />
                      {startsAt ? getRelativeTime(call.state.startsAt) : "Scheduled"}
                    </span>
                    {meetingCode && (
                      <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-cyber-surface border border-cyan-500/20">
                        {meetingCode.length === 8 ? `${meetingCode.slice(0, 4)}-${meetingCode.slice(4)}` : meetingCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-bold dark:text-white text-slate-900 truncate">
                      {meetingTitle}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {startsAt
                        ? startsAt.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " · " + startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Time Pending"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(meetingUrl);
                        toast({ title: "Class Link Copied!" });
                      }}
                      className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Link</span>
                    </button>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/meeting/${call.id}`)}
                      className="btn-cyber-primary text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1"
                    >
                      <span>Start Early</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-10 sm:py-12 px-4 sm:px-6 rounded-2xl dark:bg-cyber-surface/40 bg-white dark:border-cyan-500/10 border-slate-200 flex flex-col items-center justify-center shadow-sm">
            <div className="size-14 sm:size-16 rounded-2xl sm:rounded-3xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_25px_rgba(0,229,255,0.2)]">
              <Calendar className="size-7 sm:size-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold dark:text-white text-slate-900 mb-1">
              No Classroom Sessions Right Now
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-4 text-center">
              You are all caught up! Launch an instant lecture for spontaneous office hours or schedule an upcoming module with your students.
            </p>
            <Button
              onClick={() => navigate("/upcoming")}
              className="btn-cyber-ghost text-xs px-4 py-2 rounded-xl"
            >
              View Full Calendar
            </Button>
          </div>
        )}
      </div>

      {/* ===================== CLASSROOM HUB & TOOLS ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Tool 1: Interactive Whiteboard */}
        <div
          onClick={() => {
            if (user?.id) {
              navigate(`/meeting/${user.id}?personal=true`);
            } else {
              navigate("/home");
            }
          }}
          className="glass-cyber-card rounded-2xl p-5 sm:p-6 border border-cyan-500/20 cursor-pointer group hover:-translate-y-1 transition-all"
        >
          <div className="size-11 sm:size-12 rounded-xl sm:rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-3.5 group-hover:scale-110 transition-transform">
            <PenTool className="size-5 sm:size-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-200 transition-colors">
            Collaborative Whiteboard
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Real-time drawing canvas, sticky notes, architectural diagrams, and math formula rendering for interactive classes.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-cyan-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>Launch Canvas</span>
            <ArrowRight className="size-3.5" />
          </div>
        </div>

        {/* Tool 2: AI Study Copilot */}
        <div
          className="glass-cyber-card rounded-2xl p-5 sm:p-6 border border-blue-500/20 group hover:-translate-y-1 transition-all"
        >
          <div className="size-11 sm:size-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-300 mb-3.5 group-hover:scale-110 transition-transform">
            <Bot className="size-5 sm:size-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-200 transition-colors">
            AI Study Copilot
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Generate lecture summaries, 3-question quizzes, code explanations, and flashcards directly during or after live class.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-sky-400 gap-1">
            <span>Available Inside Any Call</span>
            <Sparkles className="size-3.5" />
          </div>
        </div>

        {/* Tool 3: Host Privileges & Attendance */}
        <div
          onClick={() => navigate('/recordings')}
          className="glass-cyber-card rounded-2xl p-5 sm:p-6 border border-purple-500/20 cursor-pointer group hover:-translate-y-1 transition-all"
        >
          <div className="size-11 sm:size-12 rounded-xl sm:rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3.5 group-hover:scale-110 transition-transform">
            <ShieldCheck className="size-5 sm:size-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-200 transition-colors">
            Attendance & Cloud Vault
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Automated student join/leave logs, downloadable CSV reports, and high-definition recordings of every lecture.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-purple-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>Explore Archives</span>
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
