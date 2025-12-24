
export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum ReminderPreset {
  OneHour = '1h',
  SixHours = '6h',
  OneDay = '1d',
  ThreeDays = '3d',
  OneWeek = '1w',
  Custom = 'custom',
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
  createdAt: string;
  lastUpdated: string;
}

export interface AssignmentReminder {
  enabled: boolean;
  preset: ReminderPreset;
  customMinutes?: number;  // For custom relative time (minutes before due)
  customTime?: string;      // For absolute specific time (ISO string)
  sentAt?: string;          // When reminder was sent
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string; // ISO string
  status: Status;
  priority: Priority;
  description?: string;
  examType?: 'midterm' | 'final' | null;
  createdAt: string;
  reminder?: AssignmentReminder;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  major: string;
  telegramLinked: boolean;
  telegramLinkedAt: string | null;
  // Telegram prompt tracking
  telegramPromptLastShown: string | null;
  telegramPromptDismissed: boolean;
}

export interface AppContextType {
  user: User | null;
  loading: boolean;
  assignments: Assignment[];
  subjects: Subject[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, major?: string, avatarFile?: File) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>, avatarFile?: File) => Promise<void>;
  dismissTelegramPrompt: (permanent: boolean) => Promise<void>;
}
