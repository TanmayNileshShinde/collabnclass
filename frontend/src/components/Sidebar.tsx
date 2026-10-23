import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useClerk();
  const { theme } = useTheme();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed left-4 top-24 z-50 max-sm:hidden lg:hidden p-3 rounded-full transition-all duration-200"
        style={{
          background: theme === 'dark' ? 'rgba(0,20,50,0.85)' : 'rgba(255,255,255,0.9)',
          border: theme === 'dark' ? '1px solid rgba(0,180,255,0.2)' : '1px solid rgba(0,140,240,0.25)',
          boxShadow: theme === 'dark' ? '0 0 16px rgba(0,100,200,0.2)' : '0 2px 10px rgba(0,80,180,0.1)',
          color: theme === 'dark' ? 'rgba(180,225,255,0.9)' : '#0284c7',
        }}
      >
        {isCollapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      <section
        className={cn(
          "sticky left-0 top-0 flex h-screen flex-shrink-0 flex-col justify-between p-6 pt-28 transition-all duration-300 ease-in-out max-sm:hidden lg:flex",
          isCollapsed ? "w-20" : "w-64",
          isCollapsed && "max-sm:w-20"
        )}
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(180deg, #020f1f 0%, #041a30 60%, #020d1a 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f4f9ff 60%, #eaf3fd 100%)',
          borderRight: theme === 'dark' ? '1px solid rgba(0,180,255,0.08)' : '1px solid rgba(0,140,240,0.14)',
          boxShadow: theme === 'dark'
            ? '4px 0 24px rgba(0,40,100,0.2), inset -1px 0 0 rgba(0,180,255,0.05)'
            : '4px 0 20px rgba(0,60,140,0.06), inset -1px 0 0 rgba(0,140,240,0.08)',
        }}
      >
        {/* Top edge glow */}
        <div
          className="absolute inset-y-0 right-0 w-px pointer-events-none"
          style={{
            background: theme === 'dark'
              ? 'linear-gradient(180deg, transparent, rgba(0,150,255,0.15), transparent)'
              : 'linear-gradient(180deg, transparent, rgba(2,132,199,0.2), transparent)',
          }}
        />

        <div className="flex flex-1 flex-col gap-2">
          {sidebarLinks.map((item) => {
            const isActive = location.pathname === item.route || location.pathname.startsWith(`${item.route}/`);

            return (
              <Link
                to={item.route}
                key={item.label}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'flex gap-3 items-center p-3 rounded-xl justify-start transition-all duration-200 relative overflow-hidden group',
                )}
                style={isActive ? {
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(0,80,160,0.7) 0%, rgba(0,120,200,0.5) 100%)'
                    : 'linear-gradient(135deg, rgba(2,132,199,0.95) 0%, rgba(0,160,255,0.9) 100%)',
                  border: theme === 'dark' ? '1px solid rgba(0,180,255,0.25)' : '1px solid rgba(2,132,199,0.3)',
                  boxShadow: theme === 'dark'
                    ? '0 0 20px rgba(0,100,200,0.2), inset 0 1px 0 rgba(0,200,255,0.1)'
                    : '0 4px 15px rgba(2,132,199,0.25)',
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                }}
              >
                {/* Hover fill */}
                {!isActive && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none"
                    style={{
                      background: theme === 'dark' ? 'rgba(0,40,90,0.6)' : 'rgba(2,132,199,0.08)',
                      border: theme === 'dark' ? '1px solid rgba(0,150,255,0.12)' : '1px solid rgba(2,132,199,0.15)',
                    }}
                  />
                )}

                {/* Active left accent line */}
                {isActive && (
                  <div
                    className="absolute left-0 inset-y-2 w-0.5 rounded-full"
                    style={{
                      background: theme === 'dark'
                        ? 'linear-gradient(180deg, rgba(0,200,255,0.8), rgba(0,120,220,0.4))'
                        : 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.6))',
                    }}
                  />
                )}

                <img
                  src={item.imgURL}
                  alt={item.label}
                  width={20}
                  height={20}
                  className={cn(
                    "transition-all duration-200 relative z-10 flex-shrink-0",
                    isActive
                      ? 'brightness-0 invert'
                      : theme === 'dark'
                        ? 'opacity-50 group-hover:opacity-75'
                        : 'opacity-70 group-hover:opacity-100 brightness-0'
                  )}
                />
                {!isCollapsed && (
                  <p
                    className="text-base font-semibold transition-all duration-200 relative z-10"
                    style={{
                      color: isActive
                        ? '#ffffff'
                        : theme === 'dark'
                          ? 'rgba(120,180,220,0.75)'
                          : '#475569',
                    }}
                  >
                    {item.label}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: theme === 'dark' ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: theme === 'dark' ? 'rgba(255,120,120,0.95)' : '#dc2626',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(220,38,38,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = theme === 'dark' ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.08)';
            }}
          >
            {!isCollapsed && "Logout"}
          </button>

          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg transition-all duration-200 items-center justify-center cursor-pointer"
            style={{
              background: theme === 'dark' ? 'rgba(0,20,50,0.6)' : 'rgba(255,255,255,0.8)',
              border: theme === 'dark' ? '1px solid rgba(0,150,255,0.12)' : '1px solid rgba(0,140,240,0.18)',
              color: theme === 'dark' ? 'rgba(100,170,220,0.6)' : '#64748b',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = theme === 'dark' ? 'rgba(180,225,255,0.9)' : '#0284c7';
              (e.currentTarget as HTMLButtonElement).style.borderColor = theme === 'dark' ? 'rgba(0,180,255,0.25)' : 'rgba(0,140,240,0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = theme === 'dark' ? 'rgba(100,170,220,0.6)' : '#64748b';
              (e.currentTarget as HTMLButtonElement).style.borderColor = theme === 'dark' ? 'rgba(0,150,255,0.12)' : 'rgba(0,140,240,0.18)';
            }}
          >
            <ChevronLeft
              size={16}
              className={cn('transition-transform duration-300', isCollapsed ? 'rotate-180' : '')}
            />
          </button>
        </div>
      </section>
    </>
  );
};

export default Sidebar;
