import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import * as chrono from 'chrono-node';
import type {
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    AssignmentDoc,
    AssignmentWithDate
} from '../server/telegram/types.js';
import { ASSIGNMENT_STATUS } from '../server/telegram/types.js';
import {
    deleteUserAssignmentRecord,
    getUserAssignmentRecord,
    listUserAssignmentRecords,
    updateUserAssignmentRecord,
} from '../server/sharedAssignments.js';

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

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                reply_markup: replyMarkup
            })
        });
    } catch (e) {
        console.error("Failed to send telegram message", e);
    }
}

async function editTelegramMessage(chatId: string, messageId: number, text: string, replyMarkup?: any): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: text,
                parse_mode: 'HTML',
                reply_markup: replyMarkup
            })
        });
    } catch (e) {
        console.error("Failed to edit telegram message", e);
    }
}

type BotStep = 'AWAITING_TITLE' | 'AWAITING_SUBJECT' | 'AWAITING_DUE_DATE' | 'AWAITING_EDIT_VALUE' | 'AWAITING_REMINDER_PRESET' | 'AWAITING_QUICK_SUBJECT';

interface BotState {
    step: BotStep;
    data: {
        title?: string;
        subjectName?: string;
        subjectId?: string;
        assignmentId?: string; // For editing
        editField?: 'title' | 'dueDate'; // For editing
        reminderAssignmentId?: string; // For reminder setup
    };
    uid: string;
}

async function getState(chatId: string): Promise<BotState | null> {
    const doc = await db.collection("telegramStates").doc(chatId).get();
    return doc.exists ? (doc.data() as BotState) : null;
}

