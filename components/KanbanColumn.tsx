import { useDroppable } from '@dnd-kit/core';
import { Assignment, Status } from '../types';
import { KanbanCard } from './KanbanCard';
import { cn } from '../utils/cn';

interface KanbanColumnProps {
  activeSourceStatus: Status | null;
  clickDisabled: boolean;
  id: Status;
  isActiveDropTarget: boolean;
  items: Assignment[];
  onCardClick: (assignment: Assignment) => void;
  showPlaceholder: boolean;
}

const columnTone = {
  [Status.Pending]: {
    badge: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
    dot: 'bg-amber-500',
    target: 'border-amber-500/30 bg-amber-500/[0.06]',
    placeholder: 'border-amber-500/25 bg-amber-500/[0.04] text-amber-600 dark:text-amber-300',
  },
  [Status.InProgress]: {
    badge: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
    dot: 'bg-blue-500',
    target: 'border-blue-500/30 bg-blue-500/[0.06]',
    placeholder: 'border-blue-500/25 bg-blue-500/[0.04] text-blue-600 dark:text-blue-300',
  },
  [Status.Completed]: {
    badge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
    dot: 'bg-emerald-500',
    target: 'border-emerald-500/30 bg-emerald-500/[0.06]',
    placeholder: 'border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-600 dark:text-emerald-300',
  },
} as const;

export const KanbanColumn = ({
  activeSourceStatus,
  clickDisabled,
  id,
  isActiveDropTarget,
  items,
  onCardClick,
  showPlaceholder,
}: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    data: { status: id, type: 'column' },
    id,
  });

  const tone = columnTone[id];

  return (
    <div className="flex h-full min-w-[300px] w-80 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn('h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]', tone.dot)} />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{id}</span>
        </div>
        <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', tone.badge)}>
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`kanban-column-${id}`}
        className={cn(
          'flex-1 rounded-2xl border p-3 overflow-y-auto custom-scrollbar min-h-[180px] transition-all duration-200',
          'bg-muted/20 border-border/60 dark:bg-white/[0.03] dark:border-white/10',
          isActiveDropTarget && tone.target,
          activeSourceStatus === id && !isActiveDropTarget && 'shadow-inner'
        )}
      >
        <div className="space-y-3">
          <div
            aria-hidden="true"
            data-testid={`kanban-dropzone-${id}`}
            className={cn(
              'rounded-xl border border-dashed px-3 py-2 text-[11px] font-medium transition-all',
              isActiveDropTarget
                ? tone.placeholder
                : 'border-border/50 bg-transparent text-muted-foreground/60 dark:border-white/10'
            )}
          >
            Drop here
          </div>

          {items.map((assignment) => (
            <KanbanCard
              key={assignment.id}
              assignment={assignment}
              clickDisabled={clickDisabled}
              onClick={() => onCardClick(assignment)}
            />
          ))}

          {showPlaceholder && (
            <div className={cn(
              'rounded-2xl border border-dashed px-4 py-5 text-sm font-medium',
              tone.placeholder
            )}>
              Drop to move this task to {id.toLowerCase()}.
            </div>
          )}

          {items.length === 0 && !showPlaceholder && (
            <div className="flex min-h-[132px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/60 px-6 text-center text-sm text-muted-foreground dark:border-white/10 dark:bg-[#101622]/50">
              Drop a task here to update its status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
