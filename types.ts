
import type { Block } from '@blocknote/core';

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

/** Rich text notes content using BlockNote format */
export interface NotesContent {
  version: 1;
  blocks: Block[];
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string; // ISO string
  status: Status;
  priority: Priority;
  /** @deprecated Use notes instead */
  description?: string;
  notes?: NotesContent;
  examType?: 'midterm' | 'final' | null;
  createdAt: string;
  reminder?: AssignmentReminder;
}

// Daily reminder settings for Telegram notifications
export interface DailyReminderSettings {
  enabled: boolean;
  sendTime: string;       // "08:00" format
  timezone: string;       // e.g., "Asia/Phnom_Penh"
  skipWeekends: boolean;
  lastSentDate?: string;  // Idempotency key: "2026-01-14"
}

// Weekly digest settings for Telegram notifications
export interface WeeklyDigestSettings {
  enabled: boolean;
  dayOfWeek: number;      // 0=Sunday, 1=Monday, ..., 6=Saturday
  sendTime: string;       // "18:00" format
  timezone: string;       // e.g., "Asia/Phnom_Penh"
  lastSentWeek?: string;  // ISO week: "2026-W02"
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
  // Scheduled notification settings
  dailyReminder?: DailyReminderSettings;
  weeklyDigest?: WeeklyDigestSettings;
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
  uploadNoteImage: (assignmentId: string, file: File) => Promise<string>;
}
