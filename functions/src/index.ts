import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

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
async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const token = getTelegramToken();
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "HTML"
        })
    });

    if (!response.ok) {
        console.error("Failed to send Telegram message:", await response.text());
    }
}

// --- WEBHOOK: Handle Telegram Bot Commands ---
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

        // Handle /start command - link Telegram to Firebase user
        if (text.startsWith("/start")) {
            const parts = text.split(" ");
            if (parts.length > 1) {
                const linkToken = parts[1]; // e.g., /start abc123 where abc123 is the user's Firebase UID

                // Store the link in Firestore
                await db.collection("telegramLinks").doc(linkToken).set({
                    chatId: chatId,
                    telegramUserId: userId,
                    linkedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                await sendTelegramMessage(chatId,
                    "✅ <b>Account Linked Successfully!</b>\n\n" +
                    "You will now receive notifications for your upcoming assignments.\n\n" +
                    "Use /assignments to view your current tasks."
                );
            } else {
                await sendTelegramMessage(chatId,
                    "👋 <b>Welcome to UniAssignment Bot!</b>\n\n" +
                    "To link your account, please use the link from your web app.\n\n" +
                    "Commands:\n" +
                    "/assignments - View your assignments\n" +
                    "/help - Get help"
                );
            }
        }

        // Handle /assignments command
        else if (text === "/assignments") {
            // Find the user linked to this chat
            const linksSnapshot = await db.collection("telegramLinks")
                .where("chatId", "==", chatId)
                .limit(1)
                .get();

            if (linksSnapshot.empty) {
                await sendTelegramMessage(chatId,
                    "❌ Your account is not linked yet.\n\n" +
                    "Please link your account from the web app first."
                );
                res.status(200).send("OK");
                return;
            }

            const linkDoc = linksSnapshot.docs[0];
            const userUid = linkDoc.id;

            // Fetch assignments
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
                    message += `   📅 Due: ${dueDate}\n\n`;
                });
                await sendTelegramMessage(chatId, message);
            }
        }

        // Handle /help command
        else if (text === "/help") {
            await sendTelegramMessage(chatId,
                "📖 <b>UniAssignment Bot Help</b>\n\n" +
                "This bot helps you track your university assignments.\n\n" +
                "<b>Commands:</b>\n" +
                "/assignments - View your upcoming assignments\n" +
                "/help - Show this help message\n\n" +
                "You will automatically receive notifications when assignments are due soon!"
            );
        }

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
                message += `📌 <b>${data.title}</b>\n`;
                message += `   ⏰ ${hoursLeft} hours left\n\n`;
            });

            await sendTelegramMessage(chatId, message);
        }
    }

    console.log("Deadline check complete.");
});
