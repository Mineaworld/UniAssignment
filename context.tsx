import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  getDoc,
  setDoc,
  deleteField
} from 'firebase/firestore';
import { Assignment, AppContextType, Subject, User } from './types';

// ============================================================================
// Types & Constants
// ============================================================================

interface FirebaseError {
  code: string;
  message: string;
}

const UI_AVATARS_BASE_URL = 'https://ui-avatars.com/api/?name=';

const DEFAULT_USER: User = {
  uid: '',
  name: 'Student',
  email: '',
  avatar: `${UI_AVATARS_BASE_URL}Student`,
  major: 'Undeclared',
  telegramLinked: false,
  telegramLinkedAt: null,
  telegramPromptLastShown: null,
  telegramPromptDismissed: false,
};

// ============================================================================
// Context Setup
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // =========================================================================
  // State
  // =========================================================================

  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getInitialTheme());

  // =========================================================================
  // Theme Management
  // =========================================================================

  function getInitialTheme(): 'dark' | 'light' {
    const saved = localStorage.getItem('uni_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    localStorage.setItem('uni_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // =========================================================================
  // Auth State Management
  // =========================================================================

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || DEFAULT_USER.name,
          email: firebaseUser.email || DEFAULT_USER.email,
          avatar: firebaseUser.photoURL || `${UI_AVATARS_BASE_URL}${encodeURIComponent(firebaseUser.displayName || 'Student')}`,
          major: 'Loading...',
          telegramLinked: false,
          telegramLinkedAt: null,
          telegramPromptLastShown: null,
          telegramPromptDismissed: false,
        });
      } else {
        setUser(null);
        setAssignments([]);
        setSubjects([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // =========================================================================
  // User Profile Sync
  // =========================================================================

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUser(prev => prev ? {
            ...prev,
            uid: data.uid ?? prev.uid,
            name: data.name ?? prev.name,
            email: data.email ?? prev.email,
            avatar: data.avatar ?? prev.avatar,
            major: data.major ?? prev.major,
            telegramLinked: data.telegramLinked ?? prev.telegramLinked,
            telegramLinkedAt: data.telegramLinkedAt ?? prev.telegramLinkedAt,
            telegramPromptLastShown: data.telegramPromptLastShown ?? prev.telegramPromptLastShown,
            telegramPromptDismissed: data.telegramPromptDismissed ?? prev.telegramPromptDismissed,
          } : null);
        }
      },
      (error) => {
        console.error('Error fetching user profile:', error);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // =========================================================================
  // Data Fetching
  // =========================================================================

  useEffect(() => {
    if (!user?.uid) return;

    const subjectsQuery = query(
      collection(db, `users/${user.uid}/subjects`),
      orderBy('createdAt', 'desc')
    );
    const assignmentsQuery = query(
      collection(db, `users/${user.uid}/assignments`),
      orderBy('dueDate', 'asc')
    );

    const unsubscribeSubjects = onSnapshot(
      subjectsQuery,
      (snapshot) => {
        setSubjects(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Subject[]);
      },
      (error) => {
        console.error('Error fetching subjects:', error);
      }
    );

    const unsubscribeAssignments = onSnapshot(
      assignmentsQuery,
      (snapshot) => {
        setAssignments(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Assignment[]);
      },
      (error) => {
        console.error('Error fetching assignments:', error);
      }
    );

    return () => {
      unsubscribeSubjects();
      unsubscribeAssignments();
    };
  }, [user?.uid]);

  // =========================================================================
  // Telegram Link Status
  // =========================================================================

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'telegramLinks', user.uid),
      (snapshot) => {
        let linkedAt: string | null = null;

        if (snapshot.exists()) {
          const timestamp = snapshot.data()?.linkedAt;
          if (timestamp) {
            // Handle Firestore Timestamp
            if (typeof timestamp?.toDate === 'function') {
              linkedAt = timestamp.toDate().toISOString();
            }
            // Handle ISO string
            else if (typeof timestamp === 'string') {
              linkedAt = timestamp;
            }
            // Handle number (milliseconds)
            else if (typeof timestamp === 'number') {
              linkedAt = new Date(timestamp).toISOString();
            }
          }
        }

        const isLinked = snapshot.exists();

        setUser(prev => prev ? {
          ...prev,
          telegramLinked: isLinked,
          telegramLinkedAt: linkedAt,
        } : null);
      },
      (error) => {
        console.error('Error fetching Telegram link status:', error);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // =========================================================================
  // Authentication Functions
  // =========================================================================

  const getFirebaseErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again.',
      'auth/unauthorized-domain': 'This domain is not authorized. Contact support.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email. Sign in using your password.',
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      throw new Error(getFirebaseErrorMessage(firebaseError.code || 'auth/unknown'));
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const userData: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || DEFAULT_USER.name,
          email: firebaseUser.email || DEFAULT_USER.email,
          major: DEFAULT_USER.major,
          avatar: firebaseUser.photoURL || `${UI_AVATARS_BASE_URL}${encodeURIComponent(firebaseUser.displayName || 'Student')}`,
          telegramLinked: false,
          telegramLinkedAt: null,
          telegramPromptLastShown: null,
          telegramPromptDismissed: false,
        };
        await setDoc(userDocRef, userData);
        setUser(userData);
      } else {
        // User exists, update local state from Firestore
        const existingData = userDoc.data() as User;
        setUser(existingData);
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;
      throw new Error(getFirebaseErrorMessage(firebaseError.code || 'auth/unknown'));
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    major?: string,
    avatarFile?: File
  ): Promise<void> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      let photoURL = result.user.photoURL;

      if (avatarFile) {
        const storageRef = ref(storage, `profile_pictures/${result.user.uid}`);
        await uploadBytes(storageRef, avatarFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(result.user, {
        displayName: name,
        photoURL,
      });

      const userData: User = {
        uid: result.user.uid,
        name,
        email,
        major: major || DEFAULT_USER.major,
        avatar: photoURL || `${UI_AVATARS_BASE_URL}${encodeURIComponent(name)}`,
        telegramLinked: false,
        telegramLinkedAt: null,
        telegramPromptLastShown: null,
        telegramPromptDismissed: false,
      };

      await setDoc(doc(db, 'users', result.user.uid), userData);
      setUser(userData);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      throw new Error(getFirebaseErrorMessage(firebaseError.code || 'auth/unknown'));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  // =========================================================================
  // Assignment Operations
  // =========================================================================

  const addAssignment = async (assignment: Omit<Assignment, 'id' | 'createdAt'>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await addDoc(collection(db, `users/${user.uid}/assignments`), {
      ...assignment,
      createdAt: new Date().toISOString(),
    });
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    // Convert undefined values to deleteField() for proper Firestore field deletion
    const processedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      processedUpdates[key] = value === undefined ? deleteField() : value;
    }

    await updateDoc(doc(db, `users/${user.uid}/assignments`, id), processedUpdates);
  };

  const deleteAssignment = async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await deleteDoc(doc(db, `users/${user.uid}/assignments`, id));
  };

  // =========================================================================
  // Subject Operations
  // =========================================================================

  const addSubject = async (subject: Omit<Subject, 'id' | 'createdAt' | 'lastUpdated'>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await addDoc(collection(db, `users/${user.uid}/subjects`), {
      ...subject,
      createdAt: new Date().toISOString(),
      lastUpdated: 'Just now',
    });
  };

  const updateSubject = async (id: string, updates: Partial<Subject>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await updateDoc(doc(db, `users/${user.uid}/subjects`, id), {
      ...updates,
      lastUpdated: 'Just now',
    });
  };

  const deleteSubject = async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await deleteDoc(doc(db, `users/${user.uid}/subjects`, id));
  };

  // =========================================================================
  // User Profile Operations
  // =========================================================================

  const updateUserProfile = async (updates: Partial<User>, avatarFile?: File): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    let newAvatarUrl = updates.avatar;

    if (avatarFile) {
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(storageRef, avatarFile);
      newAvatarUrl = await getDownloadURL(storageRef);
    }

    const firestoreUpdates = { ...updates };
    if (newAvatarUrl) {
      firestoreUpdates.avatar = newAvatarUrl;
    }

    await setDoc(doc(db, 'users', user.uid), firestoreUpdates, { merge: true });

    if (auth.currentUser && (updates.name || newAvatarUrl)) {
      await updateProfile(auth.currentUser, {
        displayName: updates.name || auth.currentUser.displayName,
        photoURL: newAvatarUrl || auth.currentUser.photoURL,
      });
    }

    setUser(prev => prev ? { ...prev, ...firestoreUpdates } : null);
  };

  const dismissTelegramPrompt = async (permanent: boolean): Promise<void> => {
    if (!user?.uid) return;

    const updates: Partial<User> = {
      telegramPromptLastShown: new Date().toISOString(),
    };

    if (permanent) {
      updates.telegramPromptDismissed = true;
    }

    await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

    // Update local state immediately
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  // =========================================================================
  // Context Value
  // =========================================================================

  const value: AppContextType = {
    user,
    loading,
    assignments,
    subjects,
    theme,
    toggleTheme,
    login,
    loginWithGoogle,
    signup,
    logout,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addSubject,
    updateSubject,
    deleteSubject,
    updateUserProfile,
    dismissTelegramPrompt,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
