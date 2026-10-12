import React, { useState, useEffect, useRef } from 'react';
import { WorkoutDayPlan, WorkoutLog } from '../types';
import { tts } from '../lib/tts';

interface DualWorkoutEngineProps {
  onSaveWorkout: (workout: WorkoutLog) => void;
  recentWorkouts: WorkoutLog[];
}

export const HOME_SPLIT_DAYS: WorkoutDayPlan[] = [
  {
    dayName: 'Monday',
    dayShort: 'Mon',
    dayIndex: 1,
    title: 'Shoulders & Neck',
    focusMuscles: 'Deltoids, Upper Traps, Neck Extensors',
    equipment: ['Adjustable Dumbbells', 'Resistance Band'],
    estimatedDurationMin: 48,
    targetCaloriesBurn: 380,
    exercises: [
      { id: 'm1', name: 'Seated DB Overhead Press', equipment: 'Adjustable Dumbbells', sets: 4, reps: '8-10 reps', targetMuscle: 'Front/Lateral Delts' },
      { id: 'm2', name: 'DB Standing Lateral Raises', equipment: 'Adjustable Dumbbells', sets: 4, reps: '12-15 reps', targetMuscle: 'Side Delts (Width)' },
      { id: 'm3', name: 'Heavy DB Shrugs with 2s Pause', equipment: 'Adjustable Dumbbells', sets: 4, reps: '12 reps', targetMuscle: 'Upper Trapezius' },
      { id: 'm4', name: 'Band Resisted Neck Extensions', equipment: 'Resistance Band', sets: 3, reps: '15 reps', targetMuscle: 'Posterior Neck' },
      { id: 'm5', name: 'Band Face Pulls with External Rotation', equipment: 'Resistance Band', sets: 4, reps: '15-20 reps', targetMuscle: 'Rear Delts & Rhomboids' },
    ],
  },
  {
    dayName: 'Tuesday',
    dayShort: 'Tue',
    dayIndex: 2,
    title: 'Biceps & Triceps',
    focusMuscles: 'Biceps Brachii, Brachialis, Triceps Lateral/Long Head',
    equipment: ['Adjustable Dumbbells', 'Resistance Band'],
    estimatedDurationMin: 50,
    targetCaloriesBurn: 390,
    exercises: [
      { id: 'tu1', name: 'DB Neutral Hammer Curls', equipment: 'Adjustable Dumbbells', sets: 4, reps: '10-12 reps', targetMuscle: 'Brachialis & Forearm' },
      { id: 'tu2', name: 'Incline / Seated DB Supinated Curls', equipment: 'Adjustable Dumbbells', sets: 4, reps: '10 reps', targetMuscle: 'Bicep Peak' },
      { id: 'tu3', name: 'Overhead DB Tricep Extension', equipment: 'Adjustable Dumbbells', sets: 4, reps: '12 reps', targetMuscle: 'Tricep Long Head' },
      { id: 'tu4', name: 'Band High Tricep Pushdowns', equipment: 'Resistance Band', sets: 4, reps: '15 reps', targetMuscle: 'Tricep Lateral Head' },
      { id: 'tu5', name: 'Concentration Curls', equipment: 'Adjustable Dumbbells', sets: 3, reps: '12 reps / arm', targetMuscle: 'Bicep Isolation' },
    ],
  },
  {
    dayName: 'Wednesday',
    dayShort: 'Wed',
    dayIndex: 3,
    title: 'Grip, Forearms & Neck',
    focusMuscles: 'Wrist Flexors, Extensors, Grip Strength, Neck Flexors',
    equipment: ['Grip Strengthener', 'Adjustable Dumbbells', 'Resistance Band'],
    estimatedDurationMin: 45,
    targetCaloriesBurn: 340,
    exercises: [
      { id: 'w1', name: 'Hand Grip Strengthener Max Closes', equipment: 'Grip Strengthener', sets: 5, reps: '20 reps + 5s hold', targetMuscle: 'Crush Grip Force' },
      { id: 'w2', name: 'DB Seated Wrist Curls (Palms Up)', equipment: 'Adjustable Dumbbells', sets: 4, reps: '15-20 reps', targetMuscle: 'Forearm Flexors' },
      { id: 'w3', name: 'DB Reverse Wrist Curls (Palms Down)', equipment: 'Adjustable Dumbbells', sets: 4, reps: '15 reps', targetMuscle: 'Forearm Extensors' },
      { id: 'w4', name: 'Heavy DB Static Farmer Hold', equipment: 'Adjustable Dumbbells', sets: 4, reps: '45 sec hold', targetMuscle: 'Endurance Grip' },
      { id: 'w5', name: 'Band Lateral Neck Flexion', equipment: 'Resistance Band', sets: 3, reps: '15 reps / side', targetMuscle: 'Lateral Neck' },
    ],
  },
  {
    dayName: 'Thursday',
    dayShort: 'Thu',
    dayIndex: 4,
    title: 'Shoulders & Arms Detail',
    focusMuscles: 'Deltoid Sculpting, Tricep Medial Head, Grip Detail',
    equipment: ['Adjustable Dumbbells', 'Grip Strengthener'],
    estimatedDurationMin: 48,
    targetCaloriesBurn: 370,
    exercises: [
      { id: 'th1', name: 'DB Arnold Press', equipment: 'Adjustable Dumbbells', sets: 4, reps: '10 reps', targetMuscle: 'Complete Shoulder Rotation' },
      { id: 'th2', name: 'Leaning DB Lateral Raises', equipment: 'Adjustable Dumbbells', sets: 4, reps: '12 reps / arm', targetMuscle: 'Lateral Delts Peak Tension' },
      { id: 'th3', name: 'DB Spider Curls (Chest Supported)', equipment: 'Adjustable Dumbbells', sets: 4, reps: '10-12 reps', targetMuscle: 'Bicep Short Head' },
      { id: 'th4', name: 'DB Flat Bench / Floor Skull Crushers', equipment: 'Adjustable Dumbbells', sets: 4, reps: '12 reps', targetMuscle: 'Triceps Deep Extension' },
      { id: 'th5', name: 'Grip Strengthener Isometric Hold', equipment: 'Grip Strengthener', sets: 4, reps: '30s hold / hand', targetMuscle: 'Static Pinch Grip' },
    ],
  },
  {
    dayName: 'Friday',
    dayShort: 'Fri',
    dayIndex: 5,
    title: 'Upper Body Pump Circuit',
    focusMuscles: 'Chest, Back, Delts, High Calorie Fat Burn',
    equipment: ['Resistance Band', 'Adjustable Dumbbells'],
    estimatedDurationMin: 52,
    targetCaloriesBurn: 430,
    exercises: [
      { id: 'f1', name: 'Band-Resisted Push-ups', equipment: 'Resistance Band', sets: 4, reps: '15-20 reps', targetMuscle: 'Pectorals & Triceps' },
      { id: 'f2', name: 'DB Floor Press', equipment: 'Adjustable Dumbbells', sets: 4, reps: '12 reps', targetMuscle: 'Chest Power' },
      { id: 'f3', name: 'Band Standing Rows / Lat Pulls', equipment: 'Resistance Band', sets: 4, reps: '15 reps', targetMuscle: 'Upper Back & Lats' },
      { id: 'f4', name: 'DB Bicep 21s Burnout', equipment: 'Adjustable Dumbbells', sets: 3, reps: '21 reps (7/7/7)', targetMuscle: 'Bicep Vascularity' },
      { id: 'f5', name: 'Band Overhead Tricep Burnout', equipment: 'Resistance Band', sets: 3, reps: '25 reps', targetMuscle: 'Tricep Pump' },
    ],
  },
  {
    dayName: 'Saturday',
    dayShort: 'Sat',
    dayIndex: 6,
    title: 'Forearm Vascularity & Grip Endurance',
    focusMuscles: 'Forearms, Brachioradialis, Hand Power',
    equipment: ['Grip Strengthener', 'Adjustable Dumbbells'],
    estimatedDurationMin: 42,
    targetCaloriesBurn: 320,
    exercises: [
      { id: 'sa1', name: 'Grip Strengthener Pyramid (High Volume)', equipment: 'Grip Strengthener', sets: 5, reps: '25 reps / hand', targetMuscle: 'Vascular Density' },
      { id: 'sa2', name: 'DB Standing Reverse Curls', equipment: 'Adjustable Dumbbells', sets: 4, reps: '12 reps', targetMuscle: 'Brachioradialis Muscle' },
      { id: 'sa3', name: 'Heavy DB Hex Head Pinch Grip', equipment: 'Adjustable Dumbbells', sets: 4, reps: '35-45 sec hold', targetMuscle: 'Finger Tendon Strength' },
      { id: 'sa4', name: 'DB Wrist Roller / Extension Burnout', equipment: 'Adjustable Dumbbells', sets: 3, reps: '25 reps', targetMuscle: 'Forearm Vein Pump' },
    ],
  },
];

