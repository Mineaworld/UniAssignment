import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { name: 'Dashboard', icon: 'dashboard', path: '/' },
    { name: 'Assignments', icon: 'assignment', path: '/assignments' },
    { name: 'Calendar', icon: 'calendar_month', path: '/calendar' },
    { name: 'Subjects', icon: 'book', path: '/subjects' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#101622]/95 border-r border-gray-200 dark:border-white/10 h-screen sticky top-0 backdrop-blur-md z-30">
      <div className="flex flex-col flex-grow p-4 gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-primary/10">
            <img src="/logo.png" alt="Uni Assignment Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Uni Assignment</h1>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
          <div
            className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-white dark:border-white/10 shadow-sm"
            style={{ backgroundImage: `url(${user.avatar})` }}
          />
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold truncate">{user.name}</h2>
            <p className="text-slate-500 dark:text-white/60 text-xs truncate">{user.major}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden
                  ${isActive
                    ? 'text-primary font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`material-symbols-outlined z-10 text-[20px] ${isActive ? 'fill' : ''}`}>{link.icon}</span>
                <span className="z-10 text-sm">{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center gap-2">
        <button
          onClick={logout}
          className="flex-1 flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-medium text-sm">Sign Out</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;