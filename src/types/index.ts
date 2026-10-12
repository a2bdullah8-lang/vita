export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

export type DietType =
  | 'standard'
  | 'high_protein'
  | 'keto'
  | 'vegetarian'
  | 'vegan'
  | 'mediterranean';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  weeklyLossPace: number; // 0.25 to 1.0 kg/week
  dietType: DietType;
  workoutDaysPerWeek: number;
  // Computed metrics (Mifflin-St Jeor formula)
  bmr: number;
  tdee: number;
  dailyCalorieDeficit: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyWaterGoalMl: number;
  dailyStepGoal: number;
  onboardingCompleted: boolean;
  themeMode: 'light' | 'dark';
  createdAt?: string;
  updatedAt: string;
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string; // e.g. "08:30"
}

export interface WorkoutEntry {
  id: string;
  type: string; // e.g. "Upper Body Dumbbells", "Treadmill Walk", "Commercial Gym"
  durationMinutes: number;
  caloriesBurned: number;
  time: string;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  mode?: 'home' | 'gym';
  dayName?: string;
  targetMuscles?: string;
  durationMinutes: number;
  caloriesBurned: number;
  exercisesCompleted?: string[];
  notes?: string;
  timestamp: string;
  createdAt?: string;
}

export interface HealthSyncData {
  connected: boolean;
  lastSyncTime: string;
  steps: number;
  targetSteps: number;
  activeCalories: number;
  distanceKm: number;
  hourlySteps: number[];
  lastHourSteps: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  targetMuscle: string;
}

export interface WorkoutDayPlan {
  dayName: string;
  dayShort: string;
  dayIndex: number;
  title: string;
  focusMuscles: string;
  equipment: string[];
  estimatedDurationMin: number;
  targetCaloriesBurn: number;
  exercises: WorkoutExercise[];
}

export interface DailyEntry {
  id: string; // YYYY-MM-DD
  userId: string;
  date: string; // local YYYY-MM-DD
  caloriesConsumed: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  meals: MealItem[];
  workouts: WorkoutEntry[];
  workoutCaloriesBurned: number;
  steps: number;
  stepCaloriesBurned: number;
  totalCaloriesBurned: number;
  waterMl: number;
  weight: number | null; // optional check-in
  note?: string;
  updatedAt: string;
}

export interface UserReminder {
  id: string;
  userId: string;
  title: string;
  type: 'water' | 'meal' | 'workout' | 'mindset';
  time: string; // "09:00"
  enabled: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface NotificationSettings {
  hydrationEnabled: boolean;
  hydrationIntervalMinutes: number;
  movementEnabled: boolean;
  movementThresholdSteps: number;
  mindsetEnabled: boolean;
  mindsetTime: string;
}

export interface PeriodReportStats {
  period: 'week' | 'month';
  totalDaysRecorded: number;
  daysOnTarget: number;
  averageCaloriesConsumed: number;
  totalCaloriesBurned: number;
  averageCaloriesBurned: number;
  averageNetCalories: number;
  totalSteps: number;
  averageSteps: number;
  averageWaterMl: number;
  totalWorkouts: number;
  startingWeight: number | null;
  latestWeight: number | null;
  weightChange: number | null;
  bestDay: { date: string; deficit: number } | null;
  worstDay: { date: string; deficit: number } | null;
  dailyHistory: DailyEntry[];
}
