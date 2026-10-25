import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CallList, { UpcomingFilterType } from "@/components/CallList";
import { useGetCalls } from "@/hooks/useGetCalls";
import {
  Calendar,
  Sparkles,
  Search,
  X,
  Plus,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Animated SVG wave layer with dual-theme smooth crossfade (aligned with Home)
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
      @keyframes depthPulse {
        0%, 100% { opacity: 0.15; transform: scale(1); }
        50% { opacity: 0.35; transform: scale(1.05); }
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
    { size: 5, left: "10%", delay: "0s", duration: "6s", bottom: "10%" },
    { size: 4, left: "30%", delay: "1.5s", duration: "8s", bottom: "5%" },
    { size: 6, left: "55%", delay: "3s", duration: "7s", bottom: "15%" },
    { size: 3, left: "75%", delay: "0.8s", duration: "9s", bottom: "8%" },
    { size: 5, left: "90%", delay: "2.2s", duration: "6.5s", bottom: "12%" },
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

const Upcoming = () => {
  const navigate = useNavigate();
  const { liveCalls, upcomingCalls } = useGetCalls();

  const [filter, setFilter] = useState<UpcomingFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const now = new Date();
  const [time, setTime] = useState(
    now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(now);

  // Live ticking clock
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const totalUpcomingCount = (liveCalls?.length ?? 0) + (upcomingCalls?.length ?? 0);

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
            HERO CYBER COMMAND BANNER (Identical Aesthetic to Home)
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
                <span>Transmission Queue • Classroom Schedule</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-syne tracking-tight dark:text-white text-slate-900 leading-[1.15]">
                Upcoming{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  Classrooms
                </span>
              </h1>

              <p className="text-sm sm:text-base dark:text-neutral-300 text-slate-600 font-normal leading-relaxed">
                Your synchronized schedule of live lecture stages, collaborative whiteboarding sessions, and peer code reviews.
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

              {/* Quick Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {liveCalls.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)] animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>{liveCalls.length} LIVE NOW</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold dark:bg-cyan-500/10 bg-sky-50 border dark:border-cyan-500/25 border-sky-200 dark:text-cyan-300 text-sky-700">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{upcomingCalls.length} Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            INTERACTIVE SEARCH & FILTER COMMAND BAR
        ======================================================== */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl dark:bg-[#040e1c]/80 bg-white/80 backdrop-blur-xl border dark:border-[rgba(0,180,255,0.18)] border-sky-200/80 shadow-md overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                filter === "all"
                  ? "bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white shadow-md border border-cyan-400/40"
                  : "dark:text-neutral-400 text-slate-600 hover:dark:text-white hover:text-slate-900 hover:bg-white/[0.04]"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All ({totalUpcomingCount})</span>
            </button>

            <button
              onClick={() => setFilter("live")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                filter === "live"
                  ? "bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                  : "dark:text-neutral-400 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10"
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>Live Now ({liveCalls.length})</span>
            </button>

            <button
              onClick={() => setFilter("scheduled")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                filter === "scheduled"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,220,255,0.25)]"
                  : "dark:text-neutral-400 text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Scheduled ({upcomingCalls.length})</span>
            </button>
          </div>

          {/* Right: Search Input + Schedule CTA */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-64 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-neutral-500 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or code..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium dark:bg-[#040e1c]/80 bg-white/80 border dark:border-[rgba(0,180,255,0.18)] border-sky-200/80 dark:text-white text-slate-900 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Schedule CTA */}
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 shadow-[0_0_16px_rgba(0,180,255,0.3)] hover:shadow-[0_0_24px_rgba(0,180,255,0.5)] active:scale-95 transition-all shrink-0"
              title="Schedule a new classroom session"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Session</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            MEETINGS GRID FEED
        ======================================================== */}
        <section className="relative w-full">
          <CallList
            type="upcoming"
            searchQuery={searchQuery}
            activeFilter={filter}
            onFilterChange={setFilter}
            hideFilterHeader={true}
          />
        </section>
      </div>
    </div>
  );
};

export default Upcoming;
