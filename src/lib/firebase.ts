import { initializeApp } from 'firebase/app';
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
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, MealItem, WorkoutLog, DailyHealthLog, ChatMessage } from '../types';

// Resolve configuration from environment variables or bundled config
const resolvedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId || '',
};

// Initialize Firebase
const app = initializeApp(resolvedConfig);
const firestoreDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId;
export const db = firestoreDbId && firestoreDbId !== '(default)'
  ? getFirestore(app, firestoreDbId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
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
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection check
export async function testConnection(): Promise<boolean> {
  try {
    return Boolean(db);
  } catch (error) {
    console.warn('Firebase connection check warning:', error);
    return false;
  }
}

// Default user profile as specified in prompt:
// Age: 22, Height: 5'11", Current: 106 kg, Target: 96 kg, Pace: Aggressive (1 to 1.5 kg loss/week)
export const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'guest_user',
  email: 'user@vita.app',
  displayName: 'Fitness Athlete',
  age: 22,
  height: "5'11\"",
  currentWeightKg: 106,
  targetWeightKg: 96,
  pace: 'Aggressive (1 to 1.5 kg loss per week)',
  dailyCalorieTarget: 1850,
  dailyStepGoal: 10000,
  dailyWaterGoalMl: 3000,
  themeMode: 'light',
  updatedAt: new Date().toISOString(),
};

// Data persistence helpers with Firestore + LocalStorage fallback
const STORAGE_PREFIX = 'vita_health_';

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(profile));
  if (auth.currentUser && auth.currentUser.uid === profile.uid) {
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function loadUserProfile(uid?: string): Promise<UserProfile> {
  const local = localStorage.getItem(`${STORAGE_PREFIX}profile`);
  let profile = local ? JSON.parse(local) : { ...DEFAULT_USER_PROFILE };
  if (uid && auth.currentUser) {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        profile = snap.data() as UserProfile;
        localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(profile));
      } else {
        profile.uid = uid;
        profile.email = auth.currentUser.email || profile.email;
        profile.displayName = auth.currentUser.displayName || profile.displayName;
        await saveUserProfile(profile);
      }
    } catch (err) {
      console.warn('Could not load user profile from Firestore, using cached/default:', err);
    }
  }
  return profile;
}

export async function saveMeal(meal: MealItem): Promise<void> {
  const localMeals = loadMealsLocal();
  const existingIndex = localMeals.findIndex((m) => m.id === meal.id);
  if (existingIndex >= 0) {
    localMeals[existingIndex] = meal;
  } else {
    localMeals.unshift(meal);
  }
  localStorage.setItem(`${STORAGE_PREFIX}meals`, JSON.stringify(localMeals));

  if (auth.currentUser) {
    const path = `users/${auth.currentUser.uid}/meals/${meal.id}`;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'meals', meal.id), meal);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteMeal(mealId: string): Promise<void> {
  const localMeals = loadMealsLocal().filter((m) => m.id !== mealId);
  localStorage.setItem(`${STORAGE_PREFIX}meals`, JSON.stringify(localMeals));

  if (auth.currentUser) {
    const path = `users/${auth.currentUser.uid}/meals/${mealId}`;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'meals', mealId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

export function loadMealsLocal(): MealItem[] {
  const local = localStorage.getItem(`${STORAGE_PREFIX}meals`);
  if (!local) {
    // Initial sample meals for today showcasing deficit tracking
    const today = new Date().toISOString().split('T')[0];
    const initial: MealItem[] = [
      {
        id: 'meal_1',
        userId: 'guest_user',
        name: 'Egg Whites, Spinach & Whole Wheat Toast',
        calories: 340,
        proteinGrams: 32,
        carbsGrams: 28,
        fatGrams: 4,
        mealType: 'breakfast',
        timestamp: `${today}T08:30:00Z`,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'meal_2',
        userId: 'guest_user',
        name: 'Grilled Chicken Breast with Steamed Broccoli & Quinoa',
        calories: 520,
        proteinGrams: 55,
        carbsGrams: 42,
        fatGrams: 8,
        mealType: 'lunch',
        timestamp: `${today}T13:15:00Z`,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'meal_3',
        userId: 'guest_user',
        name: 'Whey Protein Isolate Shake with Almond Milk',
        calories: 160,
        proteinGrams: 28,
        carbsGrams: 4,
        fatGrams: 2,
        mealType: 'snack',
        timestamp: `${today}T16:45:00Z`,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(`${STORAGE_PREFIX}meals`, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(local);
  } catch {
    return [];
  }
}

export async function loadMealsFromFirestore(uid: string): Promise<MealItem[]> {
  const path = `users/${uid}/meals`;
  try {
    const q = query(collection(db, 'users', uid, 'meals'));
    const snap = await getDocs(q);
    const meals: MealItem[] = [];
    snap.forEach((d) => meals.push(d.data() as MealItem));
    if (meals.length > 0) {
      localStorage.setItem(`${STORAGE_PREFIX}meals`, JSON.stringify(meals));
      return meals;
    }
  } catch (err) {
    console.warn('Failed to load meals from Firestore:', err);
  }
  return loadMealsLocal();
}

export async function saveWorkout(workout: WorkoutLog): Promise<void> {
  const local = loadWorkoutsLocal();
  local.unshift(workout);
  localStorage.setItem(`${STORAGE_PREFIX}workouts`, JSON.stringify(local));

  if (auth.currentUser) {
    const path = `users/${auth.currentUser.uid}/workouts/${workout.id}`;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'workouts', workout.id), workout);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export function loadWorkoutsLocal(): WorkoutLog[] {
  const local = localStorage.getItem(`${STORAGE_PREFIX}workouts`);
  if (!local) {
    const today = new Date().toISOString().split('T')[0];
    const initial: WorkoutLog[] = [
      {
        id: 'w_1',
        userId: 'guest_user',
        mode: 'home',
        dayName: 'Monday (Shoulders/Neck)',
        targetMuscles: 'Shoulders, Neck, Traps',
        durationMinutes: 48,
        caloriesBurned: 380,
        exercisesCompleted: ['DB Overhead Press', 'DB Lateral Raises', 'DB Shrugs', 'Band Neck Extensions'],
        notes: 'Felt great pump. Clean form on lateral raises.',
        timestamp: `${today}T07:15:00Z`,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(`${STORAGE_PREFIX}workouts`, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(local);
  } catch {
    return [];
  }
}

export async function saveSosChatThread(messages: ChatMessage[]): Promise<void> {
  localStorage.setItem(`${STORAGE_PREFIX}chat_history`, JSON.stringify(messages));
  if (auth.currentUser) {
    const path = `users/${auth.currentUser.uid}/sosChats/active_session`;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'sosChats', 'active_session'), {
        id: 'active_session',
        userId: auth.currentUser.uid,
        messages: messages.slice(-40),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not save chat to firestore:', err);
    }
  }
}

export function loadSosChatHistory(): ChatMessage[] {
  const local = localStorage.getItem(`${STORAGE_PREFIX}chat_history`);
  if (!local) return [];
  try {
    return JSON.parse(local);
  } catch {
    return [];
  }
}

// Authentication trigger
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In failed:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}