export const DualWorkoutEngine: React.FC<DualWorkoutEngineProps> = ({
  onSaveWorkout,
  recentWorkouts,
}) => {
  const [engineMode, setEngineMode] = useState<'home' | 'gym'>('home');

  // Home Mode States
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const currentPlan = HOME_SPLIT_DAYS[selectedDayIndex];
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // Global Workout Timer (40 - 60 min target)
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState(false);
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 60-Second Rest Timer with Web Speech API
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(60);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Gym Mode States
  const [gymMuscles, setGymMuscles] = useState('Chest, Triceps & Abs');
  const [gymCalories, setGymCalories] = useState('450');
  const [gymDuration, setGymDuration] = useState('55');
  const [gymNotes, setGymNotes] = useState('Flat bench press 80kg, incline DB press, cable crossovers.');

  // Global workout timer tick
  useEffect(() => {
    if (isWorkoutTimerRunning) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (workoutTimerRef.current) {
      clearInterval(workoutTimerRef.current);
    }
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [isWorkoutTimerRunning]);

  // 60-second rest timer tick with Web Speech API triggers
  useEffect(() => {
    if (isRestTimerRunning) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev === 11) {
            // Voice announcement: '10 seconds left, get in position'
            tts.announceTenSecondsLeft();
          }
          if (prev <= 1) {
            // Voice announcement: 'Time is up, start your set.'
            tts.announceTimeIsUp();
            setIsRestTimerRunning(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isRestTimerRunning]);

  const startRestTimer = () => {
    setRestSecondsRemaining(60);
    setIsRestTimerRunning(true);
    tts.playTone(520, 150);
  };

  const pauseRestTimer = () => {
    setIsRestTimerRunning(false);
  };

  const resetRestTimer = () => {
    setIsRestTimerRunning(false);
    setRestSecondsRemaining(60);
  };

  const toggleExerciseCheck = (id: string) => {
    setCompletedExercises((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // If completed, trigger 60-second rest timer automatically!
      if (next[id] && !isRestTimerRunning) {
        startRestTimer();
      }
      return next;
    });
  };

  const handleFinishHomeWorkout = () => {
    const completedList = currentPlan.exercises
      .filter((e: any) => completedExercises[e.id])
      .map((e: any) => e.name);

    const log: WorkoutLog = {
      id: `w_home_${Date.now()}`,
      userId: 'guest_user',
      mode: 'home',
      dayName: `${currentPlan.dayName} (${currentPlan.title})`,
      targetMuscles: currentPlan.focusMuscles,
      durationMinutes: Math.max(1, Math.round(workoutElapsedSeconds / 60)) || currentPlan.estimatedDurationMin,
      caloriesBurned: currentPlan.targetCaloriesBurn,
      exercisesCompleted: completedList.length > 0 ? completedList : currentPlan.exercises.map((e: any) => e.name),
      notes: `Home guided session with ${currentPlan.equipment.join(', ')}.`,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onSaveWorkout(log);
    setIsWorkoutTimerRunning(false);
    setIsRestTimerRunning(false);
    tts.speak('Workout completed! Outstanding dedication. Calories synced to your dashboard.');
  };

  const handleLogGymSession = (e: React.FormEvent) => {
    e.preventDefault();
    const burned = parseInt(gymCalories) || 400;
    const duration = parseInt(gymDuration) || 50;

    const log: WorkoutLog = {
      id: `w_gym_${Date.now()}`,
      userId: 'guest_user',
      mode: 'gym',
      dayName: `Commercial Gym Session`,
      targetMuscles: gymMuscles,
      durationMinutes: duration,
      caloriesBurned: burned,
      exercisesCompleted: [gymMuscles],
      notes: gymNotes,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onSaveWorkout(log);
    tts.speak('Gym session saved and active calories synced.');
    setGymNotes('');
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Engine Header & Segmented Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Dual-Mode Workout Engine
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Switch between guided home dumbbell/band program and commercial gym logger.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="inline-flex p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800 self-start sm:self-auto">
          <button
            onClick={() => setEngineMode('home')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              engineMode === 'home'
                ? 'bg-white text-stone-900 dark:bg-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Home Mode (Guided)
          </button>
          <button
            onClick={() => setEngineMode('gym')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              engineMode === 'gym'
                ? 'bg-white text-stone-900 dark:bg-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Gym Mode (Manual Logger)
          </button>
        </div>
      </div>

      {engineMode === 'home' ? (
        <div className="space-y-6">
          {/* Smart TTS Timer Bar */}
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/70 dark:border-stone-800 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Global Workout Timer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-medium uppercase tracking-wider">Workout Session Timer</span>
                  <span>Target: 40-60 min</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums">
                    {formatTime(workoutElapsedSeconds)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsWorkoutTimerRunning(!isWorkoutTimerRunning)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition ${
                        isWorkoutTimerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-stone-900 dark:bg-stone-100 dark:text-stone-900'
                      }`}
                    >
                      {isWorkoutTimerRunning ? 'Pause' : 'Start Timer'}
                    </button>
                    <button
                      onClick={() => setWorkoutElapsedSeconds(0)}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 text-xs"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Smart 60-Second Rest Timer with Web Speech API */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Smart TTS Rest Timer
                    </span>
                    <button
                      onClick={() => tts.testVoice()}
                      className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline"
                      title="Test Web Speech Voice"
                    >
                      Test Voice
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Announces at 10s and 0s via Web Speech API.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="relative flex items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-100">
                      {restSecondsRemaining}s
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {isRestTimerRunning ? (
                      <button
                        onClick={pauseRestTimer}
                        className="px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={startRestTimer}
                        className="px-2.5 py-1 rounded-md bg-orange-600 text-white text-xs font-medium hover:bg-orange-700"
                      >
                        Start 60s
                      </button>
                    )}
                    <button
                      onClick={resetRestTimer}
                      className="text-[10px] text-stone-400 hover:text-stone-600"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6-Day Split Navigation Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {HOME_SPLIT_DAYS.map((plan, idx) => (
              <button
                key={plan.dayName}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedDayIndex === idx
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                }`}
              >
                <span>{plan.dayShort}: </span>
                <span className="font-normal">{plan.title}</span>
              </button>
            ))}
          </div>

          {/* Active Workout Day Detail Card */}
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/70 dark:border-stone-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                  <span>{currentPlan.dayName} Split</span>
                  <span aria-hidden="true">·</span>
                  <span>~{currentPlan.estimatedDurationMin} mins</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-orange-600 font-semibold">{currentPlan.targetCaloriesBurn} kcal burn</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                  {currentPlan.title}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Focus: {currentPlan.focusMuscles}
                </p>
              </div>

              {/* Equipment Tags (Clean unboxed text) */}
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span>Gear:</span>
                {currentPlan.equipment.map((eq: string, i: number) => (
                  <React.Fragment key={eq}>
                    <span className="font-medium text-stone-700 dark:text-stone-300">{eq}</span>
                    {i < currentPlan.equipment.length - 1 && <span>·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="mt-5 space-y-3">
              {currentPlan.exercises.map((ex: any, index: number) => {
                const isDone = !!completedExercises[ex.id];
                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleExerciseCheck(ex.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-stone-50/60 dark:bg-stone-800/40 border-stone-200/60 dark:border-stone-800 hover:bg-stone-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        {isDone && <span className="text-xs">✓</span>}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isDone ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                            {index + 1}. {ex.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          <span className="font-medium text-stone-700 dark:text-stone-300">{ex.sets} Sets</span>
                          <span>·</span>
                          <span>{ex.reps}</span>
                          <span>·</span>
                          <span>{ex.targetMuscle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                        {ex.equipment}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Finish Workout CTA */}
            <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Checking off sets automatically triggers the 60s TTS rest timer.
              </span>
              <button
                onClick={handleFinishHomeWorkout}
                className="px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs hover:opacity-90 transition shadow-xs"
              >
                Finish & Sync Calories (+{currentPlan.targetCaloriesBurn} kcal)
              </button>
            </div>
          </section>
        </div>
      ) : (
        /* Gym Mode (Manual Logger) */
        <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-stone-200/70 dark:border-stone-800 shadow-xs max-w-2xl">
          <div className="pb-5 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Commercial Gym Manual Session Logger
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Input your commercial gym workout metrics to instantly sync with your daily calorie deficit.
            </p>
          </div>

          <form onSubmit={handleLogGymSession} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Workout Day / Target Muscles
              </label>
              <input
                type="text"
                value={gymMuscles}
                onChange={(e) => setGymMuscles(e.target.value)}
                placeholder="e.g. Chest & Triceps Power, Heavy Leg Day"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Calories Burned (kcal)
                </label>
                <input
                  type="number"
                  value={gymCalories}
                  onChange={(e) => setGymCalories(e.target.value)}
                  placeholder="450"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={gymDuration}
                  onChange={(e) => setGymDuration(e.target.value)}
                  placeholder="55"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 tabular-nums"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Workout Notes & Lifts
              </label>
              <textarea
                value={gymNotes}
                onChange={(e) => setGymNotes(e.target.value)}
                rows={3}
                placeholder="Key weights, PRs, machines utilized..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold text-sm hover:opacity-90 transition shadow-sm"
            >
              Log Gym Session & Sync {gymCalories} kcal
            </button>
          </form>
        </section>
      )}

      {/* Workout History Strip */}
      {recentWorkouts.length > 0 && (
        <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/70 dark:border-stone-800 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3">
            Recent Completed Sessions
          </h3>
          <div className="space-y-2">
            {recentWorkouts.slice(0, 4).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-3 rounded-xl bg-stone-50/60 dark:bg-stone-800/40 text-xs"
              >
                <div>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{w.dayName}</span>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    <span>{w.durationMinutes} mins</span> · <span>{w.targetMuscles}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                    +{w.caloriesBurned} kcal
                  </span>
                  <div className="text-[10px] text-stone-400">
                    {new Date(w.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
