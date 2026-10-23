import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';
import { Speech, Menu } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();

  return (
    <section className="w-full max-w-[264px]">
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open mobile navigation"
            className="sm:hidden p-2 rounded-xl dark:bg-cyber-elevated bg-white dark:border-cyan-500/25 border-slate-200 dark:text-cyan-300 text-slate-700 hover:border-cyan-400 dark:hover:text-cyan-200 hover:text-cyan-600 transition-colors shadow-sm cursor-pointer"
          >
            <Menu className="size-6" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="border-r dark:border-cyan-500/20 border-slate-200 dark:bg-[#040e1c] bg-white dark:text-white text-slate-900 backdrop-blur-2xl p-6 transition-colors"
        >
          {/* Brand header */}
          <Link to="/" className="flex items-center gap-2.5 mb-8">
            <div className="size-10 rounded-xl dark:bg-cyan-950/80 bg-cyan-100 dark:border-cyan-500/30 border-cyan-300 flex items-center justify-center dark:text-cyan-300 text-cyan-700 shadow-md">
              <Speech className="size-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight dark:bg-gradient-to-r dark:from-white dark:via-cyan-100 dark:to-cyan-400 bg-gradient-to-r from-slate-900 via-cyan-800 to-cyan-600 bg-clip-text text-transparent">
                CollabClass
              </p>
              <p className="text-[10px] font-mono tracking-widest dark:text-cyan-400 text-cyan-600 uppercase font-semibold">
                Virtual Classroom
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex h-[calc(100vh-120px)] flex-col justify-between overflow-y-auto">
            <SheetClose asChild>
              <section className="flex h-full flex-col gap-2.5">
                {sidebarLinks.map((item) => {
                  const isActive =
                    location.pathname === item.route ||
                    location.pathname.startsWith(`${item.route}/`);

                  return (
                    <SheetClose asChild key={item.route}>
                      <Link
                        to={item.route}
                        className={cn(
                          'flex items-center gap-3.5 px-4 py-3 rounded-xl w-full transition-all duration-200 text-sm font-semibold',
                          isActive
                            ? 'dark:bg-cyan-500/15 bg-cyan-50 dark:border-cyan-500/40 border-cyan-300 dark:text-cyan-300 text-cyan-700 shadow-sm'
                            : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/5 hover:bg-slate-100 border border-transparent'
                        )}
                      >
                        <img
                          src={item.imgURL}
                          alt={item.label}
                          width={18}
                          height={18}
                          className={cn(
                            'transition-opacity',
                            isActive ? 'brightness-0 invert' : 'opacity-70'
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </section>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;
