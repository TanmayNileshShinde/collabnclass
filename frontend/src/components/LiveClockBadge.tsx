import React, { useState, useEffect, memo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveClockBadgeProps {
  className?: string;
  dateMode?: "full" | "condensed";
}

/**
 * Isolated Live Clock Badge component.
 * Encapsulates the 1-second interval timer so parent pages do not trigger
 * expensive full-tree re-renders every 1,000ms.
 */
export const LiveClockBadge: React.FC<LiveClockBadgeProps> = memo(({
  className,
  dateMode = "full",
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateStr =
    dateMode === "condensed"
      ? new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }).format(now)
      : new Intl.DateTimeFormat("en-US", {
          dateStyle: "full",
        }).format(now);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-2xl dark:bg-[#030b17]/80 bg-white/80 border dark:border-[rgba(0,180,255,0.2)] border-sky-200/80 shadow-md backdrop-blur-xl shrink-0",
        className
      )}
    >
      <div className="p-2 rounded-xl dark:bg-cyan-500/10 bg-sky-50 text-cyan-500 dark:text-cyan-400">
        <Clock className="w-5 h-5 animate-pulse" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="text-base sm:text-lg font-bold font-mono tracking-wider dark:text-cyan-300 text-slate-800">
          {timeStr}
        </span>
        <span className="text-[11px] font-medium dark:text-neutral-400 text-slate-500">
          {dateStr}
        </span>
      </div>
    </div>
  );
});

LiveClockBadge.displayName = "LiveClockBadge";

/**
 * Isolated Big Hero Clock for the Home landing dashboard.
 */
export const HeroLiveClock: React.FC<{ className?: string }> = memo(({ className }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(now);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative inline-block leading-none">
        {/* Dark Theme Clock Layer */}
        <h1 className="hero-clock-text hero-clock-dark text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight select-none leading-none transition-opacity duration-300 dark:opacity-100 opacity-0">
          {timeStr}
        </h1>
        {/* Light Theme Clock Layer */}
        <h1
          aria-hidden="true"
          className="hero-clock-text hero-clock-light text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight select-none leading-none absolute inset-0 transition-opacity duration-300 dark:opacity-0 opacity-100 pointer-events-none"
        >
          {timeStr}
        </h1>
      </div>
      <p className="text-xs sm:text-base font-semibold dark:text-cyan-100/80 text-slate-600 mt-1 sm:mt-2 tracking-wide transition-colors duration-300">
        {dateStr}
      </p>
    </div>
  );
});

HeroLiveClock.displayName = "HeroLiveClock";

export default LiveClockBadge;
