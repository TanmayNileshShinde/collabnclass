import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface HomeCardProps {
  className?: string;
  img: string;
  title: string;
  description: string;
  badge?: string;
  accent?: 'cyan' | 'blue' | 'amber' | 'purple';
  handleClick?: () => void;
}

const accentConfigs = {
  cyan: {
    border: 'dark:hover:border-cyan-400/50 hover:border-cyan-400',
    glow: 'group-hover:shadow-[0_0_35px_rgba(0,229,255,0.22)]',
    tagColor: 'dark:text-cyan-400 text-cyan-600',
    iconBg: 'dark:bg-cyan-950/70 bg-cyan-100 dark:border-cyan-500/30 border-cyan-200 dark:text-cyan-400 text-cyan-700',
    orbBg: 'bg-cyan-500/20',
    topSweep: 'rgba(0,229,255,0.45)',
    arrowColor: 'dark:text-cyan-400 text-cyan-600 dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-100/80 dark:group-hover:bg-cyan-500/10 group-hover:bg-cyan-100 dark:group-hover:border-cyan-500/30 group-hover:border-cyan-300',
  },
  blue: {
    border: 'dark:hover:border-sky-400/50 hover:border-sky-400',
    glow: 'group-hover:shadow-[0_0_35px_rgba(2,132,199,0.22)]',
    tagColor: 'dark:text-sky-400 text-sky-600',
    iconBg: 'dark:bg-sky-950/70 bg-sky-100 dark:border-sky-500/30 border-sky-200 dark:text-sky-400 text-sky-700',
    orbBg: 'bg-sky-500/20',
    topSweep: 'rgba(2,132,199,0.45)',
    arrowColor: 'dark:text-sky-400 text-sky-600 dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-100/80 dark:group-hover:bg-sky-500/10 group-hover:bg-sky-100 dark:group-hover:border-sky-500/30 group-hover:border-sky-300',
  },
  amber: {
    border: 'dark:hover:border-amber-400/50 hover:border-amber-400',
    glow: 'group-hover:shadow-[0_0_35px_rgba(245,158,11,0.22)]',
    tagColor: 'dark:text-amber-400 text-amber-600',
    iconBg: 'dark:bg-amber-950/70 bg-amber-100 dark:border-amber-500/30 border-amber-200 dark:text-amber-400 text-amber-700',
    orbBg: 'bg-amber-500/20',
    topSweep: 'rgba(245,158,11,0.45)',
    arrowColor: 'dark:text-amber-400 text-amber-600 dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-100/80 dark:group-hover:bg-amber-500/10 group-hover:bg-amber-100 dark:group-hover:border-amber-500/30 group-hover:border-amber-300',
  },
  purple: {
    border: 'dark:hover:border-purple-400/50 hover:border-purple-400',
    glow: 'group-hover:shadow-[0_0_35px_rgba(168,85,247,0.22)]',
    tagColor: 'dark:text-purple-400 text-purple-600',
    iconBg: 'dark:bg-purple-950/70 bg-purple-100 dark:border-purple-500/30 border-purple-200 dark:text-purple-400 text-purple-700',
    orbBg: 'bg-purple-500/20',
    topSweep: 'rgba(168,85,247,0.45)',
    arrowColor: 'dark:text-purple-400 text-purple-600 dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-100/80 dark:group-hover:bg-purple-500/10 group-hover:bg-purple-100 dark:group-hover:border-purple-500/30 group-hover:border-purple-300',
  },
};

const HomeCard = ({
  className,
  img,
  title,
  description,
  badge,
  accent = 'cyan',
  handleClick,
}: HomeCardProps) => {
  const config = accentConfigs[accent] || accentConfigs.cyan;

  return (
    <section
      className={cn(
        'p-6 sm:p-7 flex flex-col justify-between w-full min-h-[220px] sm:min-h-[235px] rounded-2xl sm:rounded-[24px] cursor-pointer group relative overflow-hidden transition-all duration-300',
        'dark:border dark:border-[rgba(0,180,255,0.16)] border border-slate-200/80 backdrop-blur-xl',
        'hover:-translate-y-1.5 active:scale-[0.99]',
        config.border,
        config.glow,
        className
      )}
      onClick={handleClick}
    >
      {/* Top edge neon sweep */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${config.topSweep}, transparent)`,
        }}
      />

      {/* Ambient background glow orb */}
      <div
        className={cn(
          'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
          config.orbBg
        )}
      />

      {/* Top row: Anchor Icon on far left, Action Arrow on far right */}
      <div className="flex items-center justify-between relative z-10 w-full">
        <div
          className={cn(
            'size-13 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 shadow-md flex-shrink-0',
            config.iconBg
          )}
        >
          <img
            src={img}
            alt="card-icon"
            width={24}
            height={24}
            className="brightness-0 dark:invert opacity-80 dark:opacity-95"
          />
        </div>

        <div
          className={cn(
            'size-9 rounded-full border flex items-center justify-center opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200',
            config.arrowColor
          )}
        >
          <ArrowUpRight className="size-4" />
        </div>
      </div>

      {/* Content: Clean visual hierarchy with category tag, title, and description */}
      <div className="flex flex-col gap-1.5 relative z-10 mt-6">
        {badge && (
          <span
            className={cn(
              'text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest block leading-none',
              config.tagColor
            )}
          >
            {badge}
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight dark:text-white text-slate-800 dark:group-hover:text-cyan-200 group-hover:text-cyan-600 transition-colors duration-200">
          {title}
        </h2>
        <p className="text-xs sm:text-sm font-medium dark:text-slate-400 text-slate-600 dark:group-hover:text-slate-200 group-hover:text-slate-900 transition-colors duration-200 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Bottom edge glow on hover */}
      <div
        className="absolute inset-x-0 bottom-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.4), transparent)' }}
      />
    </section>
  );
};

export default HomeCard;
