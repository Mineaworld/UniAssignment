
export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum Status {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class like 'bg-blue-500'
  lastUpdated: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string; // ISO string
  status: Status;
  priority: Priority;
  description?: string;
  createdAt: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  major: string;
  telegramLinked: boolean;
  telegramLinkedAt: string | null;
}

export interface AppContextType {
  user: User | null;
  loading: boolean;
  assignments: Assignment[];
  subjects: Subject[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id' | 'lastUpdated'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
}
