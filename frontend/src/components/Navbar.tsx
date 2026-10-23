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
        className="flex-between fixed z-50 w-full px-4 sm:px-6 py-3.5 lg:px-10 backdrop-blur-xl transition-all duration-300"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(90deg, rgba(2,11,24,0.95) 0%, rgba(4,22,44,0.95) 50%, rgba(2,13,26,0.95) 100%)'
            : 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 50%, rgba(255,255,255,0.95) 100%)',
          borderBottom: theme === 'dark' ? '1px solid rgba(0,180,255,0.08)' : '1px solid rgba(0,140,240,0.14)',
          boxShadow: theme === 'dark'
            ? '0 4px 24px rgba(0,40,100,0.2), inset 0 -1px 0 rgba(0,180,255,0.05)'
            : '0 4px 20px rgba(0,60,140,0.06), inset 0 -1px 0 rgba(0,140,240,0.08)',
        }}
      >
        {/* Bottom edge glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(90deg, transparent, rgba(0,160,255,0.2), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(2,132,199,0.25), transparent)',
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
            className="relative flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-all duration-300 group border focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer"
            style={{
              background: theme === "dark" ? 'rgba(0,20,50,0.7)' : 'rgba(255,255,255,0.95)',
              borderColor: theme === "dark" ? 'rgba(0,180,255,0.18)' : 'rgba(0,140,240,0.22)',
              boxShadow: theme === "dark" ? '0 0 12px rgba(0,80,180,0.15)' : '0 2px 8px rgba(0,60,140,0.06)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = theme === 'dark' ? 'rgba(0,229,255,0.45)' : 'rgba(0,140,240,0.5)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = theme === 'dark' ? '0 0 20px rgba(0,229,255,0.25)' : '0 4px 14px rgba(0,80,180,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = theme === "dark" ? 'rgba(0,180,255,0.18)' : 'rgba(0,140,240,0.22)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = theme === "dark" ? '0 0 12px rgba(0,80,180,0.15)' : '0 2px 8px rgba(0,60,140,0.06)';
            }}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-300 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]" />
            ) : (
              <Moon className="w-5 h-5 text-cyan-600 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(8,145,178,0.3)]" />
            )}
          </button>

          <SignedIn>
            <div
              className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-all duration-300"
              style={{
                background: theme === 'dark' ? 'rgba(0,20,50,0.7)' : 'rgba(255,255,255,0.95)',
                border: theme === 'dark' ? '1px solid rgba(0,180,255,0.18)' : '1px solid rgba(0,140,240,0.22)',
                boxShadow: theme === 'dark' ? '0 0 12px rgba(0,80,180,0.15)' : '0 2px 8px rgba(0,60,140,0.06)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = theme === 'dark' ? 'rgba(0,229,255,0.45)' : 'rgba(0,140,240,0.5)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = theme === 'dark' ? '0 0 20px rgba(0,229,255,0.25)' : '0 4px 14px rgba(0,80,180,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = theme === 'dark' ? 'rgba(0,180,255,0.18)' : 'rgba(0,140,240,0.22)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = theme === 'dark' ? '0 0 12px rgba(0,80,180,0.15)' : '0 2px 8px rgba(0,60,140,0.06)';
              }}
            >
              <UserButton
                afterSignOutUrl="/landing"
                appearance={{
                  elements: {
                    avatarBox: theme === 'dark'
                      ? "w-9 h-9 ring-2 ring-[rgba(0,180,255,0.25)] ring-offset-2 ring-offset-transparent transition-all duration-300"
                      : "w-9 h-9 ring-2 ring-[rgba(0,140,240,0.35)] ring-offset-2 ring-offset-transparent transition-all duration-300"
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
