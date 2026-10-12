import React, { useState } from 'react';
import { UserProfile, HealthSyncData, MealItem, WorkoutLog } from '../types';
import { ProgressRing } from './ProgressRing';
import { notificationManager } from '../lib/notifications';

interface SmartDashboardProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  healthData: HealthSyncData;
  onSyncHealth: () => void;
  onAddSteps: (steps: number) => void;
  onSimulateInactivity: () => void;
  meals: MealItem[];
  workouts: WorkoutLog[];
  waterMl: number;
  onAddWater: (amountMl: number) => void;
  openSosModal: () => void;
}

export const SmartDashboard: React.FC<SmartDashboardProps> = ({
  profile,
  onUpdateProfile,
  healthData,
  onSyncHealth,
  onAddSteps,
  onSimulateInactivity,
  meals,
  workouts,
  waterMl,
  onAddWater,
  openSosModal,
}) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState(profile.currentWeightKg.toString());
  const [showOAuthConfig, setShowOAuthConfig] = useState(false);

  // Calculations
  const totalCaloriesConsumed = meals.reduce((sum, m) => sum + m.calories, 0);
  const workoutCaloriesBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const totalCaloriesBurned = healthData.activeCalories + workoutCaloriesBurned;

  // Weight loss goal metrics
  const kgToLose = Math.max(0, profile.currentWeightKg - profile.targetWeightKg);
  const totalLostSoFar = Math.max(0, 106 - profile.currentWeightKg); // started at 106
  const progressPercent = Math.min(100, Math.round((totalLostSoFar / (106 - profile.targetWeightKg)) * 100));

  // Daily deficit calculation:
  // Baseline maintenance TDEE estimated for 22yo male 5'11" 106kg: ~2,750 kcal
  const estimatedMaintenance = 2750;
  const netCalories = totalCaloriesConsumed - totalCaloriesBurned;
  const currentDeficit = estimatedMaintenance - netCalories;
  // 1.5kg/week requires ~1,650 kcal deficit / day or ~1,150 food deficit + 500 exercise burn
  const targetDailyDeficit = 1500;

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newWeight);
    if (!isNaN(parsed) && parsed > 50 && parsed < 250) {
      onUpdateProfile({
        ...profile,
        currentWeightKg: parsed,
        updatedAt: new Date().toISOString(),
      });
      setIsEditingWeight(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Ultra-Clean Goal Architecture Banner (Apple/COS Aesthetic) */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/70 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
              <span>Goal Architecture</span>
              <span aria-hidden="true">·</span>
              <span>Age {profile.age}</span>
              <span aria-hidden="true">·</span>
              <span>Height {profile.height}</span>
              <span aria-hidden="true">·</span>
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{profile.pace}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-1">
              Target {profile.targetWeightKg} kg{' '}
              <span className="text-sm font-normal text-stone-500 dark:text-stone-400">
                (Started: 106 kg · {kgToLose.toFixed(1)} kg remaining)
              </span>
            </h1>
          </div>

          {/* Current Weight Quick Check-In */}
          <div className="flex items-center gap-3">
            {isEditingWeight ? (
              <form onSubmit={handleSaveWeight} className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-20 px-2.5 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold"
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
                  onClick={() => setIsEditingWeight(false)}
                  className="px-2 py-1.5 text-xs text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingWeight(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition text-xs font-medium"
              >
                <span>Current:</span>
                <span className="font-bold text-sm tabular-nums text-stone-900 dark:text-white">
                  {profile.currentWeightKg} kg
                </span>
                <span className="text-stone-400 text-[10px]">✎</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar towards 96kg */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Progress to 96kg goal</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
              {progressPercent}% Complete
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-stone-900 dark:bg-stone-100 transition-all duration-700"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. Core Dashboard Grid: Progress Ring & Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Dynamic Concentric Ring Card (Apple Fitness Style) */}
        <section className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-stone-200/70 dark:border-stone-800 shadow-xs flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Daily Health Rings</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">Calories & Steps Synchronization</p>
            </div>
            <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
              Today
            </span>
          </div>

          <div className="py-2">
            <ProgressRing
              caloriesConsumed={totalCaloriesConsumed}
              calorieTarget={profile.dailyCalorieTarget}
              caloriesBurned={totalCaloriesBurned}
              burnedTarget={750}
              steps={healthData.steps}
              stepGoal={profile.dailyStepGoal}
              size={260}
            />
          </div>

          {/* Quick status footer */}
          <div className="w-full mt-5 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
            <span className="text-stone-500 dark:text-stone-400">Deficit Goal (1.5kg/wk)</span>
            <span className={`font-bold tabular-nums ${currentDeficit >= targetDailyDeficit ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-stone-100'}`}>
              {currentDeficit > 0 ? `-${currentDeficit} kcal` : `+${Math.abs(currentDeficit)} kcal`}
            </span>
          </div>
        </section>

        {/* Right: Metrics Overview & Google Health Sync Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* 3 Metric Summary Cards */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800 shadow-xs">
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Steps Synced
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums mt-1 block">
                {healthData.steps.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {Math.round((healthData.steps / profile.dailyStepGoal) * 100)}% of 10k
              </span>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800 shadow-xs">
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Burned (Active)
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums mt-1 block">
                {totalCaloriesBurned}
              </span>
              <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                Workouts + Walk
              </span>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800 shadow-xs">
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
                Distance
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums mt-1 block">
                {healthData.distanceKm} <span className="text-xs font-normal text-stone-400">km</span>
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                GPS + Pedometer
              </span>
            </div>
          </div>

          {/* Google Health API & OAuth 2.0 Integration Panel */}
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/70 dark:border-stone-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Google Health API
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>OAuth 2.0 Connected</span>
                    <span>·</span>
                    <span>Synced {new Date(healthData.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onSyncHealth}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 text-xs font-semibold transition"
                >
                  ↻ Sync Now
                </button>
                <button
                  onClick={() => setShowOAuthConfig(!showOAuthConfig)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 text-xs transition"
                >
                  OAuth Info
                </button>
              </div>
            </div>

            {/* Inactivity & Movement Alert Monitor */}
            <div className="mt-4 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                  Hourly Activity Monitor
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Last hour: <strong className="tabular-nums">{healthData.lastHourSteps}</strong> steps{' '}
                  {healthData.lastHourSteps < 250 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">(&lt; 250 steps threshold - alert active)</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">(Movement goal met)</span>
                  )}
                </span>
              </div>

              {/* Simulation / Testing Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onAddSteps(500)}
                  className="px-2.5 py-1 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[11px] font-medium hover:opacity-90 transition whitespace-nowrap"
                  title="Simulate adding a 500-step brisk walk"
                >
                  +500 Walk Steps
                </button>
                <button
                  onClick={onSimulateInactivity}
                  className="px-2.5 py-1 rounded-md border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-[11px] font-medium hover:bg-stone-100 dark:hover:bg-stone-700 transition whitespace-nowrap"
                  title="Simulate < 250 steps to trigger Movement push notification"
                >
                  Test Stagnant &lt;250
                </button>
              </div>
            </div>

            {/* OAuth Details Dropdown */}
            {showOAuthConfig && (
              <div className="mt-3 p-3 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-mono text-stone-700 dark:text-stone-300 space-y-1">
                <div>Endpoint: https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate</div>
                <div>Scopes: fitness.activity.read, fitness.body.read, fitness.location.read</div>
                <div>OAuth 2.0 Auth State: Authorized & Token refreshed</div>
              </div>
            )}
          </section>

          {/* Hydration Tracker Card */}
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 border border-stone-200/70 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-stone-900 dark:text-stone-100">Hydration Engine</span>
                <span className="text-xs text-stone-500 tabular-nums">({waterMl} / {profile.dailyWaterGoalMl} ml)</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Target 3 Liters daily to support aggressive fat metabolism.
              </p>
              <div className="w-48 sm:w-60 h-2 bg-stone-100 dark:bg-stone-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (waterMl / profile.dailyWaterGoalMl) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddWater(250)}
                className="px-3.5 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-semibold hover:bg-cyan-100 transition whitespace-nowrap"
              >
                +250 ml Glass
              </button>
              <button
                onClick={() => onAddWater(500)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition whitespace-nowrap"
              >
                +500 ml Bottle
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
