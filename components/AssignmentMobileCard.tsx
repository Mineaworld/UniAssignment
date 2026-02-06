import React, { useState } from 'react';
import { Assignment, Priority, Status } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { getColorValue } from '../constants/colors';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../constants/statusConfig';
import { formatDueDate, isOverdue as checkOverdue } from '../utils/dateUtils';

interface AssignmentMobileCardProps {
  assignment: Assignment;
  subject?: { name: string; color: string };
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

export const AssignmentMobileCard = ({
  assignment,
  subject,
  onClick,
  onEdit,
  onDelete,
  index,
}: AssignmentMobileCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const isCompleted = assignment.status === Status.Completed;
  const isOverdue = checkOverdue(assignment.dueDate, isCompleted);
  const hasActiveReminder = assignment.reminder?.enabled && !assignment.reminder?.sentAt;

  const titleSize = assignment.priority === Priority.High || isOverdue
    ? 'text-xl'
    : assignment.priority === Priority.Medium
    ? 'text-lg'
    : 'text-base';

  const statusStyle = STATUS_CONFIG[assignment.status];
  const StatusIcon = statusStyle.icon;
  const priorityStyle = PRIORITY_CONFIG[assignment.priority];
  const dueInfo = formatDueDate(assignment.dueDate, isCompleted);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5',
        'backdrop-blur-xl border transition-all duration-300',
        'active:scale-[0.98] cursor-pointer',
        'bg-white/70 dark:bg-black/40 border-black/5 dark:border-white/10',
        statusStyle.glow,
        isCompleted && 'opacity-70'
      )}
    >
      {subject && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full"
          style={{
            background: getColorValue(subject.color),
            boxShadow: `0 0 12px ${getColorValue(subject.color)}`
          }}
        />
      )}

      <div className={cn(
        'absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
        'min-h-[44px] min-w-[44px] justify-center',
        statusStyle.bg,
        statusStyle.border
      )}>
        <StatusIcon className={cn('h-4 w-4', statusStyle.color)} />
        <span className={cn('text-xs font-medium', statusStyle.color)}>
          {assignment.status}
        </span>
      </div>

      {hasActiveReminder && (
        <div className="absolute top-4 left-4 flex items-center justify-center h-10 w-10 rounded-full bg-violet-500/10 border border-violet-500/30">
          <Bell className="h-4 w-4 text-violet-400" />
        </div>
      )}

      <div className="relative space-y-3 mt-2">
        <h3 className={cn(
          'font-bold leading-tight tracking-tight pr-24',
          hasActiveReminder && 'pl-14',
          titleSize,
          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground',
          isOverdue && 'text-red-400 dark:text-red-400'
        )}>
          {assignment.title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {subject && (
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold min-h-[32px]"
              style={{
                backgroundColor: `${getColorValue(subject.color)}20`,
                color: getColorValue(subject.color)
              }}
            >
              {subject.name}
            </span>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 min-h-[32px]">
            <div className={cn('h-2.5 w-2.5 rounded-full', priorityStyle.dot, priorityStyle.glow)} />
            <span className={cn('text-xs font-medium uppercase tracking-wide', priorityStyle.text)}>
              {assignment.priority}
            </span>
          </div>
        </div>

        <div className={cn(
          'flex items-baseline gap-2 pt-2 pb-1',
          'border-t border-border/50 dark:border-white/5'
        )}>
          <div className="flex-1">
            <div className={cn(
              'text-2xl font-black tracking-tight',
              dueInfo.urgent ? 'text-foreground' : 'text-muted-foreground',
              isOverdue && 'text-red-500 dark:text-red-400'
            )}>
              {dueInfo.main}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {dueInfo.sub}
            </div>
          </div>

          {assignment.examType && (
            <div className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/30">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                {assignment.examType}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full right-0 mb-2 min-w-[120px] bg-white dark:bg-[#1e1e1e] rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden z-30"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 text-foreground transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <div className="h-px bg-border/50" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
