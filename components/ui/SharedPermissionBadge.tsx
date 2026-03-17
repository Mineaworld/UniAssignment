import { Eye, Pencil, Shield } from 'lucide-react';
import { SharedRole } from '../../types';
import { cn } from '../../utils/cn';

interface SharedPermissionBadgeProps {
  className?: string;
  role?: SharedRole;
}

const ROLE_CONFIG: Record<SharedRole, { icon: typeof Eye; label: string; tone: string }> = {
  owner: {
    icon: Shield,
    label: 'Owner',
    tone: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  },
  editor: {
    icon: Pencil,
    label: 'Editor',
    tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    tone: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  },
};

export const SharedPermissionBadge = ({
  className,
  role,
}: SharedPermissionBadgeProps) => {
  if (!role) {
    return null;
  }

  const { icon: Icon, label, tone } = ROLE_CONFIG[role];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        tone,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};
