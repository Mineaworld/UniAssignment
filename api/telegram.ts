import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import * as chrono from 'chrono-node';

// Initialize Firebase Admin (only once)
if (!admin.apps || admin.apps.length === 0) {
    // Handle private key - it may have literal \n or escaped \\n
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

// --- HELPER: Send Telegram Message ---
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

// --- HELPER: Edit Telegram Message ---
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

// --- HELPER: Manage State ---
type BotStep = 'AWAITING_TITLE' | 'AWAITING_SUBJECT' | 'AWAITING_DUE_DATE' | 'AWAITING_EDIT_VALUE' | 'AWAITING_REMINDER_PRESET';

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

// --- HANDLERS ---
async function handleStartIdentifier(chatId: string, userId: string | undefined, text: string) {
    const parts = text.split(" ");
    if (parts.length > 1) {
        const linkToken = parts[1];
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
    const assignmentsSnapshot = await db
        .collection(`users/${userUid}/assignments`)
        .orderBy("dueDate", "asc")
        .limit(10)
        .get();

    if (assignmentsSnapshot.empty) {
        await sendTelegramMessage(chatId, "📚 You have no assignments yet!");
    } else {
        const inlineKeyboard: any[][] = [];

        assignmentsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const dueDate = new Date(data.dueDate).toLocaleDateString();
            const statusEmoji = data.status === "Completed" ? "✅" : "⏳";

            // Button Format: [ ⏳ Math HW - Oct 12 ]
            inlineKeyboard.push([{
                text: `${statusEmoji} ${data.title} - ${dueDate}`,
                callback_data: `view_${doc.id}`
            }]);
        });

        await sendTelegramMessage(chatId, "📅 <b>Your Assignments:</b>\nClick an item to manage it.", {
            inline_keyboard: inlineKeyboard
        });
    }
}

