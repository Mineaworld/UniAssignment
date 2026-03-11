/**
 * Date utility functions for consistent date handling across the app
 */

export interface DueDateInfo {
  main: string;
  sub: string;
  urgent: boolean;
}

interface LocalDateParts {
  day: number;
  monthIndex: number;
  year: number;
}

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

const parseLocalDateParts = (date: string): LocalDateParts => {
  const [yearPart = '', monthPart = '', dayPart = ''] = date.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  const day = Number(dayPart);

  return {
    day,
    monthIndex,
    year,
  };
};

export const buildLocalDate = (date: string, time?: string): Date => {
  const { year, monthIndex, day } = parseLocalDateParts(date);
  const [hoursPart = '0', minutesPart = '0'] = (time || '').split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  return new Date(year, monthIndex, day, hours, minutes, 0, 0);
};

export const buildLocalIsoString = (date: string, time?: string): string => {
  return buildLocalDate(date, time).toISOString();
};

export const formatDateInputValue = (date: string | Date): string => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatTimeInputValue = (date: string | Date): string => {
  const value = new Date(date);
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const getDaysUntilDue = (dueDate: string | Date): number => {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / MS_PER_DAY);
};

export const isOverdue = (dueDate: string | Date, isCompleted: boolean): boolean => {
  if (isCompleted) return false;
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return new Date() > due;
};

export const formatDueDate = (dueDate: string | Date, isCompleted = false): DueDateInfo => {
  const due = new Date(dueDate);
  const diffDays = getDaysUntilDue(due);

  const timeStr = due.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (diffDays < 0 && !isCompleted) {
    return {
      main: 'Overdue',
      sub: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      urgent: true
    };
  }

  if (diffDays === 0) {
    return { main: 'Today', sub: timeStr, urgent: true };
  }

  if (diffDays === 1) {
    return { main: 'Tomorrow', sub: timeStr, urgent: true };
  }

  if (diffDays > 0 && diffDays <= 7) {
    return {
      main: `${diffDays} days`,
      sub: due.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true }),
      urgent: false
    };
  }

  return {
    main: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sub: timeStr,
    urgent: false
  };
};

export const formatRelativeDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / MS_PER_DAY);

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
