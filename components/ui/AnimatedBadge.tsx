import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variants = {
  default: 'bg-white/5 text-white/70 border border-white/10',
  primary: 'bg-primary/20 text-primary-200 border border-primary/30 shadow-[0_0_10px_rgba(112,0,255,0.2)]',
  accent: 'bg-accent/20 text-accent-200 border border-accent/30 shadow-[0_0_10px_rgba(255,0,85,0.2)]',
  success: 'bg-green-500/20 text-green-300 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  danger: 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
};

export const AnimatedBadge = ({
  children,
  variant = 'default',
  className
}: AnimatedBadgeProps) => {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md',
        variants[variant],
        className
      )}
    >
      {children}
    </motion.span>
  );
};
