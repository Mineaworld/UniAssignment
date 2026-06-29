import { Assignment, Subject, SubjectSnapshot } from '../types';

export const getAssignmentSubject = (
  assignment: Pick<Assignment, 'subjectId' | 'subjectSnapshot'>,
  subjects: Subject[]
): SubjectSnapshot | null => {
  const subject = subjects.find((item) => item.id === assignment.subjectId);

  if (subject) {
    return {
      color: subject.color,
      name: subject.name,
    };
  }

  return assignment.subjectSnapshot ?? null;
};
