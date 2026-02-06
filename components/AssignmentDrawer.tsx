import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode } from './ViewSwitcher';
import { KanbanView } from './KanbanView';
import { Assignment } from '../types';

interface AssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  assignments: Assignment[];
}

export const AssignmentDrawer = ({
  isOpen,
  onClose,
  viewMode,
  assignments,
}: AssignmentDrawerProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className="fixed right-0 top-0 h-full w-[90vw] sm:w-[700px] lg:w-[900px] bg-gradient-to-br from-white to-purple-50/30 dark:from-background-dark dark:to-primary/5 border-l-2 border-gray-200 dark:border-primary/20 shadow-2xl z-[10000] overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-xl bg-primary/10"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="material-symbols-outlined text-primary text-2xl">
                      {viewMode === 'kanban' ? 'view_kanban' : 'calendar_view_month'}
                    </span>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {viewMode === 'kanban' ? 'Kanban Board' : 'Calendar View'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-white/60 font-medium">
                      {viewMode === 'kanban' ? 'Drag & drop to organize' : 'Timeline overview'}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  aria-label="Close drawer"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-80px)] overflow-y-auto custom-scrollbar p-6">
              <AnimatePresence mode="wait">
                {viewMode === 'kanban' ? (
                  <motion.div
                    key="kanban"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <KanbanView assignments={assignments} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex items-center justify-center"
                  >
                    <div className="text-center">
                      <motion.span
                        className="material-symbols-outlined text-primary text-6xl mb-4 opacity-50"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        calendar_view_month
                      </motion.span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Calendar View Coming Soon
                      </h3>
                      <p className="text-slate-500 dark:text-white/60 text-sm">
                        We're working on an amazing calendar experience for you
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
