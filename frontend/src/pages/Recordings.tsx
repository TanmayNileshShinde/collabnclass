import { useState, useEffect } from "react";
import CallList from "@/components/CallList";
import { useGetCalls } from "@/hooks/useGetCalls";
import { Video, Film, Search, X, Clock } from "lucide-react";

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
    { size: 5, left: "15%", delay: "0s", duration: "6s", bottom: "10%" },
    { size: 4, left: "35%", delay: "1.5s", duration: "8s", bottom: "5%" },
    { size: 6, left: "62%", delay: "3s", duration: "7s", bottom: "15%" },
    { size: 3, left: "82%", delay: "0.8s", duration: "9s", bottom: "8%" },
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

const Recordings = () => {
  const { callRecordings } = useGetCalls();
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

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const totalRecordingsCount = callRecordings?.length ?? 0;

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden transition-colors duration-300 dark:bg-[#020813] bg-slate-50 flex flex-col gap-8 pb-16">
      {/* Background Atmosphere */}
      <OceanWaves />
      <Bubbles />
      <Scanlines />

      {/* Ambient Orbs */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none blur-3xl transition-opacity duration-300 dark:opacity-25 opacity-10"
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
            HERO CYBER COMMAND BANNER
        ======================================================== */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 border transition-all duration-300 dark:bg-gradient-to-br dark:from-[#040e1c]/90 dark:via-[#07162b]/85 dark:to-[#020813]/95 bg-gradient-to-br from-white/95 via-sky-50/90 to-slate-100/90 backdrop-blur-2xl dark:border-[rgba(0,180,255,0.22)] border-sky-200/90 shadow-[0_12px_44px_rgba(0,0,0,0.25)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Left Titles */}
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border dark:border-cyan-500/30 border-sky-400/40 dark:bg-cyan-950/40 bg-sky-100/80 dark:text-cyan-300 text-sky-700 shadow-sm w-fit">
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>Media Vault • Cloud Recordings</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-syne tracking-tight dark:text-white text-slate-900 leading-[1.15]">
                Classroom{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                  Recordings
                </span>
              </h1>

              <p className="text-sm sm:text-base dark:text-neutral-300 text-slate-600 font-normal leading-relaxed">
                Stream cloud lecture recordings, replay whiteboarding sessions, and manage your video media archives.
              </p>
            </div>

            {/* Right Telemetry Badge */}
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

              {/* Recordings Counter Badge */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl dark:bg-[#030b17]/80 bg-white/80 border dark:border-[rgba(0,180,255,0.2)] border-sky-200/80 shadow-md backdrop-blur-xl shrink-0">
                <div className="p-2 rounded-xl dark:bg-cyan-500/10 bg-sky-50 text-cyan-500 dark:text-cyan-400">
                  <Video className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-bold font-mono tracking-wider dark:text-cyan-300 text-slate-800">
                    {totalRecordingsCount}
                  </span>
                  <span className="text-[11px] font-medium dark:text-neutral-400 text-slate-500">
                    Recorded Sessions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            INTERACTIVE SEARCH COMMAND BAR
        ======================================================== */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Quick Filter Tag */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl dark:bg-[#040e1c]/80 bg-white/80 backdrop-blur-xl border dark:border-[rgba(0,180,255,0.18)] border-sky-200/80 shadow-md">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white shadow-md border border-cyan-400/40">
              <Film className="w-3.5 h-3.5" />
              <span>Available Archives ({totalRecordingsCount})</span>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recordings by filename or date..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all outline-none dark:bg-[#040e1c]/80 bg-white/90 backdrop-blur-xl border dark:border-[rgba(0,180,255,0.2)] border-sky-200/80 dark:text-white text-slate-900 placeholder:text-neutral-400 focus:dark:border-cyan-400 focus:border-sky-500 focus:ring-2 focus:ring-cyan-500/20 shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-cyan-400 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recordings List */}
        <section className="relative w-full">
          <CallList type="recordings" searchQuery={searchQuery} />
        </section>
      </div>
    </div>
  );
};

export default Recordings;
