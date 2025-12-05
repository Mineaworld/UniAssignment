import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        } as admin.ServiceAccount),
    });
}

const db = admin.firestore();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Send message via Telegram API
async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        })
    });
}

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

        // Handle /start command
        if (text.startsWith('/start')) {
            const parts = text.split(' ');
            if (parts.length > 1) {
                const userUid = parts[1]; // Firebase UID from deep link

                // Store the link in Firestore
                await db.collection('telegramLinks').doc(userUid).set({
                    chatId: chatId,
                    linkedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                await sendTelegramMessage(chatId,
                    '✅ <b>Account Linked Successfully!</b>\n\n' +
                    'You will now receive notifications for your upcoming assignments.\n\n' +
                    'Use /assignments to view your current tasks.'
                );
            } else {
                await sendTelegramMessage(chatId,
                    '👋 <b>Welcome to UniAssignment Bot!</b>\n\n' +
                    'To link your account, please use the link from your web app Settings page.\n\n' +
                    'Commands:\n' +
                    '/assignments - View your assignments\n' +
                    '/help - Get help'
                );
            }
        }

        // Handle /assignments command
        else if (text === '/assignments') {
            // Find the user linked to this chat
            const linksSnapshot = await db.collection('telegramLinks')
                .where('chatId', '==', chatId)
                .limit(1)
                .get();

            if (linksSnapshot.empty) {
                await sendTelegramMessage(chatId,
                    '❌ Your account is not linked yet.\n\n' +
                    'Please link your account from the web app Settings page first.'
                );
                return res.status(200).send('OK');
            }

            const linkDoc = linksSnapshot.docs[0];
            const userUid = linkDoc.id;

            // Fetch assignments
            const assignmentsSnapshot = await db
                .collection(`users/${userUid}/assignments`)
                .orderBy('dueDate', 'asc')
                .limit(10)
                .get();

            if (assignmentsSnapshot.empty) {
                await sendTelegramMessage(chatId, '📚 You have no assignments yet!');
            } else {
                let message = '📚 <b>Your Assignments:</b>\n\n';
                assignmentsSnapshot.docs.forEach((doc, index) => {
                    const data = doc.data();
                    const dueDate = new Date(data.dueDate).toLocaleDateString();
                    const statusEmoji = data.status === 'Completed' ? '✅' :
                        data.status === 'In Progress' ? '🔄' : '⏳';
                    message += `${index + 1}. ${statusEmoji} <b>${data.title}</b>\n`;
                    message += `   📅 Due: ${dueDate}\n\n`;
                });
                await sendTelegramMessage(chatId, message);
            }
        }

        // Handle /help command
        else if (text === '/help') {
            await sendTelegramMessage(chatId,
                '📖 <b>UniAssignment Bot Help</b>\n\n' +
                'This bot helps you track your university assignments.\n\n' +
                '<b>Commands:</b>\n' +
                '/assignments - View your upcoming assignments\n' +
                '/help - Show this help message\n\n' +
                'Link your account from the web app to get started!'
            );
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return res.status(500).send('Error');
    }
}
