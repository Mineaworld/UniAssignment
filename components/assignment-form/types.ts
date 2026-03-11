import { Assignment, AssignmentReminder, NotesContent, Priority, Status } from '../../types';
import { formatDateInputValue, formatTimeInputValue } from '../../utils/dateUtils';
import { getNotesContent } from '../../utils/migrateNotes';

export interface AssignmentFormState {
  title: string;
  subjectId: string;
  status: Status;
  date: string;
  time: string;
  priority: Priority;
  notes: NotesContent | undefined;
  examType: 'midterm' | 'final' | null;
  reminder: AssignmentReminder | undefined;
}

export const DEFAULT_ASSIGNMENT_FORM_STATE: AssignmentFormState = {
  title: '',
  subjectId: '',
  status: Status.Pending,
  date: '',
  time: '',
  priority: Priority.Medium,
  notes: undefined,
  examType: null,
  reminder: undefined,
};

export const createEmptyAssignmentFormState = (): AssignmentFormState => ({
  ...DEFAULT_ASSIGNMENT_FORM_STATE,
});

export const assignmentToFormState = (assignment: Assignment): AssignmentFormState => {
  const dueDate = new Date(assignment.dueDate);

  return {
    title: assignment.title,
    subjectId: assignment.subjectId,
    status: assignment.status,
    date: formatDateInputValue(dueDate),
    time: formatTimeInputValue(dueDate),
    priority: assignment.priority,
    notes: getNotesContent(assignment.notes, assignment.description),
    examType: assignment.examType ?? null,
    reminder: assignment.reminder,
  };
};
