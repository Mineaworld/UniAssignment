import React, { useEffect, useState } from 'react';
import { useApp } from '../context';
import { Assignment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { AnimatedThemeToggler } from '../components/ui/AnimatedThemeToggler';
import ViewAssignmentModal from '../components/ViewAssignmentModal';
import { SubjectBadge } from '../components/ui/SubjectBadge';
import { getAssignmentSubject } from '../utils/assignmentSubject';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const isSameCalendarDay = (left: Date, right: Date): boolean => (
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()
);

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createMonthDefaultDate = (date: Date): Date => {
  const today = new Date();
  if (today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth()) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const Calendar = () => {
  const { assignments, subjects } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => createMonthDefaultDate(new Date()));
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    setSelectedDate(createMonthDefaultDate(currentDate));
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const getAssignmentsForDate = (date: Date) => assignments
    .filter((assignment) => isSameCalendarDay(new Date(assignment.dueDate), date))
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const paddingDays = Array.from({ length: firstDay }, (_, index) => index);
  const selectedDayAssignments = getAssignmentsForDate(selectedDate);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col h-screen md:h-auto overflow-hidden">
      <ViewAssignmentModal
        isOpen={!!viewingAssignment}
        onClose={() => setViewingAssignment(null)}
        assignment={viewingAssignment}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pt-4 md:pt-0">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/40">Calendar</h1>
            <p className="text-muted-foreground mt-1">Plan your study schedule effectively.</p>
          </div>
          <AnimatedThemeToggler className="md:hidden h-10 w-10 bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 rounded-xl shrink-0" />
        </div>

        <GlassCard className="flex items-center gap-4 p-2 rounded-xl shadow-sm">
          <NeonButton onClick={prevMonth} variant="ghost" size="icon" className="rounded-lg">
            <ChevronLeft className="h-5 w-5" />
          </NeonButton>
          <span className="text-lg font-bold w-40 text-center select-none tracking-tight">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <NeonButton onClick={nextMonth} variant="ghost" size="icon" className="rounded-lg">
            <ChevronRight className="h-5 w-5" />
          </NeonButton>
        </GlassCard>
      </div>

      <div className="md:hidden flex min-h-0 flex-1 flex-col gap-4 pb-20">
        <GlassCard className="overflow-hidden rounded-2xl p-4 shadow-sm">
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {days.map((day) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const assignmentCount = getAssignmentsForDate(date).length;
              const isSelected = isSameCalendarDay(date, selectedDate);
              const isToday = isSameCalendarDay(date, today);

              return (
                <button
                  key={day}
                  data-testid={`calendar-day-mobile-${getLocalDateKey(date)}`}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'min-w-[72px] rounded-2xl border px-3 py-3 text-left transition-all',
                    isSelected
                      ? 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-muted/40 dark:border-white/10 dark:bg-white/[0.03]'
                  )}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                  </div>
                  <div className={cn(
                    'mt-2 text-2xl font-black tracking-tight',
                    isSelected || isToday ? 'text-foreground' : 'text-foreground/80'
                  )}>
                    {day}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{assignmentCount} task{assignmentCount === 1 ? '' : 's'}</span>
                    {isToday && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                        Today
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="flex-1 overflow-hidden rounded-2xl p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-sm text-muted-foreground">Assignments due on the selected day.</p>
            </div>
            <span className="rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground dark:border-white/10 dark:bg-white/5">
              {selectedDayAssignments.length}
            </span>
          </div>

          <div className="flex h-full flex-col gap-3 overflow-y-auto custom-scrollbar pb-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {selectedDayAssignments.map((assignment) => {
                const isCompleted = assignment.status === 'Completed';
                const subject = getAssignmentSubject(assignment, subjects);
                const dueDate = new Date(assignment.dueDate);
                const showDueTime = dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0;

                return (
                  <motion.button
                    key={assignment.id}
                    data-testid={`calendar-assignment-mobile-${assignment.id}`}
                    type="button"
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    onClick={() => setViewingAssignment(assignment)}
                    className={cn(
                      'rounded-2xl border border-border/70 bg-muted/20 p-4 text-left transition-all hover:border-primary/30 hover:bg-muted/40 dark:border-white/10 dark:bg-white/[0.04]',
                      isCompleted && 'opacity-70'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={cn('text-base font-semibold leading-tight text-foreground', isCompleted && 'line-through text-muted-foreground')}>
                          {assignment.title}
                        </div>
                        {showDueTime && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {dueDate.toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                      <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:border-white/10 dark:bg-[#111827]">
                        {assignment.priority}
                      </span>
                    </div>
                    {subject && (
                      <div className="mt-3">
                        <SubjectBadge name={subject.name} size="sm" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {selectedDayAssignments.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-base font-semibold text-foreground">No assignments due</p>
                <p className="mt-1 text-sm text-muted-foreground">Pick another day or add a new task.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="hidden flex-1 rounded-2xl shadow-sm md:flex md:flex-col md:overflow-hidden md:p-0">
        <div className="grid grid-cols-7 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
          {paddingDays.map((index) => (
            <div key={`padding-${index}`} className="bg-muted/10 dark:bg-white/[0.02] border-r border-b border-border dark:border-white/5 min-h-[100px]" />
          ))}

          {days.map((day) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayAssignments = getAssignmentsForDate(date);
            const isToday = isSameCalendarDay(today, date);

            return (
              <div
                key={day}
                className={cn(
                  'relative p-2 border-r border-b border-border dark:border-white/5 min-h-[100px] transition-colors',
                  isToday ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/30 dark:hover:bg-white/5'
                )}
              >
                <div className="mb-1 flex justify-between items-start">
                  <span className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold',
                    isToday ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'text-muted-foreground'
                  )}>
                    {day}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <AnimatePresence>
                    {dayAssignments.map((assignment) => {
                      const subject = getAssignmentSubject(assignment, subjects);
                      const isCompleted = assignment.status === 'Completed';

                      return (
                        <motion.button
                          key={assignment.id}
                          data-testid={`calendar-assignment-desktop-${assignment.id}`}
                          type="button"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => setViewingAssignment(assignment)}
                          className={cn(
                            'rounded-md border border-border px-2 py-1 text-left text-xs font-medium transition-all hover:border-primary/50 hover:shadow-md dark:border-white/10',
                            'bg-muted/50 dark:bg-white/10',
                            isCompleted && 'opacity-60'
                          )}
                          title={assignment.title}
                        >
                          <div className="flex items-center gap-1.5">
                            {subject && <SubjectBadge initialsClassName="h-5 min-w-5 px-1 text-[9px]" name={subject.name} showName={false} size="sm" />}
                            <span className={cn('truncate text-foreground/80 dark:text-slate-200', isCompleted && 'line-through')}>
                              {assignment.title}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};

export default Calendar;
