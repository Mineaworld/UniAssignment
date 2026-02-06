import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  X,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { usePomodoro } from '../../hooks/usePomodoro';
import { useApp } from '../../context';
import type { PomodoroSessionType } from '../../types';
import { Status } from '../../types';

// Dropdown position type
type DropdownPosition = 'below' | 'above' | 'left';

// Reusable style constants
const ICON_BUTTON_STYLES = `p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800
  hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors`;

// Dropdown positioning constants
const DROPDOWN_VIEWPORT_MARGIN = 20;
const MIN_DROPDOWN_HEIGHT = 200;
const DROPDOWN_WIDTH = 260;

// Pulsing indicator component to avoid duplication
const PulsingIndicator = ({
  colorClass,
  isAnimating
}: { colorClass: string; isAnimating: boolean }) => (
  <motion.div
    className={`w-2.5 h-2.5 rounded-full ${colorClass}`}
    animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
    transition={isAnimating ? { repeat: Infinity, duration: 1.5 } : {}}
  />
);

interface PomodoroWidgetProps {
  onSessionComplete?: (type: PomodoroSessionType, assignmentId: string | null, duration: number, assignmentTitle: string | null) => void;
}

// Animation variants for smoother transitions
const widgetVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 100,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 200
    }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 180,
      mass: 0.8
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 200,
      duration: 0.3
    }
  }
};

const floatingButtonVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      damping: 15,
      stiffness: 200,
      delay: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0,
    rotate: 180,
    transition: {
      duration: 0.2
    }
  },
  hover: {
    scale: 1.1,
    transition: {
      type: 'spring' as const,
      damping: 10,
      stiffness: 300
    }
  },
  tap: {
    scale: 0.9
  }
};

// Minimized state animation variants
const minimizedVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    x: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    x: 20,
    transition: {
      duration: 0.15
    }
  }
};

const expandedVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15
    }
  }
};

