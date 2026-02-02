import { useState, useEffect, useCallback, useRef } from 'react';
import type { PomodoroSessionType } from '../types';
import { showNotification, playTimerSound, requestNotificationPermission } from '../utils/notifications';

// Classic Pomodoro durations (in minutes)
const WORK_DURATION = 25;
const SHORT_BREAK_DURATION = 5;
const LONG_BREAK_DURATION = 15;
const SESSIONS_BEFORE_LONG_BREAK = 4;

export interface PomodoroState {
  isRunning: boolean;
  timeLeft: number; // in seconds
  currentType: PomodoroSessionType;
  sessionCount: number; // completed work sessions
  selectedAssignmentId: string | null;
  selectedAssignmentTitle: string | null;
}

export interface UsePomodoroReturn extends PomodoroState {
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  selectAssignment: (id: string | null, title: string | null) => void;
  formatTime: (seconds: number) => string;
  progress: number; // 0-100
  totalDuration: number; // current session total in seconds
}

export function usePomodoro(
  onSessionComplete?: (type: PomodoroSessionType, assignmentId: string | null, duration: number, assignmentTitle: string | null) => void
): UsePomodoroReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION * 60);
  const [currentType, setCurrentType] = useState<PomodoroSessionType>('work');
  const [sessionCount, setSessionCount] = useState(0);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedAssignmentTitle, setSelectedAssignmentTitle] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRequestedPermission = useRef(false);

  // Request notification permission on first interaction
  useEffect(() => {
    if (isRunning && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, [isRunning]);

  const getDuration = useCallback((type: PomodoroSessionType): number => {
    switch (type) {
      case 'work':
        return WORK_DURATION * 60;
      case 'shortBreak':
        return SHORT_BREAK_DURATION * 60;
      case 'longBreak':
        return LONG_BREAK_DURATION * 60;
      default:
        throw new Error(`Unknown Pomodoro session type: ${type}`);
    }
  }, []);

  const totalDuration = getDuration(currentType);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);

    // Play sound and show notification
    playTimerSound();

    if (currentType === 'work') {
      showNotification('Pomodoro Complete! 🍅', {
        body: 'Great work! Time for a break.',
        tag: 'pomodoro-timer'
      });

      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);

      // Notify parent about completed work session
      if (onSessionComplete) {
        onSessionComplete('work', selectedAssignmentId, WORK_DURATION, selectedAssignmentTitle);
      }

      // Determine next break type
      if (newSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setCurrentType('longBreak');
        setTimeLeft(LONG_BREAK_DURATION * 60);
      } else {
        setCurrentType('shortBreak');
        setTimeLeft(SHORT_BREAK_DURATION * 60);
      }
    } else {
      showNotification('Break Over! ⏰', {
        body: 'Ready to focus again?',
        tag: 'pomodoro-timer'
      });

      setCurrentType('work');
      setTimeLeft(WORK_DURATION * 60);
    }
  }, [currentType, sessionCount, selectedAssignmentId, selectedAssignmentTitle, onSessionComplete]);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(WORK_DURATION * 60);
    setCurrentType('work');
    setSessionCount(0);
  }, []);

  const skip = useCallback(() => {
    setIsRunning(false);

    if (currentType === 'work') {
      // Skip work counts as completing the session for cycle purposes
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);

      // Determine break type based on cycle
      if (newSessionCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setCurrentType('longBreak');
        setTimeLeft(LONG_BREAK_DURATION * 60);
      } else {
        setCurrentType('shortBreak');
        setTimeLeft(SHORT_BREAK_DURATION * 60);
      }
    } else {
      // Skip break, go to work
      setCurrentType('work');
      setTimeLeft(WORK_DURATION * 60);
    }
  }, [currentType, sessionCount]);

  const selectAssignment = useCallback((id: string | null, title: string | null) => {
    setSelectedAssignmentId(id);
    setSelectedAssignmentTitle(title);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRunning,
    timeLeft,
    currentType,
    sessionCount,
    selectedAssignmentId,
    selectedAssignmentTitle,
    start,
    pause,
    reset,
    skip,
    selectAssignment,
    formatTime,
    progress,
    totalDuration
  };
}
