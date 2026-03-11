import { cn } from '../../utils/cn';
import { getSubjectInitials } from '../../utils/subjectPresentation';

type SubjectBadgeSize = 'sm' | 'md' | 'lg';

interface SubjectBadgeProps {
  className?: string;
  initialsClassName?: string;
  name: string;
  showName?: boolean;
  size?: SubjectBadgeSize;
}

const sizeClasses: Record<SubjectBadgeSize, { badge: string; label: string }> = {
  sm: {
    badge: 'h-7 min-w-7 px-2 text-[11px]',
    label: 'text-[11px]',
  },
  md: {
    badge: 'h-9 min-w-9 px-3 text-xs',
    label: 'text-xs',
  },
  lg: {
    badge: 'h-10 min-w-10 px-3 text-sm',
    label: 'text-sm',
  },
};

export const SubjectBadge = ({
  className,
  initialsClassName,
  name,
  showName = true,
  size = 'md',
}: SubjectBadgeProps) => {
  const classes = sizeClasses[size];

  return (
    <span
      aria-label={showName ? undefined : name}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-1.5 py-1 text-foreground backdrop-blur-sm dark:border-white/10 dark:bg-white/5',
        className
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-border/70 bg-background/90 font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm dark:border-white/10 dark:bg-[#111827]',
          classes.badge,
          initialsClassName
        )}
        aria-hidden="true"
      >
        {getSubjectInitials(name)}
      </span>
      {showName && (
        <span className={cn('truncate font-medium', classes.label)}>
          {name}
        </span>
      )}
    </span>
  );
};
