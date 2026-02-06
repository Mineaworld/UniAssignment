import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export type ViewMode = 'list' | 'kanban' | 'calendar';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewSwitcher = ({ currentView, onViewChange }: ViewSwitcherProps) => {
  const views: { value: ViewMode; icon: string; label: string }[] = [
    { value: 'list', icon: 'view_list', label: 'List' },
    { value: 'kanban', icon: 'view_kanban', label: 'Kanban' },
    { value: 'calendar', icon: 'calendar_view_month', label: 'Calendar' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border-2 border-gray-200 dark:border-white/10 shadow-lg shadow-black/5">
      {views.map((view) => {
        const isActive = currentView === view.value;
        return (
          <motion.button
            key={view.value}
            onClick={() => onViewChange(view.value)}
            className={cn(
              'relative px-4 py-2.5 rounded-xl text-sm font-bold transition-colors z-10',
              isActive
                ? 'text-white'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            )}
            whileHover={{ scale: isActive ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeView"
                className="absolute inset-0 bg-gradient-to-r from-primary to-primary-600 rounded-xl shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <motion.span
                className="material-symbols-outlined text-lg"
                animate={{ rotate: isActive ? 360 : 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
              >
                {view.icon}
              </motion.span>
              <span className="hidden sm:inline">{view.label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
