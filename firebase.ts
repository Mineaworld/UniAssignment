import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzlG24tOnrBaJHi7-Og5k5AXAa0k6BSyk",
    authDomain: "uni-assignment-f0fbe.firebaseapp.com",
    projectId: "uni-assignment-f0fbe",
    storageBucket: "uni-assignment-f0fbe.firebasestorage.app",
    messagingSenderId: "417507225282",
    appId: "1:417507225282:web:7298b6b425ac59aa58555b",
    measurementId: "G-XR12XH5438"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
