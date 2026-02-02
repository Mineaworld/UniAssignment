/**
 * Tailwind color class to hex value mapping
 * Used for inline styles where Tailwind classes can't be applied dynamically
 */
export const TAILWIND_COLORS: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-green-500': '#22c55e',
  'bg-red-500': '#ef4444',
  'bg-yellow-500': '#eab308',
  'bg-purple-500': '#a855f7',
  'bg-pink-500': '#ec4899',
  'bg-indigo-500': '#6366f1',
  'bg-orange-500': '#f97316',
  'bg-teal-500': '#14b8a6',
  'bg-cyan-500': '#06b6d4',
  'bg-emerald-500': '#10b981',
  'bg-rose-500': '#f43f5e',
  'bg-violet-500': '#8b5cf6',
  'bg-amber-500': '#f59e0b',
  'bg-lime-500': '#84cc16',
  'bg-sky-500': '#0ea5e9',
};

export const DEFAULT_COLOR = '#6366f1';

export const getColorValue = (tailwindClass: string): string => {
  return TAILWIND_COLORS[tailwindClass] || DEFAULT_COLOR;
};

export const SUBJECT_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
];
