import { Status, Subject } from '../../types';
import { AssignmentFormState } from './types';

interface AssignmentBasicsFieldsProps {
  disableScheduleFields?: boolean;
  disableSharedStatus?: boolean;
  formData: AssignmentFormState;
  lockedSubjectLabel?: string | null;
  onChange: (updates: Partial<AssignmentFormState>) => void;
  onOpenSubjectForm?: () => void;
  subjects: Subject[];
}

export const AssignmentBasicsFields = ({
  disableScheduleFields = false,
  disableSharedStatus = false,
  formData,
  lockedSubjectLabel = null,
  onChange,
  onOpenSubjectForm,
  subjects,
}: AssignmentBasicsFieldsProps) => {
  const subjectSelectId = 'assignment-subject-select';

  return (
    <>
      <label className="block">
        <span className="text-sm font-medium text-foreground/80">Assignment Title</span>
        <input
          data-testid="assignment-title-input"
          type="text"
          required
          disabled={disableScheduleFields}
          placeholder="e.g., History Essay - Chapter 5 Analysis"
          className="mt-1 block w-full rounded-lg border-border/60 bg-background/80 dark:bg-slate-800/50 text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 transition-all"
          value={formData.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="block">
          <label className="text-sm font-medium text-foreground/80" htmlFor={subjectSelectId}>
            Subject
          </label>
          <div className="mt-1 flex gap-2">
            {lockedSubjectLabel ? (
              <div className="flex h-12 flex-1 items-center rounded-lg border border-border/60 bg-muted/20 px-4 text-sm font-medium text-foreground">
                {lockedSubjectLabel}
              </div>
            ) : (
              <select
                id={subjectSelectId}
                data-testid="assignment-subject-select"
                required
                disabled={disableScheduleFields}
                className="flex-1 rounded-lg border-border/60 bg-background/80 dark:bg-slate-900 text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 transition-all disabled:cursor-not-allowed disabled:opacity-70"
                value={formData.subjectId}
                onChange={(event) => onChange({ subjectId: event.target.value })}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            )}

            {onOpenSubjectForm && !lockedSubjectLabel && (
              <button
                type="button"
                disabled={disableScheduleFields}
                onClick={onOpenSubjectForm}
                aria-label="Add new subject"
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                title="Add new subject"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground/80">Status</span>
          <select
            data-testid="assignment-status-select"
            disabled={disableSharedStatus}
            className="mt-1 block w-full rounded-lg border-border/60 bg-background/80 dark:bg-slate-900 text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 transition-all"
            value={formData.status}
            onChange={(event) => onChange({ status: event.target.value as Status })}
          >
            <option value={Status.Pending}>Not Started</option>
            <option value={Status.InProgress}>In Progress</option>
            <option value={Status.Completed}>Completed</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-foreground/80">Due Date</span>
          <input
            data-testid="assignment-date-input"
            type="date"
            required
            disabled={disableScheduleFields}
            className="mt-1 block w-full rounded-lg border-border/60 bg-background/80 dark:bg-slate-800/50 text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 transition-all"
            value={formData.date}
            onChange={(event) => onChange({ date: event.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground/80">Due Time</span>
          <input
            data-testid="assignment-time-input"
            type="time"
            disabled={disableScheduleFields}
            className="mt-1 block w-full rounded-lg border-border/60 bg-background/80 dark:bg-slate-800/50 text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 px-4 transition-all"
            value={formData.time}
            onChange={(event) => onChange({ time: event.target.value })}
          />
        </label>
      </div>
    </>
  );
};
