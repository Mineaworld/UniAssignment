import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock3, GripVertical } from 'lucide-react';
import { Assignment, Priority, Status } from '../types';
import { cn } from '../utils/cn';
import { useApp } from '../context';
import { SubjectBadge } from './ui/SubjectBadge';

interface KanbanCardProps {
  assignment: Assignment;
  clickDisabled?: boolean;
  dragOverlay?: boolean;
  onClick: () => void;
}

const priorityClasses = {
  [Priority.High]: 'bg-red-500/10 text-red-500 border-red-500/20',
  [Priority.Medium]: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  [Priority.Low]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
} as const;

const statusIcons = {
  [Status.Pending]: AlertCircle,
  [Status.InProgress]: Clock3,
  [Status.Completed]: CheckCircle2,
} as const;

const statusIconClasses = {
  [Status.Pending]: 'text-amber-500',
  [Status.InProgress]: 'text-blue-500',
  [Status.Completed]: 'text-emerald-500',
} as const;

const KanbanCardContent = ({
  assignment,
  dragOverlay = false,
}: Pick<KanbanCardProps, 'assignment' | 'dragOverlay'>) => {
  const { subjects } = useApp();
  const isCompleted = assignment.status === Status.Completed;
  const isOverdue = new Date(assignment.dueDate) < new Date() && !isCompleted;
  const StatusIcon = statusIcons[assignment.status];
  const subjectName = subjects.find((subject) => subject.id === assignment.subjectId)?.name;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', priorityClasses[assignment.priority])}>
          {assignment.priority}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground">
          {isOverdue && <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-destructive">Overdue</span>}
          <GripVertical className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-80" />
        </div>
      </div>

      <div className={cn('mt-3 text-sm font-semibold leading-6 text-foreground', isCompleted && 'line-through text-muted-foreground')}>
        {assignment.title}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-2">
          {subjectName && <SubjectBadge initialsClassName="h-6 min-w-6 px-1.5 text-[10px]" name={subjectName} size="sm" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusIcon className={cn('h-3.5 w-3.5', statusIconClasses[assignment.status])} />
          <span>
            {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {dragOverlay && (
        <div className="absolute inset-0 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10" aria-hidden="true" />
      )}
    </>
  );
};

export const KanbanCard = ({
  assignment,
  clickDisabled = false,
  dragOverlay = false,
  onClick,
}: KanbanCardProps) => {
  if (dragOverlay) {
    return (
      <div
        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-4 shadow-sm dark:border-white/10 dark:bg-[#101622]/90"
        data-testid={`kanban-card-${assignment.id}`}
      >
        <KanbanCardContent assignment={assignment} dragOverlay />
      </div>
    );
  }

  return (
    <DraggableKanbanCard
      assignment={assignment}
      clickDisabled={clickDisabled}
      onClick={onClick}
    />
  );
};

interface DraggableKanbanCardProps {
  assignment: Assignment;
  clickDisabled: boolean;
  onClick: () => void;
}

const DraggableKanbanCard = ({
  assignment,
  clickDisabled,
  onClick,
}: DraggableKanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: assignment.id,
    data: {
      status: assignment.status,
      type: 'assignment',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const handleClick = () => {
    if (!clickDisabled && !isDragging) {
      onClick();
    }
  };

  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      layout
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`kanban-card-${assignment.id}`}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-background/95 p-4 text-left shadow-sm transition-all dark:border-white/10 dark:bg-[#101622]/90',
        'touch-none cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        isDragging && 'opacity-30 scale-[0.98]'
      )}
      onClick={handleClick}
    >
      <KanbanCardContent assignment={assignment} />
    </motion.button>
  );
};
