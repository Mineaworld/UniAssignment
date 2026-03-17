import { Priority } from '../../types';
import { AssignmentFormState } from './types';

interface AssignmentClassificationFieldsProps {
  disabled?: boolean;
  formData: AssignmentFormState;
  onChange: (updates: Partial<AssignmentFormState>) => void;
  tone?: 'default' | 'muted';
}

const mutedTone = {
  active: {
    exam: 'border-gray-500 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-gray-500',
    priority: 'border-primary bg-primary/10 text-primary ring-1 ring-primary',
  },
  inactive: 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400',
};

const defaultTone = {
  active: {
    exam: 'border-border bg-muted text-foreground ring-1 ring-primary',
    priority: 'border-primary bg-primary/10 text-primary ring-1 ring-primary',
  },
  inactive: 'border-border/60 hover:bg-muted/50 text-muted-foreground',
};

const focusRingClasses = 'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background';

export const AssignmentClassificationFields = ({
  disabled = false,
  formData,
  onChange,
  tone = 'default',
}: AssignmentClassificationFieldsProps) => {
  const palette = tone === 'muted' ? mutedTone : defaultTone;

  return (
    <>
      <div>
        <span className="text-sm font-medium text-foreground/80">Assignment Type</span>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <label
            className={`relative flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${focusRingClasses} ${!formData.examType ? palette.active.exam : palette.inactive}`}
          >
            <input
              type="radio"
              name="examType"
              value=""
              disabled={disabled}
              checked={!formData.examType}
              onChange={() => onChange({ examType: null })}
              className="sr-only"
            />
            <span className="font-medium">Regular</span>
          </label>

          <label
            className={`relative flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${focusRingClasses} ${
              formData.examType === 'midterm'
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                : palette.inactive
            }`}
          >
            <input
              type="radio"
              name="examType"
              value="midterm"
              disabled={disabled}
              checked={formData.examType === 'midterm'}
              onChange={() => onChange({ examType: 'midterm' })}
              className="sr-only"
            />
            <span className="font-medium">Midterm</span>
          </label>

          <label
            className={`relative flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${focusRingClasses} ${
              formData.examType === 'final'
                ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500'
                : palette.inactive
            }`}
          >
            <input
              type="radio"
              name="examType"
              value="final"
              disabled={disabled}
              checked={formData.examType === 'final'}
              onChange={() => onChange({ examType: 'final' })}
              className="sr-only"
            />
            <span className="font-medium">Final</span>
          </label>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-foreground/80">Priority</span>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {[Priority.Low, Priority.Medium, Priority.High].map((priority) => (
            <label
              key={priority}
              className={`relative flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${focusRingClasses} ${
                formData.priority === priority ? palette.active.priority : palette.inactive
              }`}
            >
              <input
                type="radio"
                name="priority"
                value={priority}
                disabled={disabled}
                checked={formData.priority === priority}
                onChange={() => onChange({ priority })}
                className="sr-only"
              />
              <span className="font-medium">{priority}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
};
