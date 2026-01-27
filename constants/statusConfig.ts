import { Status, Priority } from '../types';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const STATUS_CONFIG = {
  [Status.Completed]: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  [Status.InProgress]: {
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  },
  [Status.Pending]: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
} as const;

export const PRIORITY_CONFIG = {
  [Priority.High]: {
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.6)]',
    text: 'text-red-400',
  },
  [Priority.Medium]: {
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    text: 'text-amber-400',
  },
  [Priority.Low]: {
    dot: 'bg-slate-400',
    glow: '',
    text: 'text-slate-400',
  },
} as const;

export type StatusConfigType = typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];
export type PriorityConfigType = typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG];
