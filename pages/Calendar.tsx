import React, { useState } from 'react';
import { useApp } from '../context';
import { motion, AnimatePresence } from 'framer-motion';

const Calendar = () => {
  const { assignments, subjects } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Calendar</h1>
          <p className="text-slate-500 dark:text-white/60 mt-1">Plan your study schedule effectively.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-[#101622]/50 p-2 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-white">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-lg font-bold text-slate-900 dark:text-white w-40 text-center select-none">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-white">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white dark:bg-[#101622]/50 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-sm font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
          {/* Padding Days */}
          {paddingDays.map(i => (
            <div key={`padding-${i}`} className="bg-gray-50/50 dark:bg-white/[0.02] border-r border-b border-gray-100 dark:border-white/5 min-h-[100px]" />
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
                className={`
                  relative p-2 border-r border-b border-gray-100 dark:border-white/5 min-h-[100px] transition-colors
                  ${isToday ? 'bg-primary/5 dark:bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                    ${isToday ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-slate-700 dark:text-slate-300'}
                  `}>
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
                          className={`
                            px-2 py-1 rounded text-xs truncate cursor-pointer font-medium border-l-2
                            ${statusColor}
                            bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 hover:shadow-md transition-all
                          `}
                          style={{ borderLeftColor: subject?.color ? `var(--${subject.color})` : '#3b82f6' }}
                          title={assignment.title}
                        >
                           <div className="flex items-center gap-1">
                              {subject && <span className={`w-1.5 h-1.5 rounded-full ${subject.color}`}></span>}
                              <span className="truncate text-slate-700 dark:text-slate-200">{assignment.title}</span>
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
      </div>
    </div>
  );
};

export default Calendar;