export const PomodoroWidget = ({ onSessionComplete }: PomodoroWidgetProps) => {
  const { assignments } = useApp();
  // Start hidden by default
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>('below');
  const pickerRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const {
    isRunning,
    timeLeft,
    currentType,
    sessionCount,
    selectedAssignmentId,
    selectedAssignmentTitle,
    totalDuration,
    start,
    pause,
    reset,
    skip,
    selectAssignment,
    formatTime,
    progress
  } = usePomodoro(onSessionComplete);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowAssignmentPicker(false);
      }
    };

    if (showAssignmentPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAssignmentPicker]);

  // Filter assignments - exclude completed ones
  const activeAssignments = useMemo(() => {
    return assignments.filter(a => a.status !== Status.Completed);
  }, [assignments]);

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = useCallback((): DropdownPosition => {
    if (!dropdownButtonRef.current || !widgetRef.current) return 'below';

    const buttonRect = dropdownButtonRef.current.getBoundingClientRect();
    const widgetRect = widgetRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Space available in each direction
    const spaceBelow = viewportHeight - buttonRect.bottom - DROPDOWN_VIEWPORT_MARGIN;
    const spaceAbove = buttonRect.top - DROPDOWN_VIEWPORT_MARGIN;
    const spaceLeft = widgetRect.left - DROPDOWN_VIEWPORT_MARGIN;

    // Priority: below > above > left
    if (spaceBelow >= MIN_DROPDOWN_HEIGHT) {
      return 'below';
    } else if (spaceAbove >= MIN_DROPDOWN_HEIGHT) {
      return 'above';
    } else if (spaceLeft >= DROPDOWN_WIDTH) {
      return 'left';
    }

    // Fallback to below with scrolling
    return 'below';
  }, []);

  // Update dropdown position when opening
  const handleToggleAssignmentPicker = useCallback(() => {
    if (!showAssignmentPicker) {
      setDropdownPosition(calculateDropdownPosition());
    }
    setShowAssignmentPicker(!showAssignmentPicker);
  }, [showAssignmentPicker, calculateDropdownPosition]);

  // Color schemes for different modes - memoized to prevent recalculation
  const colors = useMemo(() => {
    switch (currentType) {
      case 'work':
        return {
          bg: 'bg-rose-500',
          bgLight: 'bg-rose-500/10',
          text: 'text-rose-500',
          shadow: 'shadow-rose-500/25'
        };
      case 'shortBreak':
        return {
          bg: 'bg-emerald-500',
          bgLight: 'bg-emerald-500/10',
          text: 'text-emerald-500',
          shadow: 'shadow-emerald-500/25'
        };
      case 'longBreak':
        return {
          bg: 'bg-sky-500',
          bgLight: 'bg-sky-500/10',
          text: 'text-sky-500',
          shadow: 'shadow-sky-500/25'
        };
    }
  }, [currentType]);

  const modeLabel = useMemo(() => {
    switch (currentType) {
      case 'work': return 'Focus';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  }, [currentType]);

  // Floating button when widget is hidden
  if (!isVisible) {
    return (
      <AnimatePresence mode="wait">
        <motion.button
          key="floating-button"
          variants={floatingButtonVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          whileHover="hover"
          whileTap="tap"
          onClick={() => setIsVisible(true)}
          className={`fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50
            w-14 h-14 rounded-full ${colors.bg} shadow-xl ${colors.shadow}
            flex items-center justify-center cursor-pointer`}
        >
          <Timer className="h-6 w-6 text-white" />
        </motion.button>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="pomodoro-widget"
        variants={widgetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50"
      >
        <motion.div
          ref={widgetRef}
          layout
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`rounded-3xl overflow-hidden backdrop-blur-xl
            bg-white/95 dark:bg-zinc-900/95
            border border-zinc-200/50 dark:border-zinc-700/50
            shadow-2xl
            ${isMinimized ? 'w-auto' : 'w-[280px]'}`}
        >
          {/* Minimized State */}
          <AnimatePresence mode="wait">
            {isMinimized ? (
              <motion.div
                key="minimized"
                variants={minimizedVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                onClick={() => setIsMinimized(false)}
              >
                <PulsingIndicator colorClass={colors.bg} isAnimating={isRunning} />
                <span className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {formatTime(timeLeft)}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bgLight} ${colors.text}`}>
                  {modeLabel}
                </span>
              </motion.div>
            ) : (
              /* Expanded State */
              <motion.div
                key="expanded"
                variants={expandedVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Header - Improved layout with better spacing */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <PulsingIndicator colorClass={colors.bg} isAnimating={isRunning} />
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {modeLabel}
                    </span>
                  </div>
                  {/* Control buttons with better click targets */}
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMinimized(true);
                      }}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="Minimize"
                    >
                      <Minimize2 className="h-4 w-4 text-zinc-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVisible(false);
                      }}
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4 text-zinc-400" />
                    </button>
                  </div>
                </div>

                {/* Timer Display - Fixed height container */}
                <div className="px-6 pt-8 pb-6">
                  <div className="relative flex items-center justify-center h-48">
                    {/* Progress Ring */}
                    <svg className="absolute w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                      {/* Background ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-zinc-100 dark:text-zinc-800"
                      />
                      {/* Progress ring */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className={colors.text}
                        stroke="currentColor"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        initial={false}
                        animate={{
                          strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`
                        }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </svg>

                    {/* Time Display */}
                    <div className="relative z-10 text-center">
                      <span className="text-5xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Dots - Moved outside timer container with proper spacing */}
                <div className="flex items-center justify-center gap-3 pb-4">
                  <div className="flex items-center gap-2">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={{
                          scale: i < (sessionCount % 4) ? 1.2 : 1,
                          opacity: i < (sessionCount % 4) ? 1 : 0.25
                        }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        className={`w-2 h-2 rounded-full ${
                          i < (sessionCount % 4) ? colors.bg : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                      />
                    ))}
                  </div>
                  {sessionCount > 0 && (
                    <span className="text-xs font-medium text-zinc-400 tabular-nums">
                      {sessionCount} completed
                    </span>
                  )}
                </div>

              {/* Assignment Selector */}
              <div className="px-4 pb-4 relative" ref={pickerRef}>
                <button
                  ref={dropdownButtonRef}
                  onClick={handleToggleAssignmentPicker}
                  className="w-full flex items-center justify-between px-4 py-3
                    text-sm rounded-xl
                    bg-zinc-50 dark:bg-zinc-800/50
                    hover:bg-zinc-100 dark:hover:bg-zinc-800
                    border border-zinc-200 dark:border-zinc-700/50
                    transition-all duration-200"
                >
                  <span className={selectedAssignmentTitle ? 'text-zinc-900 dark:text-zinc-100 truncate pr-2' : 'text-zinc-400'}>
                    {selectedAssignmentTitle || 'Link to assignment'}
                  </span>
                  <motion.div
                    animate={{ rotate: showAssignmentPicker ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showAssignmentPicker && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                        y: dropdownPosition === 'above' ? 10 : dropdownPosition === 'below' ? -10 : 0,
                        x: dropdownPosition === 'left' ? 10 : 0
                      }}
                      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        y: dropdownPosition === 'above' ? 10 : dropdownPosition === 'below' ? -10 : 0,
                        x: dropdownPosition === 'left' ? 10 : 0
                      }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className={`absolute z-20 bg-white dark:bg-zinc-900
                        border border-zinc-200 dark:border-zinc-700
                        rounded-xl shadow-xl overflow-hidden
                        ${dropdownPosition === 'below'
                          ? 'left-4 right-4 mt-2 top-full'
                          : dropdownPosition === 'above'
                            ? 'left-4 right-4 mb-2 bottom-full'
                            : 'right-full mr-2 top-0 w-64'
                        }`}
                    >
                      <div className={`overflow-y-auto custom-scrollbar
                        ${dropdownPosition === 'left' ? 'max-h-64' : 'max-h-48'}`}>
                        <button
                          onClick={() => {
                            selectAssignment(null, null);
                            setShowAssignmentPicker(false);
                          }}
                          className="w-full px-4 py-3 text-sm text-left
                            text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800
                            border-b border-zinc-100 dark:border-zinc-800
                            transition-colors"
                        >
                          No assignment
                        </button>
                        {activeAssignments.map(assignment => (
                          <button
                            key={assignment.id}
                            onClick={() => {
                              selectAssignment(assignment.id, assignment.title);
                              setShowAssignmentPicker(false);
                            }}
                            className={`w-full px-4 py-3 text-sm text-left truncate
                              hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors
                              ${selectedAssignmentId === assignment.id
                                ? `${colors.bgLight} ${colors.text}`
                                : 'text-zinc-700 dark:text-zinc-300'
                              }`}
                          >
                            {assignment.title}
                          </button>
                        ))}
                        {activeAssignments.length === 0 && (
                          <div className="px-4 py-4 text-sm text-zinc-400 text-center">
                            No active assignments
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 px-4 pb-6">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  onClick={reset}
                  className={ICON_BUTTON_STYLES}
                  aria-label="Reset timer"
                >
                  <RotateCcw className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  onClick={isRunning ? pause : start}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white
                    ${colors.bg} hover:opacity-90 transition-opacity
                    shadow-lg ${colors.shadow}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isRunning ? (
                      <>
                        <Pause className="h-5 w-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        {timeLeft === totalDuration ? 'Start' : 'Resume'}
                      </>
                    )}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  onClick={skip}
                  className={ICON_BUTTON_STYLES}
                  aria-label="Skip to next session"
                >
                  <SkipForward className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                </motion.button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
