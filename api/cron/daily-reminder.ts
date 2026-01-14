import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

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
const CRON_SECRET = process.env.CRON_SECRET || '';

const ASSIGNMENT_STATUS = {
    COMPLETED: 'Completed',
} as const;

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error("Failed to send telegram message", e);
    }
}

function getCurrentTimeInTimezone(timezone: string): { hour: number; minute: number; dayOfWeek: number; dateStr: string } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        weekday: 'short'
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';

    const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const dayOfWeek = dayMap[weekday] ?? 0;

    const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const dateStr = dateFormatter.format(now);

    return { hour, minute, dayOfWeek, dateStr };
}

function getDayBoundsInTimezone(date: Date, timezone: string, offsetDays: number = 0): { start: Date; end: Date } {
    const targetDate = new Date(date);
    targetDate.setDate(targetDate.getDate() + offsetDays);

    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const dateStr = dateFormatter.format(targetDate);

    const start = new Date(`${dateStr}T00:00:00`);
    const end = new Date(`${dateStr}T23:59:59`);

    return { start, end };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const authHeader = req.headers.authorization;
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('[DailyReminder] Starting cron job...');

        // Get all users with daily reminder enabled
        const usersSnapshot = await db.collection('users').get();
        let sentCount = 0;
        let skippedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            try {
                const userData = userDoc.data();
                const dailyReminder = userData.dailyReminder;

                // Skip if not enabled
                if (!dailyReminder?.enabled) {
                    continue;
                }

                const userId = userDoc.id;
                const timezone = dailyReminder.timezone || 'Asia/Phnom_Penh';
                const sendTime = dailyReminder.sendTime || '08:00';
                const skipWeekends = dailyReminder.skipWeekends || false;

                // Get current time in user's timezone
                const { hour, minute, dayOfWeek, dateStr } = getCurrentTimeInTimezone(timezone);

                // Parse configured send time
                const [configHour, configMinute] = sendTime.split(':').map(Number);

                // Check if it's time to send (within 30-minute window)
                const currentMinutes = hour * 60 + minute;
                const configMinutes = configHour * 60 + configMinute;
                const diff = Math.abs(currentMinutes - configMinutes);

                if (diff > 30) {
                    continue; // Not within send window
                }

                // Check if weekend and should skip
                if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                    continue;
                }

                // Check idempotency - don't send twice on same day
                if (dailyReminder.lastSentDate === dateStr) {
                    skippedCount++;
                    continue;
                }

                // Get user's Telegram chat ID
                const telegramLink = await db.collection('telegramLinks').doc(userId).get();
                if (!telegramLink.exists) {
                    continue;
                }
                const chatId = telegramLink.data()?.chatId;
                if (!chatId) {
                    continue;
                }

                // Get today's and tomorrow's assignments
                const now = new Date();
                const todayBounds = getDayBoundsInTimezone(now, timezone, 0);
                const tomorrowBounds = getDayBoundsInTimezone(now, timezone, 1);

                const assignmentsSnapshot = await db
                    .collection(`users/${userId}/assignments`)
                    .orderBy('dueDate', 'asc')
                    .get();

                const todayAssignments: any[] = [];
                const tomorrowAssignments: any[] = [];

                for (const doc of assignmentsSnapshot.docs) {
                    const data = doc.data();
                    if (data.status === ASSIGNMENT_STATUS.COMPLETED) continue;

                    const dueDate = new Date(data.dueDate);

                    if (dueDate >= todayBounds.start && dueDate <= todayBounds.end) {
                        todayAssignments.push({ ...data, id: doc.id, dueDate });
                    } else if (dueDate >= tomorrowBounds.start && dueDate <= tomorrowBounds.end) {
                        tomorrowAssignments.push({ ...data, id: doc.id, dueDate });
                    }
                }

                // Skip if nothing due
                if (todayAssignments.length === 0 && tomorrowAssignments.length === 0) {
                    // Update lastSentDate anyway to prevent repeated checks
                    await db.collection('users').doc(userId).update({
                        'dailyReminder.lastSentDate': dateStr
                    });
                    continue;
                }

                // Build message
                let message = "☀️ <b>Good morning!</b>\n\n";

                if (todayAssignments.length > 0) {
                    message += `📌 <b>Due Today</b> (${todayAssignments.length})\n`;
                    for (const a of todayAssignments) {
                        const timeStr = a.dueDate.toLocaleTimeString('en-US', {
                            timeZone: timezone,
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });
                        message += `• ${a.title} - ${timeStr}\n`;
                    }
                    message += "\n";
                }

                if (tomorrowAssignments.length > 0) {
                    message += `📅 <b>Due Tomorrow</b> (${tomorrowAssignments.length})\n`;
                    for (const a of tomorrowAssignments) {
                        const timeStr = a.dueDate.toLocaleTimeString('en-US', {
                            timeZone: timezone,
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });
                        message += `• ${a.title} - ${timeStr}\n`;
                    }
                    message += "\n";
                }

                message += "Have a productive day! 🚀";

                // Send message
                await sendTelegramMessage(chatId, message);

                // Update lastSentDate for idempotency
                await db.collection('users').doc(userId).update({
                    'dailyReminder.lastSentDate': dateStr
                });

                sentCount++;
                console.log(`[DailyReminder] Sent to user ${userId}`);

            } catch (userError) {
                console.error(`[DailyReminder] Error processing user ${userDoc.id}:`, userError);
                // Continue to next user
            }
        }

        console.log(`[DailyReminder] Completed. Sent: ${sentCount}, Skipped: ${skippedCount}`);
        return res.status(200).json({
            success: true,
            sent: sentCount,
            skipped: skippedCount
        });

    } catch (error) {
        console.error('[DailyReminder] Cron job error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
