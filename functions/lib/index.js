"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDeadlines = exports.telegramWebhook = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const chrono = __importStar(require("chrono-node"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// --- CONFIG ---
// Define the bot token as a parameter (will read from .env or Firebase secrets)
const telegramBotToken = (0, params_1.defineString)("TELEGRAM_BOT_TOKEN");
// --- CONSTANTS ---
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const PRESET_TO_MINUTES = {
    '1h': 60,
    '6h': 360,
    '1d': 1440,
    '3d': 4320,
    '1w': 10080,
};
// --- HELPER: Get Telegram Token ---
function getTelegramToken() {
    try {
        return telegramBotToken.value();
    }
    catch (_a) {
        return process.env.TELEGRAM_BOT_TOKEN || "";
    }
}
// --- HELPER: Send Telegram Message ---
async function sendTelegramMessage(chatId, text, keyboard) {
    const token = getTelegramToken();
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: "HTML"
    };
    if (keyboard) {
        body.reply_markup = keyboard;
    }
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        console.error("Failed to send Telegram message:", await response.text());
    }
}
// --- HELPER: Format time before due (human-readable) ---
function formatTimeBeforeDue(hours) {
    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes < 60) {
        // Less than 1 hour: "X minutes"
        return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
    }
    if (hours < 24) {
        // Between 1-24 hours: "X hours Y minutes"
        const wholeHours = Math.floor(hours);
        const remainingMinutes = totalMinutes % 60;
        if (remainingMinutes === 0) {
            return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
        }
        return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    // 24+ hours: "X days Y hours Z minutes"
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const remainingMinutes = totalMinutes % 60;
    const parts = [];
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (remainingHours > 0) {
        parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
    }
    if (remainingMinutes > 0) {
        parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
    }
    return parts.join(' ');
}
// --- HELPER: Calculate Reminder Time ---
function calculateReminderTime(dueDate, reminder) {
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
// --- HELPER: Send Reminder Notification ---
async function sendReminderNotification(chatId, assignment) {
    const { dueDate, title, reminder } = assignment;
    if (!reminder)
        return;
    const reminderTime = calculateReminderTime(dueDate, reminder);
    if (!reminderTime)
        return;
    const timeDiff = new Date(dueDate).getTime() - reminderTime.getTime();
    const hoursBefore = timeDiff / MS_PER_HOUR;
    const timeText = formatTimeBeforeDue(hoursBefore);
    // Format due date with explicit locale for consistency
    const dueDateTime = new Date(dueDate);
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    const message = `🔔 <b>Reminder!</b>\n\n` +
        `<b>${title}</b> is due in ${timeText}.\n` +
        `📅 Due: ${dateFormatter.format(dueDateTime)} at ${timeFormatter.format(dueDateTime)}`;
    await sendTelegramMessage(chatId, message);
}
async function getState(chatId) {
    const doc = await db.collection("telegramStates").doc(chatId).get();
    return doc.exists ? doc.data() : null;
}
async function startState(chatId, uid, step) {
    await db.collection("telegramStates").doc(chatId).set({
        step,
        data: {},
        uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
}
async function updateState(chatId, step, data) {
    await db.collection("telegramStates").doc(chatId).set({
        step,
        data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}
async function clearState(chatId) {
    await db.collection("telegramStates").doc(chatId).delete();
}
// --- HANDLERS ---
async function handleStartIdentifier(chatId, userId, text) {
    var _a, _b, _c;
    const parts = text.split(" ");
    const linkToken = parts[1];
    if (parts.length > 1 && linkToken) {
        // Validate the temporary token and get the associated UID
        const tokenDoc = await db.collection("telegramLinkTokens").doc(linkToken).get();
        if (!tokenDoc.exists) {
            // Token doesn't exist - could be expired or invalid
            await sendTelegramMessage(chatId, "⚠️ <b>Invalid or Expired Link</b>\n\n" +
                "This link has expired or is invalid. Please generate a new link from the UniAssignment web app settings.");
            return;
        }
        const tokenData = tokenDoc.data();
        const expiresAt = (_c = (_b = (_a = tokenData === null || tokenData === void 0 ? void 0 : tokenData.expiresAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : new Date(0);
        // Check if token has expired
        if (new Date() > expiresAt) {
            // Clean up expired token
            await db.collection("telegramLinkTokens").doc(linkToken).delete();
            await sendTelegramMessage(chatId, "⚠️ <b>Link Expired</b>\n\n" +
                "This link has expired. Please generate a new link from the UniAssignment web app settings.");
            return;
        }
        const userUid = tokenData === null || tokenData === void 0 ? void 0 : tokenData.uid;
        // Token is valid - delete it (one-time use) and create the link
        await db.collection("telegramLinkTokens").doc(linkToken).delete();
        // Create the Telegram link with the actual UID
        await db.collection("telegramLinks").doc(userUid).set({
            chatId: chatId,
            telegramUserId: userId,
            linkedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await sendTelegramMessage(chatId, "✅ <b>Account Linked Successfully!</b>\n\n" +
            "Use /add to add a new assignment.\n" +
            "Use /assignments to view tasks.");
    }
    else {
        await sendTelegramMessage(chatId, "👋 <b>Welcome to UniAssignment Bot!</b>\n\n" +
            "Please link your account from the web app first.");
    }
}
async function handleAssignmentsCommand(chatId, userUid) {
    const assignmentsSnapshot = await db
        .collection(`users/${userUid}/assignments`)
        .orderBy("dueDate", "asc")
        .limit(10)
        .get();
    if (assignmentsSnapshot.empty) {
        await sendTelegramMessage(chatId, "📚 You have no assignments yet!");
    }
    else {
        let message = "📚 <b>Your Assignments:</b>\n\n";
        assignmentsSnapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            const dueDate = new Date(data.dueDate).toLocaleDateString();
            const statusEmoji = data.status === "Completed" ? "✅" :
                data.status === "In Progress" ? "🔄" : "⏳";
            message += `${index + 1}. ${statusEmoji} <b>${data.title}</b>\n`;
            message += `   📅 ${dueDate}\n\n`;
        });
        await sendTelegramMessage(chatId, message);
    }
}
async function handleHelpCommand(chatId) {
    await sendTelegramMessage(chatId, "<b>Commands:</b>\n" +
        "/add - Add a new assignment\n" +
        "/assignments - View upcoming tasks\n" +
        "/cancel - Cancel current action");
}
// --- STATE HANDLERS ---
async function handleTitleStep(chatId, userUid, text) {
    await updateState(chatId, 'AWAITING_SUBJECT', { title: text.trim(), subjectName: "" }); // Reset subject
    // Fetch subjects to show as buttons or list
    const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`).get();
    const subjects = subjectsSnapshot.docs.map(d => d.data().name);
    let msg = `📝 Title: <b>${text}</b>\n\nNow, exactly <b>which subject</b> is this for?\n`;
    if (subjects.length > 0) {
        msg += `\nExisting subjects:\n- ${subjects.join("\n- ")}`;
    }
    await sendTelegramMessage(chatId, msg);
}
async function handleSubjectStep(chatId, userUid, text, currentState) {
    const subjectName = text.trim();
    let subjectId = "";
    let finalSubjectName = subjectName;
    // Try to find subject
    const subjectsSnapshot = await db.collection(`users/${userUid}/subjects`)
        .where("name", "==", subjectName)
        .limit(1)
        .get();
    const firstDoc = subjectsSnapshot.docs[0];
    if (!subjectsSnapshot.empty && firstDoc) {
        subjectId = firstDoc.id;
        finalSubjectName = firstDoc.data().name;
    }
    else {
        // Create new subject automatically
        const newSubjectRef = await db.collection(`users/${userUid}/subjects`).add({
            name: subjectName,
            color: "bg-blue-500",
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        subjectId = newSubjectRef.id;
    }
    await updateState(chatId, 'AWAITING_DUE_DATE', Object.assign(Object.assign({}, currentState.data), { subjectName: finalSubjectName, subjectId }));
    await sendTelegramMessage(chatId, `📚 Subject: <b>${finalSubjectName}</b>\n\n` +
        `Finally, <b>when is it due?</b>\n` +
        `(e.g., "next Friday", "tomorrow", "Dec 25")`);
}
async function handleDueDateStep(chatId, userUid, text, currentState) {
    const parsedDate = chrono.parseDate(text);
    if (!parsedDate) {
        await sendTelegramMessage(chatId, "⚠️ I couldn't understand that date. Please try again (e.g., 'tomorrow', 'next Monday').");
        return;
    }
    // Everything valid, create assignment
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
    await sendTelegramMessage(chatId, `✅ <b>Assignment Added!</b>\n\n` +
        `📝 ${assignmentData.title}\n` +
        `📅 ${parsedDate.toLocaleDateString()}\n` +
        `📚 ${currentState.data.subjectName}`);
}
// --- MAIN WEBHOOK ---
exports.telegramWebhook = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b;
    // Security: Verify Telegram webhook secret token
    // This header is set by Telegram when you register the webhook with a secret_token
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
        const providedSecret = req.headers['x-telegram-bot-api-secret-token'];
        if (providedSecret !== webhookSecret) {
            console.warn('Unauthorized webhook request - invalid secret token');
            res.status(401).send('Unauthorized');
            return;
        }
    }
    try {
        const update = req.body;
        if (!update.message) {
            res.status(200).send("OK");
            return;
        }
        const chatId = update.message.chat.id.toString();
        const text = update.message.text || "";
        const userId = (_b = (_a = update.message.from) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString();
        // 1. Handle /start (doesn't require checking link first)
        if (text.startsWith("/start")) {
            await handleStartIdentifier(chatId, userId, text);
            res.status(200).send("OK");
            return;
        }
        // 2. Check Link Status
        const linksSnapshot = await db.collection("telegramLinks")
            .where("chatId", "==", chatId)
            .limit(1)
            .get();
        if (linksSnapshot.empty) {
            await sendTelegramMessage(chatId, "⚠️ Please link your account from the web app first.");
            res.status(200).send("OK");
            return;
        }
        const linkDoc = linksSnapshot.docs[0];
        if (!linkDoc) {
            await sendTelegramMessage(chatId, "⚠️ Please link your account from the web app first.");
            res.status(200).send("OK");
            return;
        }
        const userUid = linkDoc.id;
        // 3. Handle Global Commands
        if (text === "/cancel") {
            await clearState(chatId);
            await sendTelegramMessage(chatId, "🚫 Action cancelled.");
            res.status(200).send("OK");
            return;
        }
        if (text === "/help") {
            await handleHelpCommand(chatId);
            res.status(200).send("OK");
            return;
        }
        if (text === "/assignments") {
            await handleAssignmentsCommand(chatId, userUid);
            res.status(200).send("OK");
            return;
        }
        // 4. Handle Conversation Flow
        const currentState = await getState(chatId);
        if (currentState) {
            switch (currentState.step) {
                case 'AWAITING_TITLE':
                    await handleTitleStep(chatId, userUid, text);
                    break;
                case 'AWAITING_SUBJECT':
                    await handleSubjectStep(chatId, userUid, text, currentState);
                    break;
                case 'AWAITING_DUE_DATE':
                    await handleDueDateStep(chatId, userUid, text, currentState);
                    break;
            }
            res.status(200).send("OK");
            return;
        }
        // 5. Start New Flow
        if (text === "/add") {
            await startState(chatId, userUid, 'AWAITING_TITLE');
            await sendTelegramMessage(chatId, "🆕 <b>New Assignment</b>\n\nFirst, what is the <b>title</b> of the assignment?");
            res.status(200).send("OK");
            return;
        }
        // 6. Fallback
        await sendTelegramMessage(chatId, "❓ Unknown command. Use /add to create an assignment or /help for more info.");
        res.status(200).send("OK");
    }
    catch (error) {
        console.error("Telegram webhook error:", error);
        res.status(500).send("Error");
    }
});
// --- SCHEDULED: Check for upcoming deadlines and send notifications ---
exports.checkDeadlines = (0, scheduler_1.onSchedule)("every 15 minutes", async () => {
    var _a;
    console.log("Checking for reminders...");
    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000); // 15 min ago (catch-up)
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 min ahead
    // Get all users with linked Telegram
    const linksSnapshot = await db.collection("telegramLinks").get();
    for (const linkDoc of linksSnapshot.docs) {
        const userUid = linkDoc.id;
        const chatId = linkDoc.data().chatId;
        // Get assignments with enabled reminders
        // Note: Filter out Completed assignments in JavaScript to avoid
        // Firestore inequality + orderBy constraint if we add sorting later
        const assignmentsSnapshot = await db
            .collection(`users/${userUid}/assignments`)
            .where("reminder.enabled", "==", true)
            .get();
        for (const doc of assignmentsSnapshot.docs) {
            const assignment = doc.data();
            // Skip completed assignments
            if (assignment.status === "Completed")
                continue;
            // Skip if already sent
            if ((_a = assignment.reminder) === null || _a === void 0 ? void 0 : _a.sentAt)
                continue;
            // Calculate reminder time
            const reminderTime = calculateReminderTime(assignment.dueDate, assignment.reminder);
            if (!reminderTime)
                continue;
            // Check if reminder time is within execution window
            if (reminderTime >= windowStart && reminderTime <= windowEnd) {
                await sendReminderNotification(chatId, assignment);
                // Mark as sent
                await doc.ref.update({
                    "reminder.sentAt": now.toISOString()
                });
            }
        }
    }
    console.log("Reminder check complete.");
});
//# sourceMappingURL=index.js.map