async function showRemindMenu(chatId: string, userUid: string) {
    // Firestore requires inequality filter field to be first orderBy.
    // Filter out Completed assignments in JavaScript instead.
    const assignmentsSnapshot = await db
        .collection(`users/${userUid}/assignments`)
        .orderBy("dueDate", "asc")
        .limit(20) // Fetch more since we'll filter out completed ones
        .get();

    // Filter out completed assignments
    const pendingDocs = assignmentsSnapshot.docs.filter(
        (doc) => doc.data().status !== "Completed"
    ).slice(0, 10); // Limit to 10 after filtering

    if (pendingDocs.length === 0) {
        await sendTelegramMessage(chatId, "📚 You have no pending assignments to set reminders for.");
        return;
    }

    const inlineKeyboard: any[][] = [];
    pendingDocs.forEach((doc) => {
        const d = doc.data();
        const hasReminder = d.reminder?.enabled;
        const emoji = hasReminder ? '🔔' : '⏰';
        inlineKeyboard.push([{
            text: `${emoji} ${d.title}`,
            callback_data: `remind_set_${doc.id}`
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

/**
 * Format minutes into human-readable time before due
 * Examples: 30 -> "30 minutes", 60 -> "1 hour", 90 -> "1 hour 30 minutes", 150 -> "2 hours 30 minutes"
 */
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
    // Must answer callback query to stop loading state
    const callbackQueryId = query.id;
    const chatId = query.message.chat.id.toString();
    const messageId = query.message.message_id;
    const data = query.data; // e.g., 'view_xyz123'

    const answerUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId })
    });

    // --- Action Routing ---

    // REMINDER FLOW - Handle reminder-related callbacks
    if (data.startsWith('remind_set_')) {
        const assignmentId = data.replace('remind_set_', '');
        const doc = await db.doc(`users/${userUid}/assignments/${assignmentId}`).get();

        if (!doc.exists) {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found.");
            return;
        }

        await showReminderPresets(chatId, messageId, assignmentId, userUid, doc.data()?.reminder);
        return;
    }

    if (data.startsWith('remind_preset_')) {
        const parts = data.split('_');
        const preset = parts[2];  // 1h, 6h, etc.
        const assignmentId = parts[3];

        const docRef = db.doc(`users/${userUid}/assignments/${assignmentId}`);
        const doc = await docRef.get();

        if (!doc.exists) {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found.");
            return;
        }

        const assignment = doc.data()!;
        // Use dot notation to properly delete sentAt while updating other fields
        await docRef.update({
            "reminder.enabled": true,
            "reminder.preset": preset,
            "reminder.sentAt": admin.firestore.FieldValue.delete()  // Reset sent status if changing
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
        await db.doc(`users/${userUid}/assignments/${assignmentId}`).update({
            "reminder.enabled": false
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

    // 1. VIEW Details
    if (data.startsWith('view_')) {
        const assignmentId = data.replace('view_', '');
        const doc = await db.doc(`users/${userUid}/assignments/${assignmentId}`).get();

        if (!doc.exists) {
            await editTelegramMessage(chatId, messageId, "❌ Assignment not found (it might verify deleted).");
            return;
        }

        const d = doc.data()!;
        const dateStr = new Date(d.dueDate).toLocaleDateString();
        const statusStr = d.status === "Completed" ? "Completed" : "Pending";

        // Subject Name lookup (optional optimization)
        let subjectName = "Unknown Subject";
        if (d.subjectId) {
            const subDoc = await db.doc(`users/${userUid}/subjects/${d.subjectId}`).get();
            if (subDoc.exists) subjectName = subDoc.data()!.name;
        }

        const text = `📖 <b>${d.title}</b>\n\n` +
            `📚 Subject: ${subjectName}\n` +
            `📅 Due: ${dateStr}\n` +
            `📊 Status: ${statusStr}`;

        const keyboard = [
            [
                { text: d.status === 'Completed' ? "🔄 Mark Pending" : "✅ Mark Done", callback_data: `toggle_${assignmentId}` },
                { text: "✏️ Edit", callback_data: `edit_menu_${assignmentId}` }
            ],
            [
                { text: "🗑️ Delete", callback_data: `delete_confirm_${assignmentId}` }
            ],
            [
                { text: "🔙 Back to List", callback_data: `list_all` }
            ]
        ];

        await editTelegramMessage(chatId, messageId, text, { inline_keyboard: keyboard });
    }

    // 2. TOGGLE Status
    else if (data.startsWith('toggle_')) {
        const assignmentId = data.replace('toggle_', '');
        const docRef = db.doc(`users/${userUid}/assignments/${assignmentId}`);
        const doc = await docRef.get();
        if (doc.exists) {
            const currentStatus = doc.data()!.status;
            const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
            await docRef.update({ status: newStatus });

            // Refresh view
            await handleCallbackQuery({ ...query, data: `view_${assignmentId}` }, userUid);
        }
    }

    // 3. DELETE Confirm
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

    // 4. DELETE Final
    else if (data.startsWith('delete_final_')) {
        const assignmentId = data.replace('delete_final_', '');
        await db.doc(`users/${userUid}/assignments/${assignmentId}`).delete();
        await editTelegramMessage(chatId, messageId, "🗑️ <b>Assignment Deleted.</b>");
        // Optionally show list again
        await handleAssignmentsCommand(chatId, userUid);
    }

    // 5. EDIT Menu
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

    // 6. EDIT Start Field
    else if (data.startsWith('edit_field_')) {
        const rest = data.replace('edit_field_', '');
        // format: title_ID or date_ID
        // We need to parse robustly. 
        // Let's assume ID doesn't have underscores or we use fixed prefix len.
        // Actually, simplest is to split by first underscore.

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
            // Enter State Machine
            await startState(chatId, userUid, 'AWAITING_EDIT_VALUE', {
                assignmentId,
                editField: field
            });

            const prompt = field === 'title' ? "Enter the new <b>Title</b>:" : "Enter the new <b>Due Date</b> (e.g. 'tomorrow'):";
            await sendTelegramMessage(chatId, `✏️ ${prompt}`);
        }
    }

    // 7. LIST All
    else if (data === 'list_all') {
        // We can't edit message to show list if the list is long, but we can try removing previous buttons first
        // Better to just send a new list or re-render
        await db.collection("telegramStates").doc(chatId).delete(); // Clear any state
        await editTelegramMessage(chatId, messageId, "⏳ Loading list...");
        // We need to call the command handler, but it sends a NEW message.
        // Let's delete the old message and send new one? Or edit.
        // `handleAssignmentsCommand` strictly sends new message.
        // Custom logic to EDIT:

        const assignmentsSnapshot = await db
            .collection(`users/${userUid}/assignments`)
            .orderBy("dueDate", "asc")
            .limit(10)
            .get();

        if (assignmentsSnapshot.empty) {
            await editTelegramMessage(chatId, messageId, "📚 You have no assignments yet!");
        } else {
            const inlineKeyboard: any[][] = [];
            assignmentsSnapshot.docs.forEach((doc) => {
                const d = doc.data();
                const dd = new Date(d.dueDate).toLocaleDateString();
                const s = d.status === "Completed" ? "✅" : "⏳";
                inlineKeyboard.push([{
                    text: `${s} ${d.title} - ${dd}`,
                    callback_data: `view_${doc.id}`
                }]);
            });
            await editTelegramMessage(chatId, messageId, "📅 <b>Your Assignments:</b>", { inline_keyboard: inlineKeyboard });
        }
    }
}

// --- HELPER: Show Reminder Presets ---
async function showReminderPresets(chatId: string, messageId: number, assignmentId: string, userUid: string, currentReminder?: any) {
    // Build keyboard rows
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

    // Only show Disable button if reminder is already enabled
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

// --- MAIN WEBHOOK HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(200).json({ message: 'UniAssignment Bot Webhook Active' });
    }

    try {
        const update = req.body;

        // --- HANDLE CALLBACK QUERIES (Buttons) ---
        if (update.callback_query) {
            const chatId = update.callback_query.message.chat.id.toString();
            // Need userUid
            const linksSnapshot = await db.collection("telegramLinks").where("chatId", "==", chatId).limit(1).get();
            if (linksSnapshot.empty) {
                await sendTelegramMessage(chatId, "⚠️ Authentication error.");
                return res.status(200).send('OK');
            }
            const userUid = linksSnapshot.docs[0].id;

            await handleCallbackQuery(update.callback_query, userUid);
            return res.status(200).send('OK');
        }

        // --- HANDLE MESSAGES ---
        if (!update.message) {
            return res.status(200).send('OK');
        }

        const chatId = update.message.chat.id.toString();
        const text = update.message.text || '';
        const userId = update.message.from?.id?.toString();

        // 1. Handle /start
        if (text.startsWith('/start')) {
            await handleStartIdentifier(chatId, userId, text);
            return res.status(200).send('OK');
        }

        // 2. Check Link Status
        const linksSnapshot = await db.collection("telegramLinks")
            .where("chatId", "==", chatId)
            .limit(1)
            .get();

        if (linksSnapshot.empty) {
            await sendTelegramMessage(chatId, "⚠️ Please link your account from the web app settings first.");
            return res.status(200).send('OK');
        }

        const linkDoc = linksSnapshot.docs[0];
        const userUid = linkDoc.id;

        // 3. Global Commands
        if (text === '/cancel') {
            await clearState(chatId);
            await sendTelegramMessage(chatId, "🚫 Action cancelled.");
            return res.status(200).send('OK');
        }

        if (text === '/help') {
            await sendTelegramMessage(chatId,
                "<b>Commands:</b>\n" +
                "/add - Add a new assignment\n" +
                "/assignments - View & Manage assignments\n" +
                "/remind - Set assignment reminders\n" +
                "/cancel - Cancel"
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

        // 4. Conversation State Machine
        const currentState = await getState(chatId);

        if (currentState) {
            if (currentState.step === 'AWAITING_REMINDER_PRESET') {
                // Handle Custom Reminder Input
                const { reminderAssignmentId } = currentState.data;

                if (!reminderAssignmentId) {
                    console.error(`[Reminder] Missing reminderAssignmentId for chatId ${chatId}, state:`, currentState);
                    await clearState(chatId);
                    // Notify user of the error (fire and forget to ensure 200 response)
                    sendTelegramMessage(chatId,
                        "⚠️ <b>Something went wrong</b>\n\n" +
                        "I couldn't find the assignment. Please try /remind again."
                    ).catch(err => console.error('[Reminder] Failed to send error message:', err));
                    return res.status(200).send('OK');
                }

                // Parse custom time
                const parsed = chrono.parseDate(text);
                const now = new Date();
                let minutes = 0;

                // Try to parse as "X hours/days/weeks"
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
                    // Absolute date - calculate minutes from due date
                    const doc = await db.doc(`users/${userUid}/assignments/${reminderAssignmentId}`).get();
                    if (doc.exists) {
                        const dueDate = new Date(doc.data()!.dueDate);
                        minutes = Math.max(0, Math.round((dueDate.getTime() - parsed.getTime()) / (1000 * 60)));
                    }
                }

                if (minutes > 0) {
                    await db.doc(`users/${userUid}/assignments/${reminderAssignmentId}`).update({
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

            if (currentState.step === 'AWAITING_EDIT_VALUE') {
                // Handle Editing
                const { assignmentId, editField } = currentState.data;
                let newValue = text; // Default for title

                if (editField === 'dueDate') {
                    const parsed = chrono.parseDate(text);
                    if (!parsed) {
                        await sendTelegramMessage(chatId, "⚠️ Invalid date. Try 'tomorrow' or 'next Friday'.");
                        return res.status(200).send('OK');
                    }
                    newValue = parsed.toISOString();
                }

                if (assignmentId && editField) {
                    await db.doc(`users/${userUid}/assignments/${assignmentId}`).update({
                        [editField]: newValue
                    });

                    await clearState(chatId);
                    await sendTelegramMessage(chatId, "✅ <b>Updated successfully!</b> Use /assignments to see changes.");
                }

                return res.status(200).send('OK');
            }

            // ... Existing /add logic ...
            else if (currentState.step === 'AWAITING_TITLE') {
                // Transition to Subject
                await updateState(chatId, 'AWAITING_SUBJECT', { title: text.trim(), subjectName: "" });

                const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`).get();
                const subjects = subjectsSnapshot.docs.map(d => d.data().name);

                let msg = `📝 Title: <b>${text}</b>\n\nNow, exactly <b>which subject</b> is this for?\n`;
                if (subjects.length > 0) {
                    msg += `\nExisting subjects:\n- ${subjects.join("\n- ")}`;
                }

                await sendTelegramMessage(chatId, msg);

            } else if (currentState.step === 'AWAITING_SUBJECT') {
                // Transition to Date
                const subjectName = text.trim();
                let subjectId = "";
                let finalSubjectName = subjectName;

                // Try to find subject
                const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`)
                    .where("name", "==", subjectName)
                    .limit(1)
                    .get();

                if (!subjectsSnapshot.empty) {
                    subjectId = subjectsSnapshot.docs[0].id;
                    finalSubjectName = subjectsSnapshot.docs[0].data().name;
                } else {
                    const newSubjectRef = await db.collection(`users/${userUid}/subjects`).add({
                        name: subjectName,
                        color: "bg-gray-500",
                        createdAt: new Date().toISOString(),
                        lastUpdated: "Just now"
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
                const parsedDate = chrono.parseDate(text);

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
