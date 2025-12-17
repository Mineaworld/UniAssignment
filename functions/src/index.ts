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
export const checkDeadlines = onSchedule("every 1 hours", async () => {
    console.log("Checking for upcoming deadlines...");

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get all users with linked Telegram
    const linksSnapshot = await db.collection("telegramLinks").get();

    for (const linkDoc of linksSnapshot.docs) {
        const userUid = linkDoc.id;
        const chatId = linkDoc.data().chatId;

        // Get assignments due in the next 24 hours
        const assignmentsSnapshot = await db
            .collection(`users/${userUid}/assignments`)
            .where("dueDate", ">=", now.toISOString())
            .where("dueDate", "<=", in24Hours.toISOString())
            .where("status", "!=", "Completed")
            .get();

        if (!assignmentsSnapshot.empty) {
            let message = "⚠️ <b>Upcoming Deadlines!</b>\n\n";
            message += "The following assignments are due within 24 hours:\n\n";

            assignmentsSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                const dueDate = new Date(data.dueDate);
                const hoursLeft = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                const typePrefix = data.examType === 'midterm' ? "<b>[Midterm]</b> " :
                    data.examType === 'final' ? "<b>[Final]</b> " : "";

                message += `📌 ${typePrefix}<b>${data.title}</b>\n`;
                message += `   ⏰ ${hoursLeft} hours left\n\n`;
            });

            await sendTelegramMessage(chatId, message);
        }
    }

    console.log("Deadline check complete.");
});
