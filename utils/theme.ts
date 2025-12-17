import { Priority, Status } from '../types';

export const getPriorityColor = (p: Priority) => {
    switch (p) {
        case Priority.High: return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300';
        case Priority.Medium: return 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300';
        case Priority.Low: return 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300';
    }
};

export const getStatusColor = (s: Status) => {
    switch (s) {
        case Status.Completed: return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
        case Status.InProgress: return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
        case Status.Pending: return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
        default: return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
};
