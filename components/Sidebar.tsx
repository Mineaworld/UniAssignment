import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context';
import {
  LayoutGrid,
  FileText,
  Calendar as CalendarIcon,
  Book,
  Settings,
  LogOut,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';
import { AnimatedThemeToggler } from './ui/AnimatedThemeToggler';

const Sidebar = () => {
  const { user, logout, theme, toggleTheme } = useApp();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
    { name: 'Assignments', icon: FileText, path: '/dashboard/assignments' },
    { name: 'Calendar', icon: CalendarIcon, path: '/dashboard/calendar' },
    { name: 'Subjects', icon: Book, path: '/dashboard/subjects' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[280px] border-r border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-xl h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out">
      {/* Header / User */}
      <div className="p-4 pl-6">
        <div className="p-4 flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-white/90 dark:bg-white/10 border border-border/60 flex items-center justify-center overflow-hidden shadow-sm">
            <img src="/favicon.png" alt="Uni Assignment" className="h-7 w-7 object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground whitespace-nowrap truncate">Uni Assignment</span>
        </div>

        <button className="flex items-center gap-3 w-full p-2 -ml-2 rounded-lg hover:bg-muted/50 transition-colors text-left group">
          <div className="h-9 w-9 rounded-full bg-muted border border-border overflow-hidden shrink-0">
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-1">{user.major || 'Student'}</p>
          </div>
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 pl-6 py-2 overflow-y-auto custom-scrollbar">
        <nav className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-2">Workspace</p>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => cn(
                  "group relative flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                  isActive
                    ? "bg-primary/5 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-primary rounded-r-full" />
                )}
                <Icon strokeWidth={isActive ? 2 : 1.75} className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {link.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 pl-6 border-t border-border/50 bg-background/50">
        <div className="grid gap-1">
          <div className="flex items-center justify-between w-full px-2">
             <AnimatedThemeToggler className="h-8 w-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground -ml-2" />
             <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="justify-start gap-2 px-2 font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/5 flex-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs">Log Out</span>
              </Button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2 pt-2 opacity-50">
            <span>UniAssignment © 2026</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;