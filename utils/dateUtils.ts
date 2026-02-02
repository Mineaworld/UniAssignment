/**
 * Date utility functions for consistent date handling across the app
 */

export interface DueDateInfo {
  main: string;
  sub: string;
  urgent: boolean;
}

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

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
