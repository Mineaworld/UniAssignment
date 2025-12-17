
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { Assignment, AppContextType, Subject, User, Status } from './types';
import { INITIAL_ASSIGNMENTS, INITIAL_SUBJECTS, INITIAL_USER } from './constants';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persist user session simulation
  const [user, setUser] = useState<User | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramLinkedAt, setTelegramLinkedAt] = useState<string | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('uni_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('uni_theme', theme);
  }, [theme]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [loading, setLoading] = useState(true);

  // Sync user profile from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUser(prev => prev ? { ...prev, ...doc.data() } as User : null);
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Init with basic data, but don't overwrite potential existing data if possible, 
        // essentially we wait for the Firestore listener to populate the full profile.
        // We set a temporary state or rely on the listener.
        // However, to avoid 'null' flash, we set basic info.
        setUser(prev => {
          if (prev?.uid === firebaseUser.uid) return prev; // Don't reset if already loaded
          return {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Student',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || 'https://ui-avatars.com/api/?name=Student',
            major: 'Loading...', // Indicate loading state
            telegramLinked: false,
            telegramLinkedAt: null
          };
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

  // Fetch Data
  useEffect(() => {
    if (!user?.uid) return;

    // Subjects
    const subjectsQuery = query(collection(db, `users/${user.uid}/subjects`), orderBy('createdAt', 'desc'));
    const unsubscribeSubjects = onSnapshot(subjectsQuery, (snapshot) => {
      const fetchedSubjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
      setSubjects(fetchedSubjects);
    });

    // Assignments
    const assignmentsQuery = query(collection(db, `users/${user.uid}/assignments`), orderBy('dueDate', 'asc'));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
      const fetchedAssignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      setAssignments(fetchedAssignments);
    });

    return () => {
      unsubscribeSubjects();
      unsubscribeAssignments();
    };
  }, [user?.uid]);

  // Real-time Telegram link status listener
  useEffect(() => {
    if (!user?.uid) return;

    const telegramLinkRef = doc(db, 'telegramLinks', user.uid);

    const unsubscribeTelegram = onSnapshot(telegramLinkRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const linkedAt = data.linkedAt?.toDate?.()?.toISOString() || data.linkedAt || null;

        // Only trigger update if status changed
        if (!telegramLinked) {
          setTelegramLinked(true);
          setTelegramLinkedAt(linkedAt);

          // Update user object with telegram status
          setUser(prev => prev ? {
            ...prev,
            telegramLinked: true,
            telegramLinkedAt: linkedAt
          } : null);
        }
      } else {
        if (telegramLinked) {
          setTelegramLinked(false);
          setTelegramLinkedAt(null);

          setUser(prev => prev ? {
            ...prev,
            telegramLinked: false,
            telegramLinkedAt: null
          } : null);
        }
      }
    });

    return () => unsubscribeTelegram();
  }, [user?.uid, telegramLinked]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (name: string, email: string, password: string, major?: string, avatarFile?: File) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    let photoURL = result.user.photoURL;

    if (avatarFile) {
      const storageRef = ref(storage, `profile_pictures/${result.user.uid}`);
      await uploadBytes(storageRef, avatarFile);
      photoURL = await getDownloadURL(storageRef);
    }

    await updateProfile(result.user, {
      displayName: name,
      photoURL: photoURL
    });

    const userData: User = {
      uid: result.user.uid,
      name,
      email,
      major: major || 'Undeclared',
      avatar: photoURL || `https://ui-avatars.com/api/?name=${name}`,
      telegramLinked: false,
      telegramLinkedAt: null
    };

    await setDoc(doc(db, 'users', result.user.uid), userData);

    // Force update local state to show name immediately
    setUser(userData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addAssignment = async (assignment: Omit<Assignment, 'id' | 'createdAt'>) => {
    if (!user?.uid) return;
    await addDoc(collection(db, `users/${user.uid}/assignments`), {
      ...assignment,
      createdAt: new Date().toISOString()
    });
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    if (!user?.uid) return;
    const docRef = doc(db, `users/${user.uid}/assignments`, id);
    await updateDoc(docRef, updates);
  };

  const deleteAssignment = async (id: string) => {
    if (!user?.uid) return;
    await deleteDoc(doc(db, `users/${user.uid}/assignments`, id));
  };

  const addSubject = async (subject: Omit<Subject, 'id' | 'lastUpdated'>) => {
    if (!user?.uid) return;
    await addDoc(collection(db, `users/${user.uid}/subjects`), {
      ...subject,
      createdAt: new Date().toISOString(),
      lastUpdated: 'Just now'
    });
  };

  const deleteSubject = async (id: string) => {
    if (!user?.uid) return;
    await deleteDoc(doc(db, `users/${user.uid}/subjects`, id));
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    if (!user?.uid) return;
    const docRef = doc(db, `users/${user.uid}/subjects`, id);
    await updateDoc(docRef, {
      ...updates,
      lastUpdated: 'Just now' // Automatically update the lastUpdated field
    });
  };

  const updateUserProfile = async (updates: Partial<User>, avatarFile?: File) => {
    if (!user?.uid) return;

    let newAvatarUrl = updates.avatar;

    if (avatarFile) {
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(storageRef, avatarFile);
      newAvatarUrl = await getDownloadURL(storageRef);
    }

    const firestoreUpdates = { ...updates };
    if (newAvatarUrl) firestoreUpdates.avatar = newAvatarUrl;

    await setDoc(doc(db, 'users', user.uid), firestoreUpdates, { merge: true });

    if (auth.currentUser) {
      if (updates.name || newAvatarUrl) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name || auth.currentUser.displayName,
          photoURL: newAvatarUrl || auth.currentUser.photoURL
        });
      }
    }

    setUser(prev => prev ? { ...prev, ...firestoreUpdates } : null);
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      assignments,
      subjects,
      theme,
      toggleTheme,
      login,
      signup,
      logout,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      addSubject,
      updateSubject,
      deleteSubject,
      updateUserProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
