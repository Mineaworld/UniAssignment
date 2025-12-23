import { Assignment, Priority, Status, Subject, User } from './types';

export const INITIAL_USER: User = {
  uid: "",
  name: "Maria Sanchez",
  email: "maria.sanchez@university.edu",
  major: "Computer Science",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBpUAuwCOt2a1assmnFOlaNPJy3Qybg7BtICbD7kOAlLnmF5WSt26xBNMRZ--QKlB7C2-6lINdxetI-YI5Hk5s0dS5ppbWsSF6l5FQCPqd2sX6tnXihIaY8OzsANdBTeGBfu4L4GR5mmQhOBAL0WDXcNX0lf6wHRuZI5YIpbR4w9R7PKF0cKgDRDwEKyfIiIhPZXMyJjNly_iSTsb06U5NyUBPCzOwHDa_V7bbzIu0v_h8zZ-aiTkHSVD9mI7DlD2KH7jNuukFpYbY",
  telegramLinked: false,
  telegramLinkedAt: null,
  telegramPromptLastShown: null,
  telegramPromptDismissed: false,
};

export const INITIAL_SUBJECTS: Subject[] = [
  { id: '1', name: 'Advanced Algorithms', color: 'bg-yellow-400', lastUpdated: '2 days ago' },
  { id: '2', name: 'Quantum Physics', color: 'bg-orange-400', lastUpdated: '5 days ago' },
  { id: '3', name: 'History of Art', color: 'bg-green-400', lastUpdated: '1 week ago' },
  { id: '4', name: 'Database Systems', color: 'bg-blue-500', lastUpdated: '1 month ago' },
  { id: '5', name: 'English Lit 101', color: 'bg-purple-500', lastUpdated: '2 days ago' },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: '1',
    title: 'Final Project Proposal',
    subjectId: '1',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: Status.Pending,
    priority: Priority.High,
    createdAt: new Date().toISOString(),
    description: 'Submit the initial proposal including scope and timeline.',
  },
  {
    id: '2',
    title: 'Lab Report 4',
    subjectId: '2',
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: Status.InProgress,
    priority: Priority.Medium,
    createdAt: new Date().toISOString(),
    description: 'Quantum entanglement experiment results.',
  },
  {
    id: '3',
    title: 'Essay on Renaissance Art',
    subjectId: '3',
    dueDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    status: Status.Completed,
    priority: Priority.Medium,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    title: 'Database Schema Design',
    subjectId: '4',
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: Status.Pending,
    priority: Priority.Low,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '5',
    title: 'Hamlet Analysis',
    subjectId: '5',
    dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: Status.Completed,
    priority: Priority.High,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];
