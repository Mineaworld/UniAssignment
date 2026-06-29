import { describe, expect, it } from 'vitest';
import { Assignment, Priority, Status, Subject } from '../../../types';
import { getAssignmentSubject } from '../../../utils/assignmentSubject';

const createAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  createdAt: '2026-03-16T10:00:00.000Z',
  dueDate: '2026-03-20T10:00:00.000Z',
  id: 'assignment-1',
  priority: Priority.Medium,
  status: Status.Pending,
  subjectId: 'subject-1',
  title: 'Database report',
  ...overrides,
});

const createSubject = (overrides: Partial<Subject> = {}): Subject => ({
  color: 'bg-blue-500',
  createdAt: '2026-03-10T10:00:00.000Z',
  id: 'subject-1',
  lastUpdated: '2026-03-12T10:00:00.000Z',
  name: 'Database Systems',
  ...overrides,
});

describe('getAssignmentSubject', () => {
  it('prefers the matching subject from the subject list', () => {
    const subject = createSubject();
    const assignment = createAssignment({
      subjectSnapshot: { color: 'bg-red-500', name: 'Old Snapshot' },
    });

    expect(getAssignmentSubject(assignment, [subject])).toEqual({
      color: subject.color,
      name: subject.name,
    });
  });

  it('falls back to the stored snapshot when no subject exists locally', () => {
    const assignment = createAssignment({
      subjectId: '',
      subjectSnapshot: { color: 'bg-violet-500', name: 'Shared Lab' },
    });

    expect(getAssignmentSubject(assignment, [])).toEqual({
      color: 'bg-violet-500',
      name: 'Shared Lab',
    });
  });
});
