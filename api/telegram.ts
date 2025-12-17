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

// --- HELPER: Manage State ---
type BotStep = 'AWAITING_TITLE' | 'AWAITING_SUBJECT' | 'AWAITING_DUE_DATE';

interface BotState {
    step: BotStep;
    data: {
        title?: string;
        subjectName?: string;
        subjectId?: string;
    };
    uid: string;
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

// --- MAIN WEBHOOK HANDLER ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(200).json({ message: 'UniAssignment Bot Webhook Active' });
    }

    try {
        const update = req.body;
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
                "/assignments - View upcoming tasks\n" +
                "/cancel - Cancel current action"
            );
            return res.status(200).send('OK');
        }

        if (text === '/assignments') {
            await handleAssignmentsCommand(chatId, userUid);
            return res.status(200).send('OK');
        }

        // 4. Conversation State Machine
        const currentState = await getState(chatId);

        if (currentState) {
            if (currentState.step === 'AWAITING_TITLE') {
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
