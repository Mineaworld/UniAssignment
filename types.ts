
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

export type ShareTarget = 'subject' | 'assignment';
export type SharedRole = 'owner' | 'editor' | 'viewer';

export interface SubjectSnapshot {
  name: string;
  color: string;
}

export interface SharedMember {
  uid: string;
  name: string;
  email: string;
  role: SharedRole;
  joinedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class like 'bg-blue-500'
  createdAt: string;
  lastUpdated: string;
  kind?: 'personal' | 'shared';
  isShared?: boolean;
  sharedSpaceId?: string;
  sharedRole?: SharedRole;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreateAssignments?: boolean;
  canManageShare?: boolean;
  activeInviteId?: string | null;
  inviteDefaultRole?: SharedRole;
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
  kind?: 'personal' | 'shared';
  isShared?: boolean;
  sharedSpaceId?: string;
  sharedAssignmentId?: string;
  sharedTargetType?: ShareTarget;
  sharedRole?: SharedRole;
  canEditSharedFields?: boolean;
  canEditPersonalFields?: boolean;
  canDelete?: boolean;
  canManageShare?: boolean;
  canChangeSubject?: boolean;
  subjectSnapshot?: SubjectSnapshot | null;
  activeInviteId?: string | null;
  inviteDefaultRole?: SharedRole;
}

export interface ShareLinkResult {
  inviteId: string;
  spaceId: string;
  url: string;
}

export interface JoinedSharedSpaceResult {
  spaceId: string;
  targetType: ShareTarget;
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

// Pomodoro timer types
export type PomodoroSessionType = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: string;
  assignmentId: string | null;
  assignmentTitle?: string;
  type: PomodoroSessionType;
  duration: number;          // Duration in minutes
  completedAt: string;       // ISO string
}

export interface PomodoroStats {
  totalSessions: number;
  totalMinutes: number;
  todaySessions: number;
  todayMinutes: number;
  lastSessionDate?: string;  // ISO date string (YYYY-MM-DD)
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
  // Pomodoro stats
  pomodoroStats?: PomodoroStats;
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
  shareSubject: (subjectId: string, defaultRole: SharedRole) => Promise<ShareLinkResult>;
  shareAssignment: (assignmentId: string, defaultRole: SharedRole) => Promise<ShareLinkResult>;
  joinSharedSpace: (inviteId: string) => Promise<JoinedSharedSpaceResult>;
  updateSharedMemberRole: (spaceId: string, memberUid: string, role: SharedRole) => Promise<void>;
  removeSharedMember: (spaceId: string, memberUid: string) => Promise<void>;
  setSharedInviteState: (spaceId: string, enabled: boolean, defaultRole?: SharedRole) => Promise<ShareLinkResult | null>;
  getSharedMembers: (spaceId: string) => SharedMember[];
  updateUserProfile: (updates: Partial<User>, avatarFile?: File) => Promise<void>;
  dismissTelegramPrompt: (permanent: boolean) => Promise<void>;
  uploadNoteImage: (assignmentId: string, file: File) => Promise<string>;
  recordPomodoroSession: (
    type: PomodoroSessionType,
    assignmentId: string | null,
    duration: number,
    assignmentTitle?: string
  ) => Promise<void>;
}
