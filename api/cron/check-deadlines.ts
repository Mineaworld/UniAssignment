import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps || admin.apps.length === 0) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    privateKey = privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        } as admin.ServiceAccount),
    });
}

const db = admin.firestore();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// --- CONSTANTS ---
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

const PRESET_TO_MINUTES: Record<string, number> = {
    '1h': 60,
    '6h': 360,
    '1d': 1440,
    '3d': 4320,
    '1w': 10080,
};

// --- TYPES ---
interface Reminder {
    enabled: boolean;
    preset: string;
    customMinutes?: number;
    customTime?: string;
    sentAt?: string;
}

interface Assignment {
    title: string;
    dueDate: string;
    status: string;
    reminder?: Reminder;
}

// --- HELPER: Send Telegram Message ---
async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
            }),
        });
    } catch (e) {
        console.error('Failed to send telegram message', e);
    }
}

// --- HELPER: Calculate Reminder Time ---
function calculateReminderTime(dueDate: string, reminder: Reminder): Date | null {
    const due = new Date(dueDate);
    const preset = reminder.preset;

    if (preset !== 'custom' && PRESET_TO_MINUTES[preset]) {
        return new Date(due.getTime() - PRESET_TO_MINUTES[preset] * MS_PER_MINUTE);
    }

    if (reminder.customTime) {
        return new Date(reminder.customTime);
    }

    if (reminder.customMinutes) {
        return new Date(due.getTime() - reminder.customMinutes * MS_PER_MINUTE);
    }

    return null;
}

// --- HELPER: Format time before due ---
function formatTimeBeforeDue(hours: number): string {
    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.round(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
}

// --- HELPER: Send Reminder Notification ---
async function sendReminderNotification(chatId: string, assignment: Assignment): Promise<void> {
    const { dueDate, title, reminder } = assignment;
    if (!reminder) return;

    const reminderTime = calculateReminderTime(dueDate, reminder);
    if (!reminderTime) return;

    const timeDiff = new Date(dueDate).getTime() - reminderTime.getTime();
    const hoursBefore = timeDiff / MS_PER_HOUR;
    const timeText = formatTimeBeforeDue(hoursBefore);

    const dueDateTime = new Date(dueDate);
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Bangkok',
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Bangkok',
    });

    const message =
        `🔔 <b>Reminder!</b>\n\n` +
        `<b>${title}</b> is due in ${timeText}.\n` +
        `📅 Due: ${dateFormatter.format(dueDateTime)} at ${timeFormatter.format(dueDateTime)}`;

    await sendTelegramMessage(chatId, message);
}

// --- MAIN HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Note: Security check removed for testing with external cron service
    // TODO: Add CRON_SECRET verification for production

    console.log('Checking for reminders...');

    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000); // 15 min ago
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 min ahead

    let remindersSent = 0;
    let usersChecked = 0;

    try {
        // Get all users with linked Telegram
        const linksSnapshot = await db.collection('telegramLinks').get();

        for (const linkDoc of linksSnapshot.docs) {
            const userUid = linkDoc.id;
            const chatId = linkDoc.data().chatId;
            usersChecked++;

            // Get assignments with enabled reminders
            const assignmentsSnapshot = await db
                .collection(`users/${userUid}/assignments`)
                .where('reminder.enabled', '==', true)
                .get();

            for (const doc of assignmentsSnapshot.docs) {
                const assignment = doc.data() as Assignment;

                // Skip completed assignments
                if (assignment.status === 'Completed') continue;

                // Skip if already sent
                if (assignment.reminder?.sentAt) continue;

                // Calculate reminder time
                const reminderTime = calculateReminderTime(
                    assignment.dueDate,
                    assignment.reminder!
                );
                if (!reminderTime) continue;

                // Check if reminder time is within execution window
                if (reminderTime >= windowStart && reminderTime <= windowEnd) {
                    await sendReminderNotification(chatId, assignment);

                    // Mark as sent
                    await doc.ref.update({
                        'reminder.sentAt': now.toISOString(),
                    });

                    remindersSent++;
                    console.log(`Sent reminder for "${assignment.title}" to chat ${chatId}`);
                }
            }
        }

        console.log(`Reminder check complete. Sent ${remindersSent} reminders to ${usersChecked} users.`);

        return res.status(200).json({
            success: true,
            remindersSent,
            usersChecked,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('Error checking reminders:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
