export interface InlineKeyboardButton {
    text: string;
    callback_data: string;
}

export interface InlineKeyboardMarkup {
    inline_keyboard: InlineKeyboardButton[][];
}

export interface AssignmentDoc {
    id: string;
    title: string;
    subjectId: string;
    dueDate: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    description?: string;
    createdAt: string;
    reminder?: {
        enabled: boolean;
        preset: string;
        customMinutes?: number;
        customTime?: string;
        sentAt?: string;
    };
}

export interface SubjectDoc {
    id: string;
    name: string;
    color: string;
    createdAt: string;
    lastUpdated: string;
}

export interface UserDoc {
    uid: string;
    name: string;
    email: string;
    telegramLinked: boolean;
    dailyReminder?: {
        enabled: boolean;
        sendTime: string;
        timezone: string;
        skipWeekends: boolean;
        lastSentDate?: string;
    };
    weeklyDigest?: {
        enabled: boolean;
        dayOfWeek: number;
        sendTime: string;
        timezone: string;
        lastSentWeek?: string;
    };
}

export interface TelegramLinkDoc {
    chatId: string;
    telegramUserId?: string;
    linkedAt: FirebaseFirestore.Timestamp;
}

export interface AssignmentWithDate extends Omit<AssignmentDoc, 'dueDate'> {
    dueDate: Date;
}

export const ASSIGNMENT_STATUS = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
} as const;

export const ASSIGNMENT_PRIORITY = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
} as const;

export type AssignmentStatus = typeof ASSIGNMENT_STATUS[keyof typeof ASSIGNMENT_STATUS];
export type AssignmentPriority = typeof ASSIGNMENT_PRIORITY[keyof typeof ASSIGNMENT_PRIORITY];
