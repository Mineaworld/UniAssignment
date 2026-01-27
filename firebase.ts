import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Validate required environment variables
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value || value === 'YOUR_' + Object.keys(requiredEnvVars)[0]?.toUpperCase() + '_HERE')
  .map(([key]) => `VITE_FIREBASE_${key.toUpperCase()}`);

if (missingVars.length > 0 && import.meta.env.DEV) {
  console.warn(
    `Warning: Missing Firebase environment variables: ${missingVars.join(', ')}. ` +
    'Check your .env.local file.'
  );
}

// Firebase configuration
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  projectId: requiredEnvVars.projectId,
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId,
};

// Initialize Firebase (singleton pattern)
const existingApps = getApps();
const app = existingApps.length === 0
  ? initializeApp(firebaseConfig)
  : existingApps[0]!;

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled only in first tab');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support offline persistence');
  }
});
