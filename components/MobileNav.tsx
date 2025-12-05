import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const MobileNav = () => {
  const links = [
    { name: 'Home', icon: 'dashboard', path: '/' },
    { name: 'Tasks', icon: 'assignment', path: '/assignments' },
    { name: 'Calendar', icon: 'calendar_month', path: '/calendar' },
    { name: 'Subjects', icon: 'book', path: '/subjects' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#101622] border-t border-gray-200 dark:border-white/10 px-6 py-2 z-40 pb-safe">
      <nav className="flex justify-between items-center">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `
              relative flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
              ${isActive 
                ? 'text-primary' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill' : ''}`}>
                    {link.icon}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{link.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MobileNav;