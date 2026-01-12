/**
 * Telegram Link Token Utility
 * 
 * Generates secure, temporary tokens for linking Telegram accounts.
 * This prevents exposure of raw Firebase UIDs in Telegram deep links.
 * 
 * Security: Tokens expire after 10 minutes and can only be used once.
 */

import { db } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const TOKEN_COLLECTION = 'telegramLinkTokens';
const TOKEN_EXPIRY_MINUTES = 10;

/**
 * Generates a cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a temporary link token for Telegram account linking
 * 
 * @param uid - The Firebase UID of the user
 * @returns The generated token to be used in the Telegram deep link
 */
export async function createTelegramLinkToken(uid: string): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
  
  await setDoc(doc(db, TOKEN_COLLECTION, token), {
    uid,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });
  
  return token;
}

/**
 * Validates and consumes a link token, returning the associated UID
 * 
 * @param token - The token to validate
 * @returns The Firebase UID if valid, null if expired or invalid
 */
export async function validateAndConsumeLinkToken(token: string): Promise<string | null> {
  const tokenDoc = await getDoc(doc(db, TOKEN_COLLECTION, token));
  
  if (!tokenDoc.exists()) {
    return null;
  }
  
  const data = tokenDoc.data();
  const expiresAt = data.expiresAt?.toDate?.() ?? new Date(0);
  
  // Check if token has expired
  if (new Date() > expiresAt) {
    // Clean up expired token
    await deleteDoc(doc(db, TOKEN_COLLECTION, token));
    return null;
  }
  
  // Token is valid - delete it (one-time use) and return the UID
  const uid = data.uid as string;
  await deleteDoc(doc(db, TOKEN_COLLECTION, token));
  
  return uid;
}

/**
 * Generates the Telegram deep link URL with a secure token
 * 
 * @param uid - The Firebase UID of the user
 * @returns The Telegram bot URL with the secure token
 */
export async function generateTelegramLinkUrl(uid: string): Promise<string> {
  const token = await createTelegramLinkToken(uid);
  return `https://t.me/UniAssignmentBot?start=${token}`;
}
