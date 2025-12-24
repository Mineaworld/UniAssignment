import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import * as chrono from "chrono-node";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// --- CONFIG ---
// Define the bot token as a parameter (will read from .env or Firebase secrets)
const telegramBotToken = defineString("TELEGRAM_BOT_TOKEN");

// Helper to get the token value
const getTelegramToken = (): string => {
    try {
        return telegramBotToken.value();
    } catch {
        return process.env.TELEGRAM_BOT_TOKEN || "";
    }
};

// --- HELPER: Send Telegram Message ---
async function sendTelegramMessage(chatId: string, text: string, keyboard?: any): Promise<void> {
    const token = getTelegramToken();
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const body: any = {
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

// --- HELPER: Calculate Reminder Time ---
function calculateReminderTime(dueDate: string, reminder: any): Date | null {
    const due = new Date(dueDate);
    const preset = reminder.preset;

    const presetMinutes: Record<string, number> = {
        '1h': 60,
        '6h': 360,
        '1d': 1440,
        '3d': 4320,
        '1w': 10080,
    };

    if (preset !== 'custom' && presetMinutes[preset]) {
        return new Date(due.getTime() - presetMinutes[preset] * 60 * 1000);
    }

    if (reminder.customTime) {
        return new Date(reminder.customTime);
    }

    if (reminder.customMinutes) {
        return new Date(due.getTime() - reminder.customMinutes * 60 * 1000);
    }

    return null;
}

// --- HELPER: Send Reminder Notification ---
async function sendReminderNotification(chatId: string, assignment: any): Promise<void> {
    const dueDate = new Date(assignment.dueDate);
    const reminder = assignment.reminder;
    const reminderTime = calculateReminderTime(assignment.dueDate, reminder)!;

    const timeDiff = dueDate.getTime() - reminderTime.getTime();
    const hoursBefore = Math.round(timeDiff / (1000 * 60 * 60));

    let timeText: string;
    if (hoursBefore < 1) {
        const minutesBefore = Math.round(timeDiff / (1000 * 60));
        timeText = `${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`;
    } else if (hoursBefore < 24) {
        timeText = `${hoursBefore} hour${hoursBefore !== 1 ? 's' : ''}`;
    } else {
        const daysBefore = Math.round(hoursBefore / 24);
        timeText = `${daysBefore} day${daysBefore !== 1 ? 's' : ''}`;
    }

    const message = `🔔 <b>Reminder!</b>\n\n` +
        `<b>${assignment.title}</b> is due in ${timeText}.\n` +
        `📅 Due: ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    await sendTelegramMessage(chatId, message);
}

// --- HELPER: Manage State ---
type BotStep = 'AWAITING_TITLE' | 'AWAITING_SUBJECT' | 'AWAITING_DUE_DATE';

interface BotState {
    step: BotStep;
    data: {
        title?: string;
        subjectName?: string;
        subjectId?: string;
    };
    uid: string; // The user's firebase UID
}

async function getState(chatId: string): Promise<BotState | null> {
    const doc = await db.collection("telegramStates").doc(chatId).get();
    return doc.exists ? (doc.data() as BotState) : null;
}

async function startState(chatId: string, uid: string, step: BotStep): Promise<void> {
    await db.collection("telegramStates").doc(chatId).set({
        step,
        data: {},
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

async function handleHelpCommand(chatId: string) {
    await sendTelegramMessage(chatId,
        "<b>Commands:</b>\n" +
        "/add - Add a new assignment\n" +
        "/assignments - View upcoming tasks\n" +
        "/cancel - Cancel current action"
    );
}

// --- STATE HANDLERS ---

async function handleTitleStep(chatId: string, userUid: string, text: string) {
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

async function handleSubjectStep(chatId: string, userUid: string, text: string, currentState: BotState) {
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
        // Create new subject automatically
        const newSubjectRef = await db.collection(`users/${userUid}/subjects`).add({
            name: subjectName,
            color: "bg-gray-500", // Default
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
}

async function handleDueDateStep(chatId: string, userUid: string, text: string, currentState: BotState) {
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

    await sendTelegramMessage(chatId,
        `✅ <b>Assignment Added!</b>\n\n` +
        `📝 ${assignmentData.title}\n` +
        `📅 ${parsedDate.toLocaleDateString()}\n` +
        `📚 ${currentState.data.subjectName}`
    );
}

// --- MAIN WEBHOOK ---

export const telegramWebhook = onRequest(async (req, res) => {
    try {
        const update = req.body;

        if (!update.message) {
            res.status(200).send("OK");
            return;
        }

        const chatId = update.message.chat.id.toString();
        const text = update.message.text || "";
        const userId = update.message.from?.id?.toString();

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

    } catch (error) {
        console.error("Telegram webhook error:", error);
        res.status(500).send("Error");
    }
});

// --- SCHEDULED: Check for upcoming deadlines and send notifications ---
export const checkDeadlines = onSchedule("every 15 minutes", async () => {
    console.log("Checking for reminders...");

    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);  // 15 min ago (catch-up)
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);     // 15 min ahead

    // Get all users with linked Telegram
    const linksSnapshot = await db.collection("telegramLinks").get();

    for (const linkDoc of linksSnapshot.docs) {
        const userUid = linkDoc.id;
        const chatId = linkDoc.data().chatId;

        // Get assignments with enabled reminders
        const assignmentsSnapshot = await db
            .collection(`users/${userUid}/assignments`)
            .where("status", "!=", "Completed")
            .where("reminder.enabled", "==", true)
            .get();

        for (const doc of assignmentsSnapshot.docs) {
            const assignment = doc.data();

            // Skip if already sent
            if (assignment.reminder?.sentAt) continue;

            // Calculate reminder time
            const reminderTime = calculateReminderTime(assignment.dueDate, assignment.reminder);
            if (!reminderTime) continue;

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
