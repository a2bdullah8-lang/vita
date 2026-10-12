import { ActivityLevel, Gender, UserProfile } from '../types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { multiplier: number; label: string; description: string }> = {
  sedentary: { multiplier: 1.2, label: 'Sedentary', description: 'Little or no exercise, desk job' },
  light: { multiplier: 1.375, label: 'Lightly Active', description: 'Light exercise or sports 1-3 days/week' },
  moderate: { multiplier: 1.55, label: 'Moderately Active', description: 'Moderate exercise or sports 3-5 days/week' },
  very_active: { multiplier: 1.725, label: 'Very Active', description: 'Hard exercise or sports 6-7 days/week' },
  extra_active: { multiplier: 1.9, label: 'Extra Active', description: 'Very hard exercise, physical job or 2x training' },
};

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor Formula
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') {
    return Math.round(base + 5);
  }
  if (gender === 'female') {
    return Math.round(base - 161);
  }
  return Math.round(base - 78); // Neutral midpoint
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel]?.multiplier || 1.375;
  return Math.round(bmr * mult);
}

/**
 * Calculates daily calorie deficit from weekly loss pace.
 * 1 kg fat ≈ 7,700 kcal -> weekly loss of X kg requires (X * 7,700) / 7 = X * 1,100 kcal deficit per day.
 */
export function calculateDailyDeficit(weeklyLossPaceKg: number): number {
  return Math.round(weeklyLossPaceKg * 1100);
}

/**
 * Calculates target daily calories ensuring healthy minimums.
 */
export function calculateTargetCalories(tdee: number, dailyDeficit: number, gender: Gender): number {
  const minCal = gender === 'female' ? 1200 : 1400;
  return Math.max(minCal, Math.round(tdee - dailyDeficit));
}

/**
 * Computes all profile metrics from basic user stats
 */
export function computeProfileMetrics(params: {
  age: number;
  gender: Gender;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  weeklyLossPace: number;
}) {
  const bmr = calculateBMR(params.currentWeightKg, params.heightCm, params.age, params.gender);
  const tdee = calculateTDEE(bmr, params.activityLevel);
  const dailyCalorieDeficit = calculateDailyDeficit(params.weeklyLossPace);
  const dailyCalorieTarget = calculateTargetCalories(tdee, dailyCalorieDeficit, params.gender);
  const dailyProteinTarget = Math.round(params.currentWeightKg * 2.0); // 2g per kg for muscle retention
  const dailyWaterGoalMl = Math.max(2500, Math.round(params.currentWeightKg * 35));
  const dailyStepGoal = 10000;

  return {
    bmr,
    tdee,
    dailyCalorieDeficit,
    dailyCalorieTarget,
    dailyProteinTarget,
    dailyWaterGoalMl,
    dailyStepGoal,
  };
}

/**
 * Returns today's local date as YYYY-MM-DD
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a local YYYY-MM-DD string to a readable date
 */
export function formatLocalDateString(dateKey: string): string {
  if (!dateKey) return '';
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
