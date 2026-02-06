import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/lib/firebaseAdmin.js';
import { sendTelegramMessage } from '../../server/lib/telegram.js';
import type { AssignmentWithDate } from '../../server/telegram/types.js';
import { ASSIGNMENT_STATUS } from '../../server/telegram/types.js';

const CRON_SECRET = process.env.CRON_SECRET || '';

function getCurrentTimeInTimezone(timezone: string): { hour: number; minute: number; dayOfWeek: number; isoWeek: string } {
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

    const isoWeek = getISOWeek(now, timezone);

    return { hour, minute, dayOfWeek, isoWeek };
}

function getISOWeek(date: Date, timezone: string): string {
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const dateStr = dateFormatter.format(date);
    const localDate = new Date(dateStr);

    const target = new Date(localDate.valueOf());
    const dayNr = (localDate.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const year = localDate.getFullYear();

    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

function getWeekDateRange(timezone: string): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        month: 'short',
        day: 'numeric'
    });

    const weekStart = new Date(now);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return `${formatter.format(weekStart)}-${formatter.format(weekEnd)}`;
}

function formatDayOfWeek(date: Date, timezone: string): string {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long'
    }).format(date);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const authHeader = req.headers.authorization;
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('[WeeklyDigest] Starting cron job...');

        // TODO: For better scalability, add queryable fields for day/hour
        // and query only users due for notification at the current time.
        const usersSnapshot = await db.collection('users').get();
        let sentCount = 0;
        let skippedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            try {
                const userData = userDoc.data();
                const weeklyDigest = userData.weeklyDigest;

                if (!weeklyDigest?.enabled) {
                    continue;
                }

                const userId = userDoc.id;
                const timezone = weeklyDigest.timezone || 'Asia/Phnom_Penh';
                const sendTime = weeklyDigest.sendTime || '18:00';
                const configDayOfWeek = weeklyDigest.dayOfWeek ?? 0;

                const { hour, minute, dayOfWeek, isoWeek } = getCurrentTimeInTimezone(timezone);

                if (dayOfWeek !== configDayOfWeek) {
                    continue;
                }

                const [configHour, configMinute] = sendTime.split(':').map(Number);

                const currentMinutes = hour * 60 + minute;
                const configMinutes = configHour * 60 + configMinute;
                const diff = Math.abs(currentMinutes - configMinutes);

                if (diff > 30) {
                    continue;
                }

                if (weeklyDigest.lastSentWeek === isoWeek) {
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
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() + 7);

                const assignmentsSnapshot = await db
                    .collection(`users/${userId}/assignments`)
                    .orderBy('dueDate', 'asc')
                    .get();

                const upcomingAssignments: AssignmentWithDate[] = [];
                const highPriorityAssignments: AssignmentWithDate[] = [];
                let lastWeekCompleted = 0;
                let lastWeekTotal = 0;

                const lastWeekStart = new Date(now);
                lastWeekStart.setDate(lastWeekStart.getDate() - 7);

                for (const doc of assignmentsSnapshot.docs) {
                    const data = doc.data();
                    const dueDate = new Date(data.dueDate);

                    if (dueDate >= lastWeekStart && dueDate < now) {
                        lastWeekTotal++;
                        if (data.status === ASSIGNMENT_STATUS.COMPLETED) {
                            lastWeekCompleted++;
                        }
                    }

                    if (data.status === ASSIGNMENT_STATUS.COMPLETED) continue;

                    if (dueDate >= now && dueDate <= weekEnd) {
                        const assignment = { ...data, id: doc.id, dueDate } as AssignmentWithDate;
                        upcomingAssignments.push(assignment);

                        if (data.priority === 'High') {
                            highPriorityAssignments.push(assignment);
                        }
                    }
                }

                const weekRange = getWeekDateRange(timezone);
                let message = `📊 <b>Week Ahead: ${weekRange}</b>\n\n`;

                if (upcomingAssignments.length === 0) {
                    message += "You have no assignments due this week! 🎉\n\n";
                } else {
                    message += `You have <b>${upcomingAssignments.length}</b> assignment${upcomingAssignments.length !== 1 ? 's' : ''} due this week.\n\n`;

                    if (highPriorityAssignments.length > 0) {
                        message += `🔴 <b>High Priority</b> (${highPriorityAssignments.length})\n`;
                        for (const a of highPriorityAssignments) {
                            const dayStr = formatDayOfWeek(a.dueDate, timezone);
                            message += `• ${a.title} - ${dayStr}\n`;
                        }
                        message += "\n";
                    }

                    const otherAssignments = upcomingAssignments.filter(a => a.priority !== 'High');
                    if (otherAssignments.length > 0) {
                        message += `📅 <b>Upcoming</b>\n`;
                        for (const a of otherAssignments.slice(0, 5)) {
                            const dayStr = formatDayOfWeek(a.dueDate, timezone);
                            message += `• ${a.title} - ${dayStr}\n`;
                        }
                        if (otherAssignments.length > 5) {
                            message += `... and ${otherAssignments.length - 5} more\n`;
                        }
                        message += "\n";
                    }
                }

                if (lastWeekTotal > 0) {
                    const completionRate = Math.round((lastWeekCompleted / lastWeekTotal) * 100);
                    message += `✅ <b>Last Week:</b> Completed ${lastWeekCompleted}/${lastWeekTotal} assignments (${completionRate}%)\n\n`;
                }

                message += "Have a great week! 💪";

                await sendTelegramMessage(chatId, message);

                await db.collection('users').doc(userId).update({
                    'weeklyDigest.lastSentWeek': isoWeek
                });

                sentCount++;
                console.log(`[WeeklyDigest] Sent to user ${userId}`);

            } catch (userError) {
                console.error(`[WeeklyDigest] Error processing user ${userDoc.id}:`, userError);
            }
        }

        console.log(`[WeeklyDigest] Completed. Sent: ${sentCount}, Skipped: ${skippedCount}`);
        return res.status(200).json({
            success: true,
            sent: sentCount,
            skipped: skippedCount
        });

    } catch (error) {
        console.error('[WeeklyDigest] Cron job error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
