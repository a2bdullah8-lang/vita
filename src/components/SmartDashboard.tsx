import React, { useState } from 'react';
import { DailyEntry, UserProfile } from '../types';
import { ProgressRing } from './ProgressRing';
import { formatLocalDateString } from '../lib/calculations';

interface SmartDashboardProps {
  profile: UserProfile;
  todayEntry: DailyEntry;
  onUpdateTodayEntry: (updated: DailyEntry) => Promise<void>;
  onUpdateProfile: (updated: UserProfile) => Promise<void>;
  onOpenEditProfile: () => void;
  onOpenSosCoach: () => void;
  onNavigateTab: (tab: 'dashboard' | 'nutrition' | 'workouts' | 'reports' | 'reminders') => void;
}

export const SmartDashboard: React.FC<SmartDashboardProps> = ({
  profile,
  todayEntry,
  onUpdateTodayEntry,
  onUpdateProfile,
  onOpenEditProfile,
  onOpenSosCoach,
  onNavigateTab,
}) => {
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(
    (todayEntry.weight || profile.currentWeightKg).toString()
  );

  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [stepsInput, setStepsInput] = useState(todayEntry.steps.toString());

  // 1. Core Real Calculations
  const consumed = todayEntry.caloriesConsumed || 0;
  const burned = todayEntry.totalCaloriesBurned || 0;
  const target = profile.dailyCalorieTarget || 2000;
  const netCalories = consumed - burned;
  const remainingCalories = target - netCalories;

  // Weight metrics
  const displayWeight = todayEntry.weight || profile.currentWeightKg;
  const kgRemaining = Math.max(0, Number((displayWeight - profile.targetWeightKg).toFixed(1)));
  const initialWeight = profile.currentWeightKg > profile.targetWeightKg ? profile.currentWeightKg : 100;
  const totalWeightDropGoal = Math.max(1, initialWeight - profile.targetWeightKg);
  const droppedSoFar = Math.max(0, initialWeight - displayWeight);
  const weightProgressPct = Math.min(100, Math.round((droppedSoFar / totalWeightDropGoal) * 100));

  // Handler: Log Weight
  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val >= 30 && val <= 350) {
      // 1. Update today's entry
      const updatedDay: DailyEntry = {
        ...todayEntry,
        weight: val,
        updatedAt: new Date().toISOString(),
      };
      await onUpdateTodayEntry(updatedDay);

      // 2. Update profile current weight
      const updatedProfile: UserProfile = {
        ...profile,
        currentWeightKg: val,
        updatedAt: new Date().toISOString(),
      };
      await onUpdateProfile(updatedProfile);
      setIsLoggingWeight(false);
    }
  };

  // Handler: Water intake
  const handleAddWater = async (amount: number) => {
    const nextWater = (todayEntry.waterMl || 0) + amount;
    const updatedDay: DailyEntry = {
      ...todayEntry,
      waterMl: nextWater,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateTodayEntry(updatedDay);
  };

  // Handler: Steps update
  const handleSaveSteps = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.max(0, parseInt(stepsInput, 10) || 0);
    const stepBurn = Math.round(val * 0.04);
    const updatedDay: DailyEntry = {
      ...todayEntry,
      steps: val,
      stepCaloriesBurned: stepBurn,
      totalCaloriesBurned: (todayEntry.workoutCaloriesBurned || 0) + stepBurn,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateTodayEntry(updatedDay);
    setIsEditingSteps(false);
  };

  const handleQuickAddSteps = async (amount: number) => {
    const nextSteps = (todayEntry.steps || 0) + amount;
    const stepBurn = Math.round(nextSteps * 0.04);
    const updatedDay: DailyEntry = {
      ...todayEntry,
      steps: nextSteps,
      stepCaloriesBurned: stepBurn,
      totalCaloriesBurned: (todayEntry.workoutCaloriesBurned || 0) + stepBurn,
      updatedAt: new Date().toISOString(),
    };
    setStepsInput(nextSteps.toString());
    await onUpdateTodayEntry(updatedDay);
  };

  const hasAnyDataToday =
    todayEntry.meals.length > 0 ||
    todayEntry.workouts.length > 0 ||
    todayEntry.steps > 0 ||
    todayEntry.waterMl > 0 ||
    todayEntry.weight !== null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header Goal Architecture Banner */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
              <span>Goal Architecture</span>
              <span aria-hidden="true">·</span>
              <span>{formatLocalDateString(todayEntry.date)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-orange-600 dark:text-orange-400">
                Pace: -{profile.weeklyLossPace} kg/wk
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white mt-1">
              Target {profile.targetWeightKg} kg{' '}
              <span className="text-sm font-normal text-stone-500 dark:text-stone-400">
                ({kgRemaining > 0 ? `${kgRemaining} kg to go` : 'Goal Reached!'})
              </span>
            </h1>
          </div>

          {/* Quick Check-In / Edit Profile buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isLoggingWeight ? (
              <form onSubmit={handleSaveWeight} className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-20 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  autoFocus
                />
                <span className="text-xs text-stone-500">kg</span>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsLoggingWeight(false)}
                  className="px-2 py-1.5 text-xs text-stone-500"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setWeightInput(displayWeight.toString());
                  setIsLoggingWeight(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition text-xs font-medium flex items-center gap-2"
              >
                <span>Today's Weight:</span>
                <strong className="text-stone-900 dark:text-white tabular-nums">
                  {displayWeight} kg
                </strong>
                <span className="text-[10px] text-stone-400">✎</span>
              </button>
            )}

            <button
              onClick={onOpenEditProfile}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 text-xs font-medium transition"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Progress bar towards goal */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Progress toward {profile.targetWeightKg} kg</span>
            <span className="font-semibold text-stone-900 dark:text-white tabular-nums">
              {displayWeight} kg / {profile.targetWeightKg} kg
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-stone-900 dark:bg-stone-100 transition-all duration-700"
              style={{
                width: `${Math.max(
                  4,
                  Math.min(
                    100,
                    100 - (kgRemaining / Math.max(1, profile.currentWeightKg - profile.targetWeightKg)) * 100
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Core Dashboard Grid: Progress Ring & Real Today's Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Concentric Progress Ring */}
        <section className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">Daily Progress Rings</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">Real Logged Calories & Activity</p>
            </div>
            <span className="text-xs font-mono text-stone-400">{todayEntry.date}</span>
          </div>

          <div className="py-2">
            <ProgressRing
              caloriesConsumed={consumed}
              calorieTarget={target}
              caloriesBurned={burned}
              burnedTarget={500}
              steps={todayEntry.steps}
              stepGoal={profile.dailyStepGoal || 10000}
              size={260}
            />
          </div>

          {/* Ring footer explanation */}
          <div className="w-full mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400">Daily Calorie Budget</span>
            <span className={`font-bold tabular-nums ${remainingCalories < 0 ? 'text-rose-600' : 'text-stone-900 dark:text-white'}`}>
              {remainingCalories >= 0 ? `${remainingCalories} kcal left` : `${Math.abs(remainingCalories)} kcal over target`}
            </span>
          </div>
        </section>

        {/* Right: Real Metrics Cards & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div
              onClick={() => onNavigateTab('nutrition')}
              className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition"
            >
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Consumed
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white tabular-nums mt-1 block">
                {consumed} <span className="text-xs font-normal text-stone-400">kcal</span>
              </span>
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                {todayEntry.meals.length} {todayEntry.meals.length === 1 ? 'meal' : 'meals'} logged
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('workouts')}
              className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition"
            >
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Burned (Active)
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums mt-1 block">
                {burned} <span className="text-xs font-normal text-stone-400">kcal</span>
              </span>
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                {todayEntry.workouts.length} workout{todayEntry.workouts.length === 1 ? '' : 's'} + steps
              </span>
            </div>

            <div
              onClick={() => setIsEditingSteps(true)}
              className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition"
            >
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Steps Today
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
                {todayEntry.steps.toLocaleString()}
              </span>
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Goal: {(profile.dailyStepGoal || 10000).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Steps Entry Dialog / Bar */}
          {isEditingSteps && (
            <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-900 dark:text-white">Update Today's Steps</span>
                <button onClick={() => setIsEditingSteps(false)} className="text-xs text-stone-400">✕</button>
              </div>
              <form onSubmit={handleSaveSteps} className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-semibold tabular-nums"
                  placeholder="e.g. 7500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold"
                >
                  Save Steps
                </button>
              </form>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[11px] text-stone-400">Quick add:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddSteps(500)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddSteps(1000)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  +1,000
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddSteps(2500)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  +2,500
                </button>
              </div>
            </div>
          )}

          {/* Hydration Tracker */}
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-stone-900 dark:text-white">Hydration</span>
                <span className="text-xs text-stone-500 tabular-nums">
                  ({todayEntry.waterMl || 0} / {profile.dailyWaterGoalMl || 3000} ml)
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Target: {profile.dailyWaterGoalMl || 3000} ml to support metabolic fat burn.
              </p>
              <div className="w-48 sm:w-60 h-2 bg-stone-100 dark:bg-stone-800 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((todayEntry.waterMl || 0) / (profile.dailyWaterGoalMl || 3000)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddWater(250)}
                className="px-3.5 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-semibold hover:bg-cyan-100 transition whitespace-nowrap"
              >
                +250 ml Glass
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition whitespace-nowrap"
              >
                +500 ml Bottle
              </button>
            </div>
          </section>

          {/* Formula Transparency Card (Mifflin-St Jeor) */}
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                Mifflin-St Jeor Metabolic Formula
              </h3>
              <span className="text-[11px] text-stone-400 font-mono">Calibrated to your stats</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">1. BMR</span>
                <span className="text-base font-extrabold text-stone-900 dark:text-white tabular-nums mt-0.5 block">
                  {profile.bmr} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                </span>
                <span className="text-[10px] text-stone-500">Resting baseline</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">2. TDEE</span>
                <span className="text-base font-extrabold text-stone-900 dark:text-white tabular-nums mt-0.5 block">
                  {profile.tdee} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                </span>
                <span className="text-[10px] text-stone-500">Maintenance</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">3. Deficit</span>
                <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5 block">
                  -{profile.dailyCalorieDeficit} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                </span>
                <span className="text-[10px] text-stone-500">-{profile.weeklyLossPace} kg/wk</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">4. Daily Target</span>
                <span className="text-base font-extrabold text-stone-900 dark:text-white tabular-nums mt-0.5 block">
                  {profile.dailyCalorieTarget} <span className="text-[10px] font-normal text-stone-400">kcal</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Max intake</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
              Based on your age ({profile.age}), height ({profile.heightCm} cm), current weight ({profile.currentWeightKg} kg), and {profile.activityLevel} activity.
            </p>
          </section>

          {/* Empty state alert if no entries yet */}
          {!hasAnyDataToday && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Fresh Day Started ({formatLocalDateString(todayEntry.date)})
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                No meals or workouts logged yet today. Tap below to log your first breakfast or activity.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateTab('nutrition')}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold"
                >
                  + Log First Meal
                </button>
                <button
                  onClick={() => onNavigateTab('workouts')}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-600 text-xs font-semibold text-stone-800 dark:text-stone-200"
                >
                  + Log Workout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
