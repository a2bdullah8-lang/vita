import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  Firestore,
} from 'firebase/firestore';
import bundledConfig from '../../firebase-applet-config.json';
import { UserProfile, DailyEntry, UserReminder, MealItem, WorkoutEntry } from '../types';
import { getLocalDateKey } from './calculations';

// 1. Resolve configuration from VITE_FIREBASE_* environment variables or fallback to bundled config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || bundledConfig?.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || bundledConfig?.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || bundledConfig?.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || bundledConfig?.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || bundledConfig?.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || bundledConfig?.appId || '',
};

// Database ID: read from VITE_FIREBASE_DATABASE_ID or bundled config (defaults to '(default)')
const targetDatabaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  bundledConfig?.firestoreDatabaseId ||
  'ai-studio-vitaaesthetichea-c2dbe61c-f336-4c5b-9f24-1bd8a3116b9b' ||
  '(default)';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with Offline IndexedDB Persistence
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    targetDatabaseId !== '(default)' ? targetDatabaseId : undefined
  );
} catch {
  // If already initialized or persistent cache unsupported, fallback to standard getFirestore
  firestoreInstance =
    targetDatabaseId !== '(default)'
      ? getFirestore(app, targetDatabaseId)
      : getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Error handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -------------------------------------------------------------
// PROFILE PERSISTENCE (users/{uid}/profile or users/{uid})
// -------------------------------------------------------------

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    // Also check subcollection users/{uid}/profile/main just in case
    const subSnap = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
    if (subSnap.exists()) {
      return subSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load profile from Firestore:', err);
    // Offline local fallback
    const local = localStorage.getItem(`vita_profile_${uid}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  // Save locally first for instant UI response & offline support
  localStorage.setItem(`vita_profile_${profile.uid}`, JSON.stringify(profile));

  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    // Also keep users/{uid}/profile/main synchronized
    await setDoc(doc(db, 'users', profile.uid, 'profile', 'main'), profile, { merge: true });
  } catch (err) {
    console.warn('Firestore offline or write deferred:', err);
  }
}

// -------------------------------------------------------------
// DAILY TRACKING PERSISTENCE (users/{uid}/days/{YYYY-MM-DD})
// -------------------------------------------------------------

export function createEmptyDailyEntry(userId: string, dateKey: string): DailyEntry {
  return {
    id: dateKey,
    userId,
    date: dateKey,
    caloriesConsumed: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    meals: [],
    workouts: [],
    workoutCaloriesBurned: 0,
    steps: 0,
    stepCaloriesBurned: 0,
    totalCaloriesBurned: 0,
    waterMl: 0,
    weight: null,
    note: '',
    updatedAt: new Date().toISOString(),
  };
}

export async function loadDailyEntry(uid: string, dateKey: string): Promise<DailyEntry> {
  const localKey = `vita_day_${uid}_${dateKey}`;
  const localData = localStorage.getItem(localKey);

  try {
    const snap = await getDoc(doc(db, 'users', uid, 'days', dateKey));
    if (snap.exists()) {
      const data = snap.data() as DailyEntry;
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn(`Could not load daily entry for ${dateKey} from Firestore:`, err);
  }

  // Return local storage if present
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch {
      // fallback
    }
  }

  // Fresh empty day document
  const empty = createEmptyDailyEntry(uid, dateKey);
  return empty;
}

export async function saveDailyEntry(entry: DailyEntry): Promise<void> {
  const localKey = `vita_day_${entry.userId}_${entry.date}`;
  localStorage.setItem(localKey, JSON.stringify(entry));

  try {
    await setDoc(doc(db, 'users', entry.userId, 'days', entry.date), entry);
  } catch (err) {
    console.warn(`Daily entry write deferred for ${entry.date}:`, err);
  }
}

export async function loadRecentDailyEntries(uid: string, limitDays: number = 30): Promise<DailyEntry[]> {
  const path = `users/${uid}/days`;
  try {
    const q = query(collection(db, 'users', uid, 'days'), orderBy('date', 'desc'), limit(limitDays));
    const snap = await getDocs(q);
    const results: DailyEntry[] = [];
    snap.forEach((d) => {
      results.push(d.data() as DailyEntry);
    });
    // Sort chronologically ascending
    results.sort((a, b) => a.date.localeCompare(b.date));
    return results;
  } catch (err) {
    console.warn('Could not query recent days from Firestore, checking localStorage:', err);
    // Find all stored days in localStorage
    const localEntries: DailyEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`vita_day_${uid}_`)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) || '');
          if (parsed && parsed.date) {
            localEntries.push(parsed);
          }
        } catch {
          // ignore
        }
      }
    }
    localEntries.sort((a, b) => a.date.localeCompare(b.date));
    return localEntries.slice(-limitDays);
  }
}

// -------------------------------------------------------------
// USER REMINDERS PERSISTENCE (users/{uid}/reminders/{reminderId})
// -------------------------------------------------------------

export async function loadUserReminders(uid: string): Promise<UserReminder[]> {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'reminders'));
    const reminders: UserReminder[] = [];
    snap.forEach((d) => reminders.push(d.data() as UserReminder));
    reminders.sort((a, b) => a.time.localeCompare(b.time));
    localStorage.setItem(`vita_reminders_${uid}`, JSON.stringify(reminders));
    return reminders;
  } catch (err) {
    const local = localStorage.getItem(`vita_reminders_${uid}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function saveUserReminder(reminder: UserReminder): Promise<void> {
  const localReminders = await loadUserReminders(reminder.userId);
  const idx = localReminders.findIndex((r) => r.id === reminder.id);
  if (idx >= 0) {
    localReminders[idx] = reminder;
  } else {
    localReminders.push(reminder);
  }
  localStorage.setItem(`vita_reminders_${reminder.userId}`, JSON.stringify(localReminders));

  try {
    await setDoc(doc(db, 'users', reminder.userId, 'reminders', reminder.id), reminder);
  } catch (err) {
    console.warn('Deferred reminder save:', err);
  }
}

export async function deleteUserReminder(uid: string, reminderId: string): Promise<void> {
  const localReminders = (await loadUserReminders(uid)).filter((r) => r.id !== reminderId);
  localStorage.setItem(`vita_reminders_${uid}`, JSON.stringify(localReminders));

  try {
    await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
  } catch (err) {
    console.warn('Deferred reminder delete:', err);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------

export async function loginWithGoogle(): Promise<User> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (err) {
    console.error('Google Sign In Error:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
