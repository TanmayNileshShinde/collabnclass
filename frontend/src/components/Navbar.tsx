import { Link } from "react-router-dom";
import { SignedIn, UserButton } from "@clerk/clerk-react";
import { Speech, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import MobileNav from "./MobileNav";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        .nav-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 2;
          transition: letter-spacing 0.35s ease;
        }

        .nav-logo-group:hover .nav-logo-text {
          letter-spacing: -0.01em;
        }

        .nav-logo-sub {
          font-family: 'Syne', sans-serif;
          font-size: 0.52rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          line-height: 1;
          margin-top: 2px;
          transition: color 0.3s ease;
        }

        .dark .nav-logo-sub {
          color: rgba(80, 175, 255, 0.5);
        }

        .dark .nav-logo-group:hover .nav-logo-sub {
          color: rgba(80, 200, 255, 0.75);
        }

        :not(.dark) .nav-logo-sub {
          color: rgba(2, 132, 199, 0.75);
        }

        :not(.dark) .nav-logo-group:hover .nav-logo-sub {
          color: rgba(2, 132, 199, 0.95);
        }

        .nav-underline {
          height: 1.5px;
          width: 0;
          border-radius: 2px;
          margin-top: 3px;
          background: linear-gradient(90deg, rgba(0,180,255,0.9), rgba(0,100,220,0.4));
          transition: width 0.45s cubic-bezier(0.4,0,0.2,1);
        }

        .nav-logo-group:hover .nav-underline {
          width: 100%;
        }

        /* Split color on "Collab" vs "Class" */
        .dark .logo-part-1 {
          background: linear-gradient(135deg, #ffffff 0%, #b8deff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dark .logo-part-2 {
          background: linear-gradient(135deg, #60baff 0%, #0088ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        :not(.dark) .logo-part-1 {
          background: linear-gradient(135deg, #091e42 0%, #0284c7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        :not(.dark) .logo-part-2 {
          background: linear-gradient(135deg, #0284c7 0%, #0099ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <nav
        className="flex-between fixed z-50 w-full px-4 sm:px-6 py-3.5 lg:px-10 backdrop-blur-xl transition-all duration-300 dark:bg-[#020b18]/90 bg-white/90 border-b dark:border-cyan-500/10 border-cyan-500/15 dark:shadow-[0_4px_24px_rgba(0,40,100,0.2)] shadow-[0_4px_20px_rgba(0,60,140,0.06)] relative overflow-hidden"
      >
        {/* Subtle background gradient overlay with opacity transition */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-white via-[#f0f8ff] to-white dark:opacity-0 opacity-90 -z-10" />
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-[#020b18] via-[#04162c] to-[#020d1a] dark:opacity-95 opacity-0 -z-10" />

        {/* Bottom edge glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none transition-opacity duration-300 dark:opacity-100 opacity-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,160,255,0.2), transparent)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none transition-opacity duration-300 dark:opacity-0 opacity-100"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(2,132,199,0.25), transparent)',
          }}
        />

        <Link to="/" className="flex items-center gap-3 nav-logo-group">
          {/* Icon */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-lg opacity-0 transition-all duration-500 scale-150 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,150,255,0.25), transparent)' }}
            />
            <div className="relative" style={{ filter: theme === 'dark' ? 'drop-shadow(0 0 6px rgba(0,180,255,0.4))' : 'none' }}>
              <Speech color={theme === 'dark' ? "rgba(180,225,255,0.9)" : "#0284c7"} />
            </div>
          </div>

          {/* Wordmark */}
          <div className="flex flex-col justify-center max-sm:hidden">
            <div className="nav-logo-text">
              <span className="logo-part-1">Collab</span><span className="logo-part-2">Class</span>
            </div>
            <p className="nav-logo-sub">Live · Learn · Connect</p>
            <div className="nav-underline" />
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="relative flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 dark:bg-[#001432]/70 bg-white/95 border dark:border-cyan-400/20 border-sky-300/40 dark:shadow-[0_0_12px_rgba(0,80,180,0.15)] shadow-[0_2px_8px_rgba(0,60,140,0.06)] hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-[0_4px_14px_rgba(0,80,180,0.15)] dark:hover:shadow-[0_0_20px_rgba(0,229,255,0.25)]"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-300 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]" />
            ) : (
              <Moon className="w-5 h-5 text-cyan-600 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(8,145,178,0.3)]" />
            )}
          </button>

          <SignedIn>
            <div
              className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300 dark:bg-[#001432]/70 bg-white/95 border dark:border-cyan-400/20 border-sky-300/40 dark:shadow-[0_0_12px_rgba(0,80,180,0.15)] shadow-[0_2px_8px_rgba(0,60,140,0.06)] hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-[0_4px_14px_rgba(0,80,180,0.15)] dark:hover:shadow-[0_0_20px_rgba(0,229,255,0.25)]"
            >
              <UserButton
                afterSignOutUrl="/landing"
                appearance={{
                  elements: {
                    avatarBox: theme === 'dark'
                      ? "w-9 h-9 ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-transparent transition-all duration-300 hover:ring-cyan-300 shadow-[0_0_12px_rgba(0,180,255,0.3)]"
                      : "w-9 h-9 ring-2 ring-sky-400/60 ring-offset-2 ring-offset-transparent transition-all duration-300 hover:ring-sky-500 shadow-[0_2px_8px_rgba(0,120,220,0.15)]",
                    userButtonPopoverCard: theme === 'dark'
                      ? "!bg-[#040e1c]/95 !backdrop-blur-2xl !border !border-cyan-500/30 !rounded-2xl !shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,180,255,0.2)] !text-white overflow-hidden"
                      : "!bg-white/95 !backdrop-blur-2xl !border !border-sky-200 !rounded-2xl !shadow-[0_16px_35px_rgba(0,80,180,0.12)] !text-slate-800 overflow-hidden",
                    userButtonPopoverMain: "!bg-transparent !p-2",
                    userPreview: theme === 'dark'
                      ? "!p-3 !mb-2 !rounded-xl !bg-[#07172e]/80 !border !border-cyan-500/20"
                      : "!p-3 !mb-2 !rounded-xl !bg-sky-50/80 !border !border-sky-200/60",
                    userPreviewAvatarBox: "!w-10 !h-10 !rounded-xl !ring-2 " + (theme === 'dark' ? "!ring-cyan-400/50 !shadow-[0_0_10px_rgba(0,180,255,0.4)]" : "!ring-sky-400/60"),
                    userPreviewMainIdentifier: "!font-bold !text-sm " + (theme === 'dark' ? "!text-white" : "!text-slate-900"),
                    userPreviewSecondaryIdentifier: "!text-xs " + (theme === 'dark' ? "!text-cyan-200/70" : "!text-slate-500"),
                    userButtonPopoverActions: "!space-y-1 !p-1",
                    userButtonPopoverActionButton: theme === 'dark'
                      ? "!rounded-xl !px-3 !py-2.5 !text-slate-200 hover:!text-cyan-300 hover:!bg-cyan-500/15 !transition-all active:!scale-[0.98]"
                      : "!rounded-xl !px-3 !py-2.5 !text-slate-700 hover:!text-sky-600 hover:!bg-sky-100/70 !transition-all active:!scale-[0.98]",
                    userButtonPopoverActionButtonIcon: theme === 'dark' ? "!text-cyan-400" : "!text-sky-600",
                    userButtonPopoverActionButtonText: "!text-xs !font-medium",
                    userButtonPopoverFooter: theme === 'dark'
                      ? "!border-t !border-cyan-500/20 !bg-[#020813]/80 !py-2.5 !px-3 !text-neutral-400"
                      : "!border-t !border-sky-100 !bg-slate-50/80 !py-2.5 !px-3 !text-slate-400",
                  }
                }}
              />
            </div>
          </SignedIn>

          <MobileNav />
        </div>
      </nav>
    </>
  );
};

export default Navbar;
