import { Share2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SharedAssignmentBadgeProps {
  className?: string;
  compact?: boolean;
}

export const SharedAssignmentBadge = ({
  className,
  compact = false,
}: SharedAssignmentBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border border-primary/20 bg-primary/10 font-semibold text-primary',
      compact ? 'gap-1 px-2 py-1 text-[11px] tracking-[0.14em] uppercase' : 'gap-1.5 px-2.5 py-1 text-xs',
      className
    )}
  >
    <Share2 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
    Shared
  </span>
);