async function startState(chatId: string, uid: string, step: BotStep, data: any = {}): Promise<void> {
    await db.collection("telegramStates").doc(chatId).set({
        step,
        data,
        uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
}

async function updateState(chatId: string, step: BotStep, data: Partial<BotState['data']>): Promise<void> {
    await db.collection("telegramStates").doc(chatId).set({
        step,
        data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

async function clearState(chatId: string): Promise<void> {
    await db.collection("telegramStates").doc(chatId).delete();
}

function getUrgencyEmoji(dueDate: Date): string {
    const now = new Date();
    const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) return '⚫';
    if (hoursRemaining < 24) return '🔴';
    if (hoursRemaining < 72) return '🟡';
    return '🟢';
}

function formatTimeRemaining(dueDate: Date): string {
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();

    if (diffMs < 0) {
        const overdueDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        if (overdueDays === 0) return 'overdue';
        return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} left`;

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} left`;
}

function formatDueDate(dueDate: Date): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = dueDate.toDateString() === now.toDateString();
    const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();

    const timeStr = dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;

    return dueDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function getDayBounds(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function parsePriority(text: string): { priority: string; cleanText: string } {
    const lowercaseText = text.toLowerCase();

    if (lowercaseText.endsWith(' high') || lowercaseText.endsWith(' urgent')) {
        return { priority: 'High', cleanText: text.replace(/\s+(high|urgent)$/i, '') };
    }
    if (lowercaseText.endsWith(' low')) {
        return { priority: 'Low', cleanText: text.replace(/\s+low$/i, '') };
    }
    if (lowercaseText.endsWith(' medium')) {
        return { priority: 'Medium', cleanText: text.replace(/\s+medium$/i, '') };
    }

    return { priority: 'Medium', cleanText: text };
}

async function handleQuickCommand(chatId: string, userUid: string, text: string): Promise<void> {
    const input = text.replace(/^\/quick\s*/i, '').trim();

    if (!input) {
        await sendTelegramMessage(chatId,
            "⚠️ <b>Usage:</b> /quick [title] due [date/time] [priority]\n\n" +
            "<b>Examples:</b>\n" +
            "• /quick Math homework due Friday 5pm\n" +
            "• /quick Database report due tomorrow 11:59pm high\n" +
            "• /quick Essay due next Monday low"
        );
        return;
    }

    // Parse priority first
    const { priority, cleanText } = parsePriority(input);

    // Split by "due" keyword
    const dueIndex = cleanText.toLowerCase().lastIndexOf(' due ');

    if (dueIndex === -1) {
        await sendTelegramMessage(chatId,
            "⚠️ Please include 'due' followed by a date.\n\n" +
            "<b>Example:</b> /quick Math homework due Friday 5pm"
        );
        return;
    }

    const title = cleanText.substring(0, dueIndex).trim();
    const dateText = cleanText.substring(dueIndex + 5).trim();

    if (!title) {
        await sendTelegramMessage(chatId, "⚠️ Please provide a title before 'due'.");
        return;
    }

    // Parse date with chrono - forward-looking
    const parsedDate = chrono.parseDate(dateText, new Date(), { forwardDate: true });

    if (!parsedDate) {
        await sendTelegramMessage(chatId,
            "⚠️ I couldn't understand that date.\n\n" +
            "<b>Try:</b> tomorrow, Friday 5pm, next Monday, Jan 20"
        );
        return;
    }

    // Create assignment
    const assignmentData = {
        title,
        subjectId: '',
        dueDate: parsedDate.toISOString(),
        status: 'Pending',
        priority,
        createdAt: new Date().toISOString(),
        description: 'Added via /quick command'
    };

    const docRef = await db.collection(`users/${userUid}/assignments`).add(assignmentData);

    const priorityEmoji = priority === 'High' ? '🔴' : priority === 'Low' ? '🟢' : '🔸';

    await sendTelegramMessage(chatId,
        "✅ <b>Assignment Created!</b>\n\n" +
        `📝 ${escapeHtml(title)}\n` +
        `📅 Due: ${formatDueDate(parsedDate)}\n` +
        `${priorityEmoji} Priority: ${priority}`,
        {
            inline_keyboard: [
                [
                    { text: "📚 Add Subject", callback_data: `quick_subject_${docRef.id}` },
                    { text: "✏️ Edit", callback_data: `edit_menu_${docRef.id}` }
                ],
                [
                    { text: "📋 View All", callback_data: "list_all" }
                ]
            ]
        }
    );
}

async function handleTodayCommand(chatId: string, userUid: string): Promise<void> {
    const now = new Date();
    const { start, end } = getDayBounds(now);

    const assignments = await listUserAssignmentRecords(db, userUid);
    const todayAssignments = assignments.filter((assignment) => {
        if (assignment.status === ASSIGNMENT_STATUS.COMPLETED) return false;
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= start && dueDate <= end;
    });

    if (todayAssignments.length === 0) {
        await sendTelegramMessage(chatId,
            "📅 <b>No assignments due today!</b>\n\nEnjoy your day! 🎉",
            {
                inline_keyboard: [
                    [
                        { text: "➕ Add New", callback_data: "start_add" },
                        { text: "📋 View All", callback_data: "list_all" }
                    ]
                ]
            }
        );
        return;
    }

    let message = `📅 <b>Due Today</b> (${todayAssignments.length} assignment${todayAssignments.length !== 1 ? 's' : ''})\n\n`;

    for (const assignment of todayAssignments) {
        const dueDate = new Date(assignment.dueDate);
        const urgency = getUrgencyEmoji(dueDate);
        const timeStr = dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        message += `${urgency} <b>${escapeHtml(assignment.title)}</b>\n`;
        message += `   Due: ${timeStr} (${formatTimeRemaining(dueDate)})\n`;
        message += `   Priority: ${assignment.priority}\n\n`;
    }

    const keyboard: any[][] = todayAssignments.slice(0, 5).map((assignment) => [{
        text: `✅ Done: ${assignment.title.substring(0, 20)}`,
        callback_data: `toggle_${assignment.id}`
    }]);
    keyboard.push([{ text: "📋 View Details", callback_data: "list_all" }]);

    await sendTelegramMessage(chatId, message, { inline_keyboard: keyboard });
}

async function handleTomorrowCommand(chatId: string, userUid: string): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { start, end } = getDayBounds(tomorrow);

    const assignments = await listUserAssignmentRecords(db, userUid);
    const tomorrowAssignments = assignments.filter((assignment) => {
        if (assignment.status === ASSIGNMENT_STATUS.COMPLETED) return false;
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= start && dueDate <= end;
    });

    if (tomorrowAssignments.length === 0) {
        await sendTelegramMessage(chatId,
            "📅 <b>No assignments due tomorrow!</b>\n\nLooking clear! ✨",
            {
                inline_keyboard: [
                    [
                        { text: "➕ Add New", callback_data: "start_add" },
                        { text: "📋 View All", callback_data: "list_all" }
                    ]
                ]
            }
        );
        return;
    }

    let message = `📅 <b>Due Tomorrow</b> (${tomorrowAssignments.length} assignment${tomorrowAssignments.length !== 1 ? 's' : ''})\n\n`;

    for (const assignment of tomorrowAssignments) {
        const dueDate = new Date(assignment.dueDate);
        const urgency = getUrgencyEmoji(dueDate);
        const timeStr = dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        message += `${urgency} <b>${escapeHtml(assignment.title)}</b>\n`;
        message += `   Due: ${timeStr}\n`;
        message += `   Priority: ${assignment.priority}\n\n`;
    }

    const keyboard: any[][] = tomorrowAssignments.slice(0, 5).map((assignment) => [{
        text: `✅ Done: ${assignment.title.substring(0, 20)}`,
        callback_data: `toggle_${assignment.id}`
    }]);
    keyboard.push([{ text: "📋 View Details", callback_data: "list_all" }]);

    await sendTelegramMessage(chatId, message, { inline_keyboard: keyboard });
}

async function handleWeekCommand(chatId: string, userUid: string): Promise<void> {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const assignments = await listUserAssignmentRecords(db, userUid);
    const weekAssignments = assignments.filter((assignment) => {
        if (assignment.status === ASSIGNMENT_STATUS.COMPLETED) return false;
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= now && dueDate <= weekEnd;
    });

    if (weekAssignments.length === 0) {
        await sendTelegramMessage(chatId,
            "📅 <b>No assignments due this week!</b>\n\nYou're all caught up! 🎉",
            {
                inline_keyboard: [
                    [
                        { text: "➕ Add New", callback_data: "start_add" },
                        { text: "📋 View All", callback_data: "list_all" }
                    ]
                ]
            }
        );
        return;
    }

    let message = `📅 <b>This Week</b> (${weekAssignments.length} assignment${weekAssignments.length !== 1 ? 's' : ''})\n\n`;

    for (const assignment of weekAssignments) {
        const dueDate = new Date(assignment.dueDate);
        const urgency = getUrgencyEmoji(dueDate);

        message += `${urgency} <b>${escapeHtml(assignment.title)}</b>\n`;
        message += `   Due: ${formatDueDate(dueDate)} (${formatTimeRemaining(dueDate)})\n`;
        message += `   Priority: ${assignment.priority}\n\n`;
    }

    const keyboard: any[][] = [[{ text: "📋 View Details", callback_data: "list_all" }]];

    await sendTelegramMessage(chatId, message, { inline_keyboard: keyboard });
}

async function handleOverdueCommand(chatId: string, userUid: string): Promise<void> {
    const now = new Date();

    const assignments = await listUserAssignmentRecords(db, userUid);
    const overdueAssignments = assignments.filter((assignment) => {
        if (assignment.status === ASSIGNMENT_STATUS.COMPLETED) return false;
        const dueDate = new Date(assignment.dueDate);
        return dueDate < now;
    });

    if (overdueAssignments.length === 0) {
        await sendTelegramMessage(chatId,
            "✅ <b>No overdue assignments!</b>\n\nGreat job staying on track! 🌟",
            {
                inline_keyboard: [
                    [
                        { text: "📅 View Week", callback_data: "cmd_week" },
                        { text: "📋 View All", callback_data: "list_all" }
                    ]
                ]
            }
        );
        return;
    }

    let message = `⚠️ <b>Overdue</b> (${overdueAssignments.length} assignment${overdueAssignments.length !== 1 ? 's' : ''})\n\n`;

    for (const assignment of overdueAssignments) {
        const dueDate = new Date(assignment.dueDate);

        message += `⚫ <b>${escapeHtml(assignment.title)}</b>\n`;
        message += `   Was due: ${formatDueDate(dueDate)}\n`;
        message += `   ${formatTimeRemaining(dueDate)}\n\n`;
    }

    const keyboard: any[][] = overdueAssignments.slice(0, 5).map((assignment) => [{
        text: `✅ Complete: ${assignment.title.substring(0, 18)}`,
        callback_data: `toggle_${assignment.id}`
    }]);
    keyboard.push([{ text: "📋 View All", callback_data: "list_all" }]);

    await sendTelegramMessage(chatId, message, { inline_keyboard: keyboard });
}

async function handleStartIdentifier(chatId: string, userId: string | undefined, text: string) {
    const parts = text.split(" ");
    if (parts.length > 1) {
        const linkToken = parts[1];
        if (!linkToken) {
            await sendTelegramMessage(chatId, "⚠️ Invalid link token.");
            return;
        }
        await db.collection("telegramLinks").doc(linkToken).set({
            chatId: chatId,
            telegramUserId: userId,
            linkedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await sendTelegramMessage(chatId,
            "✅ <b>Account Linked Successfully!</b>\n\n" +
            "Use /add to add a new assignment.\n" +
            "Use /assignments to view tasks."
        );
    } else {
        await sendTelegramMessage(chatId,
            "👋 <b>Welcome to UniAssignment Bot!</b>\n\n" +
            "Please link your account from the web app first."
        );
    }
}

async function handleAssignmentsCommand(chatId: string, userUid: string) {
    const assignments = (await listUserAssignmentRecords(db, userUid)).slice(0, 10);

    if (assignments.length === 0) {
        await sendTelegramMessage(chatId, "📚 You have no assignments yet!");
    } else {
        const inlineKeyboard: any[][] = [];

        assignments.forEach((assignment) => {
            const dueDate = new Date(assignment.dueDate).toLocaleDateString();
            const statusEmoji = assignment.status === "Completed" ? "✅" : "⏳";

            // Button Format: [ ⏳ Math HW - Oct 12 ]
            inlineKeyboard.push([{
                text: `${statusEmoji} ${assignment.title} - ${dueDate}`,
                callback_data: `view_${assignment.id}`
            }]);
        });

        await sendTelegramMessage(chatId, "📅 <b>Your Assignments:</b>\nClick an item to manage it.", {
            inline_keyboard: inlineKeyboard
        });
    }
}

async function showRemindMenu(chatId: string, userUid: string) {
    const pendingAssignments = (await listUserAssignmentRecords(db, userUid)).filter(
        (assignment) => assignment.status !== "Completed"
    ).slice(0, 10);

    if (pendingAssignments.length === 0) {
        await sendTelegramMessage(chatId, "📚 You have no pending assignments to set reminders for.");
        return;
    }

    const inlineKeyboard: any[][] = [];
    pendingAssignments.forEach((assignment) => {
        const hasReminder = assignment.reminder?.enabled;
        const emoji = hasReminder ? '🔔' : '⏰';
        inlineKeyboard.push([{
            text: `${emoji} ${assignment.title}`,
            callback_data: `remind_set_${assignment.id}`
        }]);
    });

    await sendTelegramMessage(chatId, "⏰ <b>Set a Reminder</b>\n\nSelect an assignment:", {
        inline_keyboard: inlineKeyboard
    });
}

function formatPresetText(preset: string): string {
    const map: Record<string, string> = {
        '1h': '1 hour before',
        '6h': '6 hours before',
        '1d': '1 day before',
        '3d': '3 days before',
        '1w': '1 week before',
        'custom': 'custom time'
    };
    return map[preset] || preset;
}

// Formats minutes into readable time (e.g., 90 -> "1 hour 30 minutes")
function formatMinutesBeforeDue(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

async function handleCallbackQuery(query: any, userUid: string) {
    const callbackQueryId = query.id;
    const chatId = query.message.chat.id.toString();
    const messageId = query.message.message_id;
    const data = query.data;

    const answerUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId })
    });

    if (data === 'start_add') {
        await startState(chatId, userUid, 'AWAITING_TITLE');
        await sendTelegramMessage(chatId, "🆕 <b>New Assignment</b>\n\nFirst, what is the <b>title</b> of the assignment?");
        return;
    }

    if (data === 'cmd_week') {
        await handleWeekCommand(chatId, userUid);
        return;
    }

    if (data.startsWith('quick_subject_')) {
        const assignmentId = data.replace('quick_subject_', '');
        await startState(chatId, userUid, 'AWAITING_QUICK_SUBJECT', { assignmentId });

        const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`).get();
        const subjects = subjectsSnapshot.docs.map(d => d.data().name);

        let msg = "📚 <b>Select a Subject</b>\n\nType the subject name:";
        if (subjects.length > 0) {
            msg += `\n\nExisting subjects:\n• ${subjects.join("\n• ")}`;
        }

        await sendTelegramMessage(chatId, msg);
        return;
    }

    if (data.startsWith('remind_set_')) {
        const assignmentId = data.replace('remind_set_', '');
        const assignment = await getUserAssignmentRecord(db, userUid, assignmentId);

        if (!assignment) {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found.");
            return;
        }

        await showReminderPresets(chatId, messageId, assignmentId, userUid, assignment.reminder);
        return;
    }

    if (data.startsWith('remind_preset_')) {
        const parts = data.split('_');
        const preset = parts[2];  // 1h, 6h, etc.
        const assignmentId = parts[3];

        const assignment = await getUserAssignmentRecord(db, userUid, assignmentId);

        if (!assignment) {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found.");
            return;
        }

        await updateUserAssignmentRecord(db, userUid, assignmentId, {
            reminder: {
                enabled: true,
                preset,
            },
        });

        await editTelegramMessage(chatId, messageId,
            `✅ <b>Reminder Set!</b>\n\n` +
            `I'll remind you about <b>${assignment.title}</b> ${formatPresetText(preset)} it's due.\n\n` +
            `Use /assignments to manage your tasks.`
        );
        return;
    }

    if (data.startsWith('remind_disable_')) {
        const assignmentId = data.replace('remind_disable_', '');
        const assignment = await getUserAssignmentRecord(db, userUid, assignmentId);

        if (!assignment) {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found.");
            return;
        }

        await updateUserAssignmentRecord(db, userUid, assignmentId, {
            reminder: {
                ...(assignment.reminder ?? { preset: '1d' }),
                enabled: false
            },
        });

        await editTelegramMessage(chatId, messageId, "🔕 <b>Reminder Disabled</b>");
        return;
    }

    if (data.startsWith('remind_custom_')) {
        const assignmentId = data.replace('remind_custom_', '');
        await startState(chatId, userUid, 'AWAITING_REMINDER_PRESET', { reminderAssignmentId: assignmentId });

        await sendTelegramMessage(chatId,
            "⏰ <b>Custom Reminder</b>\n\n" +
            "Enter how many hours/days before the deadline:\n" +
            "Examples: \"2 hours\", \"3 days\", \"1 week\""
        );
        return;
    }

    if (data.startsWith('view_')) {
        const assignmentId = data.replace('view_', '');
        const assignment = await getUserAssignmentRecord(db, userUid, assignmentId);

        if (!assignment) {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found (it might verify deleted).");
            return;
        }

        const dateStr = new Date(assignment.dueDate).toLocaleDateString();
        const statusStr = assignment.status;
        const subjectName = assignment.subjectName || "Unknown Subject";

        const text = `📖 <b>${assignment.title}</b>\n\n` +
            `📚 Subject: ${subjectName}\n` +
            `📅 Due: ${dateStr}\n` +
            `📊 Status: ${statusStr}`;

        const keyboard = [[{
            text: assignment.status === 'Completed' ? "🔄 Mark Pending" : "✅ Mark Done",
            callback_data: `toggle_${assignmentId}`
        }]];

        if (assignment.canEditSharedFields) {
            keyboard[0]!.push({ text: "✏️ Edit", callback_data: `edit_menu_${assignmentId}` });
        }

        if (assignment.canDelete) {
            keyboard.push([{ text: "🗑️ Delete", callback_data: `delete_confirm_${assignmentId}` }]);
        }

        keyboard.push([{ text: "🔙 Back to List", callback_data: `list_all` }]);

        await editTelegramMessage(chatId, messageId, text, { inline_keyboard: keyboard });
    }

    else if (data.startsWith('toggle_')) {
        const assignmentId = data.replace('toggle_', '');
        const assignment = await getUserAssignmentRecord(db, userUid, assignmentId);

        if (assignment) {
            const newStatus = assignment.status === "Completed" ? "Pending" : "Completed";
            await updateUserAssignmentRecord(db, userUid, assignmentId, { status: newStatus });
            await handleCallbackQuery({ ...query, data: `view_${assignmentId}` }, userUid);
        } else {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found.");
        }
    }

    else if (data.startsWith('delete_confirm_')) {
        const assignmentId = data.replace('delete_confirm_', '');
        await editTelegramMessage(chatId, messageId, "⚠️ <b>Are you sure you want to delete this?</b>", {
            inline_keyboard: [
                [
                    { text: "❌ Yes, Delete", callback_data: `delete_final_${assignmentId}` },
                    { text: "🔙 Cancel", callback_data: `view_${assignmentId}` }
                ]
            ]
        });
    }

    else if (data.startsWith('delete_final_')) {
        const assignmentId = data.replace('delete_final_', '');
        await deleteUserAssignmentRecord(db, userUid, assignmentId);
        await editTelegramMessage(chatId, messageId, "🗑️ <b>Assignment Deleted.</b>");
        await handleAssignmentsCommand(chatId, userUid);
    }

    else if (data.startsWith('edit_menu_')) {
        const assignmentId = data.replace('edit_menu_', '');
        await editTelegramMessage(chatId, messageId, "✏️ <b>What do you want to edit?</b>", {
            inline_keyboard: [
                [
                    { text: "📝 Title", callback_data: `edit_field_title_${assignmentId}` },
                    { text: "📅 Due Date", callback_data: `edit_field_date_${assignmentId}` }
                ],
                [{ text: "🔙 Back", callback_data: `view_${assignmentId}` }]
            ]
        });
    }

    else if (data.startsWith('edit_field_')) {
        const rest = data.replace('edit_field_', '');

        let field = '';
        let assignmentId = '';

        if (rest.startsWith('title_')) {
            field = 'title';
            assignmentId = rest.replace('title_', '');
        } else if (rest.startsWith('date_')) {
            field = 'dueDate';
            assignmentId = rest.replace('date_', '');
        }

        if (field && assignmentId) {
            await startState(chatId, userUid, 'AWAITING_EDIT_VALUE', {
                assignmentId,
                editField: field
            });

            const prompt = field === 'title' ? "Enter the new <b>Title</b>:" : "Enter the new <b>Due Date</b> (e.g. 'tomorrow'):";
            await sendTelegramMessage(chatId, `✏️ ${prompt}`);
        }
    }

    else if (data === 'list_all') {
        await db.collection("telegramStates").doc(chatId).delete();
        await editTelegramMessage(chatId, messageId, "⏳ Loading list...");

        const assignments = (await listUserAssignmentRecords(db, userUid)).slice(0, 10);

        if (assignments.length === 0) {
            await editTelegramMessage(chatId, messageId, "📚 You have no assignments yet!");
        } else {
            const inlineKeyboard: any[][] = [];
            assignments.forEach((assignment) => {
                const dd = new Date(assignment.dueDate).toLocaleDateString();
                const s = assignment.status === "Completed" ? "✅" : "⏳";
                inlineKeyboard.push([{
                    text: `${s} ${assignment.title} - ${dd}`,
                    callback_data: `view_${assignment.id}`
                }]);
            });
            await editTelegramMessage(chatId, messageId, "📅 <b>Your Assignments:</b>", { inline_keyboard: inlineKeyboard });
        }
    }
}

async function showReminderPresets(chatId: string, messageId: number, assignmentId: string, userUid: string, currentReminder?: any) {
    const keyboard = [
        [
            { text: "1 hour before", callback_data: `remind_preset_1h_${assignmentId}` },
            { text: "6 hours before", callback_data: `remind_preset_6h_${assignmentId}` }
        ],
        [
            { text: "1 day before", callback_data: `remind_preset_1d_${assignmentId}` },
            { text: "3 days before", callback_data: `remind_preset_3d_${assignmentId}` }
        ],
        [
            { text: "1 week before", callback_data: `remind_preset_1w_${assignmentId}` },
            { text: "Custom", callback_data: `remind_custom_${assignmentId}` }
        ],
    ];

    const bottomRow = [{ text: "🔙 Back", callback_data: "list_all" }];
    if (currentReminder?.enabled) {
        bottomRow.unshift({ text: "🔕 Disable", callback_data: `remind_disable_${assignmentId}` });
    }
    keyboard.push(bottomRow);

    const currentText = currentReminder?.enabled
        ? `\n\n📍 Current: ${formatPresetText(currentReminder.preset)}`
        : '';

    await editTelegramMessage(chatId, messageId,
        `⏰ <b>When should I remind you?</b>${currentText}`,
        { inline_keyboard: keyboard }
    );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(200).json({ message: 'UniAssignment Bot Webhook Active' });
    }

    try {
        const update = req.body;

        if (update.callback_query) {
            const chatId = update.callback_query.message.chat.id.toString();
            const linksSnapshot = await db.collection("telegramLinks").where("chatId", "==", chatId).limit(1).get();
            if (linksSnapshot.empty) {
                await sendTelegramMessage(chatId, "⚠️ Authentication error.");
                return res.status(200).send('OK');
            }
            const linkDoc = linksSnapshot.docs[0];
            if (!linkDoc) {
                await sendTelegramMessage(chatId, "⚠️ Authentication error.");
                return res.status(200).send('OK');
            }
            const userUid = linkDoc.id;

            await handleCallbackQuery(update.callback_query, userUid);
            return res.status(200).send('OK');
        }

        if (!update.message) {
            return res.status(200).send('OK');
        }

        const chatId = update.message.chat.id.toString();
        const text = update.message.text || '';
        const userId = update.message.from?.id?.toString();

        if (text.startsWith('/start')) {
            await handleStartIdentifier(chatId, userId, text);
            return res.status(200).send('OK');
        }

        const linksSnapshot = await db.collection("telegramLinks")
            .where("chatId", "==", chatId)
            .limit(1)
            .get();

        if (linksSnapshot.empty) {
            await sendTelegramMessage(chatId, "⚠️ Please link your account from the web app settings first.");
            return res.status(200).send('OK');
        }

        const linkDoc = linksSnapshot.docs[0];
        if (!linkDoc) {
            await sendTelegramMessage(chatId, "⚠️ Authentication error.");
            return res.status(200).send('OK');
        }
        const userUid = linkDoc.id;

        if (text === '/cancel') {
            await clearState(chatId);
            await sendTelegramMessage(chatId, "🚫 Action cancelled.");
            return res.status(200).send('OK');
        }

        if (text === '/help') {
            await sendTelegramMessage(chatId,
                "<b>Commands:</b>\n\n" +
                "<b>Quick Actions:</b>\n" +
                "/quick [title] due [date] - Quick add assignment\n" +
                "/add - Add assignment (step-by-step)\n\n" +
                "<b>View Assignments:</b>\n" +
                "/today - Due today\n" +
                "/tomorrow - Due tomorrow\n" +
                "/week - Due this week\n" +
                "/overdue - Past due\n" +
                "/assignments - All assignments\n\n" +
                "<b>Other:</b>\n" +
                "/remind - Set reminders\n" +
                "/cancel - Cancel current action"
            );
            return res.status(200).send('OK');
        }

        if (text === '/assignments') {
            await handleAssignmentsCommand(chatId, userUid);
            return res.status(200).send('OK');
        }

        if (text === '/remind') {
            await showRemindMenu(chatId, userUid);
            return res.status(200).send('OK');
        }

        if (text.startsWith('/quick')) {
            await handleQuickCommand(chatId, userUid, text);
            return res.status(200).send('OK');
        }

        if (text === '/today') {
            await handleTodayCommand(chatId, userUid);
            return res.status(200).send('OK');
        }

        if (text === '/tomorrow') {
            await handleTomorrowCommand(chatId, userUid);
            return res.status(200).send('OK');
        }

        if (text === '/week') {
            await handleWeekCommand(chatId, userUid);
            return res.status(200).send('OK');
        }

        if (text === '/overdue') {
            await handleOverdueCommand(chatId, userUid);
            return res.status(200).send('OK');
        }

        const currentState = await getState(chatId);

        if (currentState) {
            if (currentState.step === 'AWAITING_REMINDER_PRESET') {
                const { reminderAssignmentId } = currentState.data;

                if (!reminderAssignmentId) {
                    console.error(`[Reminder] Missing reminderAssignmentId for chatId ${chatId}, state:`, currentState);
                    await clearState(chatId);
                    sendTelegramMessage(chatId,
                        "⚠️ <b>Something went wrong</b>\n\n" +
                        "I couldn't find the assignment. Please try /remind again."
                    ).catch(err => console.error('[Reminder] Failed to send error message:', err));
                    return res.status(200).send('OK');
                }

                const parsed = chrono.parseDate(text);
                const now = new Date();
                let minutes = 0;

                const hoursMatch = text.match(/(\d+)\s*(hour|hr|h)/i);
                const daysMatch = text.match(/(\d+)\s*(day|d)/i);
                const weeksMatch = text.match(/(\d+)\s*(week|w)/i);

                if (weeksMatch) {
                    minutes = parseInt(weeksMatch[1]) * 7 * 24 * 60;
                } else if (daysMatch) {
                    minutes = parseInt(daysMatch[1]) * 24 * 60;
                } else if (hoursMatch) {
                    minutes = parseInt(hoursMatch[1]) * 60;
                } else if (parsed && parsed > now) {
                    const assignment = await getUserAssignmentRecord(db, userUid, reminderAssignmentId);
                    if (assignment) {
                        const dueDate = new Date(assignment.dueDate);
                        minutes = Math.max(0, Math.round((dueDate.getTime() - parsed.getTime()) / (1000 * 60)));
                    }
                }

                if (minutes > 0) {
                    await updateUserAssignmentRecord(db, userUid, reminderAssignmentId, {
                        reminder: {
                            enabled: true,
                            preset: 'custom',
                            customMinutes: minutes
                        }
                    });

                    await clearState(chatId);
                    await sendTelegramMessage(chatId,
                        `✅ <b>Reminder Set!</b>\n\n` +
                        `I'll remind you ${formatMinutesBeforeDue(minutes)} before the deadline.`
                    );
                } else {
                    await sendTelegramMessage(chatId,
                        "⚠️ I couldn't understand that. Try:\n" +
                        "\"2 hours\" or \"3 days\" or \"next Monday\""
                    );
                }

                return res.status(200).send('OK');
            }

            if (currentState.step === 'AWAITING_QUICK_SUBJECT') {
                const { assignmentId } = currentState.data;
                const subjectName = text.trim();

                if (!assignmentId) {
                    await clearState(chatId);
                    await sendTelegramMessage(chatId, "⚠️ Something went wrong. Please try again.");
                    return res.status(200).send('OK');
                }

                let subjectId = '';
                const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`)
                    .where("name", "==", subjectName)
                    .limit(1)
                    .get();

                if (!subjectsSnapshot.empty) {
                    const subjectDoc = subjectsSnapshot.docs[0];
                    if (subjectDoc) {
                        subjectId = subjectDoc.id;
                    }
                } else {
                    const newSubjectRef = await db.collection(`users/${userUid}/subjects`).add({
                        name: subjectName,
                        color: "bg-blue-500",
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    });
                    subjectId = newSubjectRef.id;
                }

                await db.doc(`users/${userUid}/assignments/${assignmentId}`).update({
                    subjectId: subjectId
                });

                await clearState(chatId);
                await sendTelegramMessage(chatId,
                    `✅ <b>Subject Added!</b>\n\n` +
                    `📚 ${subjectName}\n\n` +
                    `Use /assignments to view your tasks.`
                );

                return res.status(200).send('OK');
            }

            if (currentState.step === 'AWAITING_EDIT_VALUE') {
                const { assignmentId, editField } = currentState.data;
                let newValue = text;

                if (editField === 'dueDate') {
                    const parsed = chrono.parseDate(text, new Date(), { forwardDate: true });
                    if (!parsed) {
                        await sendTelegramMessage(chatId, "⚠️ Invalid date. Try 'tomorrow' or 'next Friday'.");
                        return res.status(200).send('OK');
                    }
                    newValue = parsed.toISOString();
                }

                if (assignmentId && editField) {
                    await updateUserAssignmentRecord(db, userUid, assignmentId, {
                        [editField]: newValue
                    });

                    await clearState(chatId);
                    await sendTelegramMessage(chatId, "✅ <b>Updated successfully!</b> Use /assignments to see changes.");
                }

                return res.status(200).send('OK');
            }

            else if (currentState.step === 'AWAITING_TITLE') {
                await updateState(chatId, 'AWAITING_SUBJECT', { title: text.trim(), subjectName: "" });

                const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`).get();
                const subjects = subjectsSnapshot.docs.map(d => d.data().name);

                let msg = `📝 Title: <b>${text}</b>\n\nNow, exactly <b>which subject</b> is this for?\n`;
                if (subjects.length > 0) {
                    msg += `\nExisting subjects:\n- ${subjects.join("\n- ")}`;
                }

                await sendTelegramMessage(chatId, msg);

            } else if (currentState.step === 'AWAITING_SUBJECT') {
                const subjectName = text.trim();
                let subjectId = "";
                let finalSubjectName = subjectName;

                const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`)
                    .where("name", "==", subjectName)
                    .limit(1)
                    .get();

                if (!subjectsSnapshot.empty) {
                    const subjectDoc = subjectsSnapshot.docs[0];
                    if (subjectDoc) {
                        subjectId = subjectDoc.id;
                        finalSubjectName = subjectDoc.data().name;
                    }
                } else {
                    const newSubjectRef = await db.collection(`users/${userUid}/subjects`).add({
                        name: subjectName,
                        color: "bg-blue-500",
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    });
                    subjectId = newSubjectRef.id;
                }

                await updateState(chatId, 'AWAITING_DUE_DATE', { ...currentState.data, subjectName: finalSubjectName, subjectId });

                await sendTelegramMessage(chatId,
                    `📚 Subject: <b>${finalSubjectName}</b>\n\n` +
                    `Finally, <b>when is it due?</b>\n` +
                    `(e.g., "next Friday", "tomorrow", "Dec 25")`
                );

            } else if (currentState.step === 'AWAITING_DUE_DATE') {
                // Finalize
                const parsedDate = chrono.parseDate(text, new Date(), { forwardDate: true });

                if (!parsedDate) {
                    await sendTelegramMessage(chatId, "⚠️ I couldn't understand that date. Please try again (e.g., 'tomorrow', 'next Monday').");
                } else {
                    const assignmentData = {
                        title: currentState.data.title,
                        subjectId: currentState.data.subjectId,
                        dueDate: parsedDate.toISOString(),
                        status: "Pending",
                        priority: "Medium",
                        createdAt: new Date().toISOString(),
                        description: "Added via Telegram"
                    };

                    await db.collection(`users/${userUid}/assignments`).add(assignmentData);
                    await clearState(chatId);

                    await sendTelegramMessage(chatId,
                        `✅ <b>Assignment Added!</b>\n\n` +
                        `📝 ${assignmentData.title}\n` +
                        `📅 ${parsedDate.toLocaleDateString()}\n` +
                        `📚 ${currentState.data.subjectName}`
                    );
                }
            }
            return res.status(200).send('OK');
        }

        // 5. Start /add flow
        if (text === '/add') {
            await startState(chatId, userUid, 'AWAITING_TITLE');
            await sendTelegramMessage(chatId, "🆕 <b>New Assignment</b>\n\nFirst, what is the <b>title</b> of the assignment?");
            return res.status(200).send('OK');
        }

        // Fallback
        await sendTelegramMessage(chatId, "❓ Unknown command. Use /add to create an assignment or /help for more info.");
        return res.status(200).send('OK');

    } catch (error) {
        console.error('Telegram webhook error:', error);
        return res.status(500).send('Error');
    }
}
