import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/lib/firebaseAdmin.js';
import { listUserAssignmentRecords } from '../../server/sharedAssignments.js';
import { sendTelegramMessage } from '../../server/lib/telegram.js';
import type { AssignmentWithDate } from '../../server/telegram/types.js';
import { ASSIGNMENT_STATUS } from '../../server/telegram/types.js';

const CRON_SECRET = process.env.CRON_SECRET || '';

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

        // TODO: For better scalability, add a 'dailyReminder.sendHourUTC' field to user docs
        // and query only users due for notification at the current UTC hour.
        // Current approach fetches all users which won't scale well beyond ~1000 users.
        const usersSnapshot = await db.collection('users').get();
        let sentCount = 0;
        let skippedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            try {
                const userData = userDoc.data();
                const dailyReminder = userData.dailyReminder;

                if (!dailyReminder?.enabled) {
                    continue;
                }

                const userId = userDoc.id;
                const timezone = dailyReminder.timezone || 'Asia/Phnom_Penh';
                const sendTime = dailyReminder.sendTime || '08:00';
                const skipWeekends = dailyReminder.skipWeekends || false;

                const { hour, minute, dayOfWeek, dateStr } = getCurrentTimeInTimezone(timezone);
                const [configHour, configMinute] = sendTime.split(':').map(Number);

                const currentMinutes = hour * 60 + minute;
                const configMinutes = configHour * 60 + configMinute;
                const diff = Math.abs(currentMinutes - configMinutes);

                if (diff > 30) {
                    continue;
                }

                if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                    continue;
                }

                if (dailyReminder.lastSentDate === dateStr) {
                    skippedCount++;
                    continue;
                }

                const telegramLink = await db.collection('telegramLinks').doc(userId).get();
                if (!telegramLink.exists) {
                    continue;
                }
                const chatId = telegramLink.data()?.chatId;
                if (!chatId) {
                    continue;
                }

                const now = new Date();
                const todayBounds = getDayBoundsInTimezone(now, timezone, 0);
                const tomorrowBounds = getDayBoundsInTimezone(now, timezone, 1);

                const assignments = await listUserAssignmentRecords(db, userId);

                const todayAssignments: AssignmentWithDate[] = [];
                const tomorrowAssignments: AssignmentWithDate[] = [];

                for (const data of assignments) {
                    if (data.status === ASSIGNMENT_STATUS.COMPLETED) continue;

                    const dueDate = new Date(data.dueDate);

                    if (dueDate >= todayBounds.start && dueDate <= todayBounds.end) {
                        todayAssignments.push({ ...data, dueDate } as AssignmentWithDate);
                    } else if (dueDate >= tomorrowBounds.start && dueDate <= tomorrowBounds.end) {
                        tomorrowAssignments.push({ ...data, dueDate } as AssignmentWithDate);
                    }
                }

                if (todayAssignments.length === 0 && tomorrowAssignments.length === 0) {
                    await db.collection('users').doc(userId).update({
                        'dailyReminder.lastSentDate': dateStr
                    });
                    continue;
                }

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

                await sendTelegramMessage(chatId, message);

                await db.collection('users').doc(userId).update({
                    'dailyReminder.lastSentDate': dateStr
                });

                sentCount++;
                console.log(`[DailyReminder] Sent to user ${userId}`);

            } catch (userError) {
                console.error(`[DailyReminder] Error processing user ${userDoc.id}:`, userError);
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
