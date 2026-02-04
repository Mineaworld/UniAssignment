import React, { useState } from 'react';
import { useApp } from '../context';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { AnimatedThemeToggler } from '../components/ui/AnimatedThemeToggler';

const Calendar = () => {
  const { assignments, subjects } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0] ?? '';
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col h-screen md:h-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pt-4 md:pt-0">
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

      {/* Calendar Grid */}
      <GlassCard className="flex-1 rounded-2xl shadow-sm flex flex-col overflow-hidden p-0">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
          {/* Padding Days */}
          {paddingDays.map(i => (
            <div key={`padding-${i}`} className="bg-muted/10 dark:bg-white/[0.02] border-r border-b border-border dark:border-white/5 min-h-[100px]" />
          ))}

          {/* Actual Days */}
          {days.map(day => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateString = formatDate(date);
            const dayAssignments = assignments.filter(a => a.dueDate.startsWith(dateString));
            const isToday = today.toDateString() === date.toDateString();

            return (
              <div
                key={day}
                className={cn(
                  "relative p-2 border-r border-b border-border dark:border-white/5 min-h-[100px] transition-colors",
                  isToday ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/30 dark:hover:bg-white/5'
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold",
                    isToday ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"
                  )}>
                    {day}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <AnimatePresence>
                    {dayAssignments.map((assignment) => {
                      const subject = subjects.find(s => s.id === assignment.subjectId);
                      const statusColor = assignment.status === 'Completed' ? 'opacity-50 line-through' : '';

                      return (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "px-2 py-1 rounded text-xs truncate cursor-pointer font-medium border transition-all",
                            statusColor,
                            "bg-muted/50 dark:bg-white/10 border-border dark:border-white/10 hover:border-primary/50 hover:shadow-md"
                          )}
                          title={assignment.title}
                        >
                          <div className="flex items-center gap-1">
                            {subject && <span className={cn("w-1.5 h-1.5 rounded-full", subject.color)}></span>}
                            <span className="truncate text-foreground/80 dark:text-slate-200">{assignment.title}</span>
                          </div>
                        </motion.div>
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