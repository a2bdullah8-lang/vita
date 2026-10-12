import React, { useState } from 'react';
import { DailyEntry, UserProfile, WorkoutEntry, WorkoutLog } from '../types';
import { DualWorkoutEngine } from './DualWorkoutEngine';

interface WorkoutsTrackerProps {
  profile: UserProfile;
  todayEntry: DailyEntry;
  onUpdateTodayEntry: (updated: DailyEntry) => Promise<void>;
}

const COMMON_WORKOUT_TYPES = [
  'Upper Body Strength',
  'Lower Body Strength',
  'Full Body Dumbbell Circuit',
  'Commercial Gym Session',
  'Outdoor Run / Jog',
  'Treadmill Incline Walk',
  'HIIT Cardio',
  'Mobility & Yoga Flow',
];

export const WorkoutsTracker: React.FC<WorkoutsTrackerProps> = ({
  profile,
  todayEntry,
  onUpdateTodayEntry,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState('Upper Body Strength');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [caloriesBurned, setCaloriesBurned] = useState('320');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Steps box state
  const [stepsInput, setStepsInput] = useState(todayEntry.steps.toString());

  const workouts = todayEntry.workouts || [];
  const workoutBurn = todayEntry.workoutCaloriesBurned || 0;
  const stepBurn = todayEntry.stepCaloriesBurned || 0;
  const totalBurn = todayEntry.totalCaloriesBurned || 0;

  // Open modal
  const handleOpenAdd = () => {
    setEditingWorkoutId(null);
    setType('Upper Body Strength');
    setDurationMinutes('45');
    setCaloriesBurned('320');
    setNotes('');
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setShowModal(true);
  };

  const handleOpenEdit = (workout: WorkoutEntry) => {
    setEditingWorkoutId(workout.id);
    setType(workout.type);
    setDurationMinutes(workout.durationMinutes.toString());
    setCaloriesBurned(workout.caloriesBurned.toString());
    setNotes(workout.notes || '');
    setTime(workout.time);
    setShowModal(true);
  };

  // Save Workout
  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim() || !durationMinutes || !caloriesBurned) return;

    const parsedMin = Math.max(1, parseInt(durationMinutes, 10) || 0);
    const parsedBurn = Math.max(0, parseInt(caloriesBurned, 10) || 0);

    let nextWorkouts: WorkoutEntry[];

    if (editingWorkoutId) {
      nextWorkouts = workouts.map((w) =>
        w.id === editingWorkoutId
          ? {
              ...w,
              type: type.trim(),
              durationMinutes: parsedMin,
              caloriesBurned: parsedBurn,
              time,
              notes: notes.trim(),
            }
          : w
      );
    } else {
      const newWorkout: WorkoutEntry = {
        id: `work_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: type.trim(),
        durationMinutes: parsedMin,
        caloriesBurned: parsedBurn,
        time,
        notes: notes.trim(),
      };
      nextWorkouts = [...workouts, newWorkout];
    }

    const nextWorkoutBurn = nextWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    const totalActiveBurn = nextWorkoutBurn + stepBurn;

    const updatedDay: DailyEntry = {
      ...todayEntry,
      workouts: nextWorkouts,
      workoutCaloriesBurned: nextWorkoutBurn,
      totalCaloriesBurned: totalActiveBurn,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateTodayEntry(updatedDay);
    setShowModal(false);
  };

  // Delete Workout
  const handleDeleteWorkout = async (id: string) => {
    const nextWorkouts = workouts.filter((w) => w.id !== id);
    const nextWorkoutBurn = nextWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    const totalActiveBurn = nextWorkoutBurn + stepBurn;

    const updatedDay: DailyEntry = {
      ...todayEntry,
      workouts: nextWorkouts,
      workoutCaloriesBurned: nextWorkoutBurn,
      totalCaloriesBurned: totalActiveBurn,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateTodayEntry(updatedDay);
  };

  // Steps Box Save
  const handleSaveSteps = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.max(0, parseInt(stepsInput, 10) || 0);
    const newStepBurn = Math.round(val * 0.04);
    const updatedDay: DailyEntry = {
      ...todayEntry,
      steps: val,
      stepCaloriesBurned: newStepBurn,
      totalCaloriesBurned: workoutBurn + newStepBurn,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateTodayEntry(updatedDay);
  };

  const handleQuickAddSteps = async (amount: number) => {
    const nextSteps = (todayEntry.steps || 0) + amount;
    const newStepBurn = Math.round(nextSteps * 0.04);
    const updatedDay: DailyEntry = {
      ...todayEntry,
      steps: nextSteps,
      stepCaloriesBurned: newStepBurn,
      totalCaloriesBurned: workoutBurn + newStepBurn,
      updatedAt: new Date().toISOString(),
    };
    setStepsInput(nextSteps.toString());
    await onUpdateTodayEntry(updatedDay);
  };

  const [workoutMode, setWorkoutMode] = useState<'log' | 'guided'>('log');

  const handleSaveFromGuided = async (log: WorkoutLog) => {
    const newWorkout: WorkoutEntry = {
      id: log.id || `work_${Date.now()}`,
      type: log.dayName || log.targetMuscles || 'Guided Workout',
      durationMinutes: log.durationMinutes,
      caloriesBurned: log.caloriesBurned,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: log.notes || (log.exercisesCompleted ? `Exercises: ${log.exercisesCompleted.join(', ')}` : ''),
    };

    const nextWorkouts = [...workouts, newWorkout];
    const nextWorkoutBurn = nextWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    const totalActiveBurn = nextWorkoutBurn + stepBurn;

    const updatedDay: DailyEntry = {
      ...todayEntry,
      workouts: nextWorkouts,
      workoutCaloriesBurned: nextWorkoutBurn,
      totalCaloriesBurned: totalActiveBurn,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateTodayEntry(updatedDay);
    setWorkoutMode('log');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
            Daily Workouts & Activity
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Log your workouts and daily steps, or follow the guided 6-day split with TTS timer.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800">
            <button
              onClick={() => setWorkoutMode('log')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                workoutMode === 'log'
                  ? 'bg-white text-stone-900 dark:bg-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Activity & Steps
            </button>
            <button
              onClick={() => setWorkoutMode('guided')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                workoutMode === 'guided'
                  ? 'bg-white text-stone-900 dark:bg-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Guided 6-Day Split
            </button>
          </div>

          {workoutMode === 'log' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition shadow-xs flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span>
              <span>Log Workout</span>
            </button>
          )}
        </div>
      </div>

      {workoutMode === 'guided' ? (
        <DualWorkoutEngine
          onSaveWorkout={handleSaveFromGuided}
          recentWorkouts={workouts.map((w) => ({
            id: w.id,
            userId: todayEntry.userId,
            dayName: w.type,
            durationMinutes: w.durationMinutes,
            caloriesBurned: w.caloriesBurned,
            notes: w.notes,
            timestamp: todayEntry.date,
          }))}
        />
      ) : (
        <>

      {/* Burned Overview Strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Workout Burn
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-white tabular-nums mt-1 block">
            {workoutBurn} <span className="text-xs font-normal text-stone-400">kcal</span>
          </span>
          <span className="text-[11px] text-stone-400">
            {workouts.length} session{workouts.length === 1 ? '' : 's'} today
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Step Burn
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
            {stepBurn} <span className="text-xs font-normal text-stone-400">kcal</span>
          </span>
          <span className="text-[11px] text-stone-400">
            {todayEntry.steps.toLocaleString()} steps logged
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Total Active Burn
          </span>
          <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums mt-1 block">
            {totalBurn} <span className="text-xs font-normal text-stone-400">kcal</span>
          </span>
          <span className="text-[11px] text-stone-400">
            Direct deficit contributor
          </span>
        </div>
      </div>

      {/* Steps Entry Box */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                Daily Steps Tracker
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {todayEntry.steps.toLocaleString()} / {(profile.dailyStepGoal || 10000).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Enter your pedometer or smartwatch count for today.
            </p>
          </div>

          <form onSubmit={handleSaveSteps} className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100000"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              placeholder="e.g. 8500"
              className="w-32 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-bold tabular-nums focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition"
            >
              Update Steps
            </button>
          </form>
        </div>

        {/* Quick add buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
          <span className="text-stone-400">Quick add:</span>
          <button
            type="button"
            onClick={() => handleQuickAddSteps(500)}
            className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            +500 steps
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddSteps(1000)}
            className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            +1,000 steps
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddSteps(2500)}
            className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition"
          >
            +2,500 steps
          </button>
        </div>
      </section>

      {/* Logged Workouts List */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            Today's Logged Workouts ({workouts.length})
          </h3>
          <span className="text-xs font-mono text-stone-400">{todayEntry.date}</span>
        </div>

        {workouts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto text-lg">
              🏋️
            </div>
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
              No workouts logged today yet
            </p>
            <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
              Track your gym sessions, runs, or home routines. Calories burned will automatically offset your consumed calories on the dashboard.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition"
            >
              + Log Workout Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 dark:text-white">{w.type}</span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      at {w.time}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    <span>{w.durationMinutes} minutes</span>
                    {w.notes && <span> · "{w.notes}"</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-extrabold text-orange-600 dark:text-orange-400 tabular-nums text-sm">
                    +{w.caloriesBurned} kcal
                  </span>
                  <button
                    onClick={() => handleOpenEdit(w)}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition text-xs p-1"
                    title="Edit workout"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(w.id)}
                    className="text-stone-400 hover:text-rose-600 transition text-xs p-1"
                    title="Delete workout"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Workout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#FCFBF9] dark:bg-[#141312] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {editingWorkoutId ? 'Edit Workout' : 'Log Workout Session'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorkout} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Workout Type / Focus
                </label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Chest & Triceps, 5km Run"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none"
                  required
                  autoFocus
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMON_WORKOUT_TYPES.slice(0, 4).map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setType(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="45"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-semibold tabular-nums focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Calories Burned (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={caloriesBurned}
                    onChange={(e) => setCaloriesBurned(e.target.value)}
                    placeholder="350"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-semibold text-orange-600 tabular-nums focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Time of Workout
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notes / Exercises Performed (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Key weights, intensity, feeling..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition mt-2"
              >
                {editingWorkoutId ? 'Update Workout' : 'Save Workout'}
              </button>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
