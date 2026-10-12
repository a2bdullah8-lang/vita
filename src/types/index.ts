export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  age: number;
  height: string;
  currentWeightKg: number;
  targetWeightKg: number;
  pace: string;
  dailyCalorieTarget: number;
  dailyStepGoal: number;
  dailyWaterGoalMl: number;
  themeMode: 'light' | 'dark';
  updatedAt: string;
}

export interface MealItem {
  id: string;
  userId: string;
  name: string;
  calories: number;
  proteinGrams: number;
  carbsGrams?: number;
  fatGrams?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
  createdAt: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  equipment: 'Adjustable Dumbbells' | 'Resistance Band' | 'Grip Strengthener' | 'Bodyweight';
  sets: number;
  reps: string;
  targetMuscle: string;
  notes?: string;
  completed?: boolean;
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
  exercises: ExerciseItem[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  mode: 'home' | 'gym';
  dayName: string;
  targetMuscles: string;
  durationMinutes: number;
  caloriesBurned: number;
  exercisesCompleted: string[];
  notes?: string;
  timestamp: string;
  createdAt: string;
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

export interface DailyHealthLog {
  id: string;
  userId: string;
  date: string;
  steps: number;
  activeCalories: number;
  distanceKm: number;
  waterConsumedMl: number;
  lastStepSyncTime: string;
  hourlySteps: number[];
  syncedSource: 'google_health' | 'manual';
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface NotificationSettings {
  hydrationEnabled: boolean;
  hydrationIntervalMinutes: number; // default 120
  movementEnabled: boolean;
  movementThresholdSteps: number; // default 250
  mindsetEnabled: boolean;
  mindsetTime: string; // default "08:00"
}
