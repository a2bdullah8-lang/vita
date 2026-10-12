import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import { ActivityLevel, DietType, Gender, UserProfile } from '../types';
import { ACTIVITY_MULTIPLIERS, computeProfileMetrics } from '../lib/calculations';
import { saveUserProfile } from '../lib/firebase';

interface OnboardingModalProps {
  user: User;
  initialProfile?: UserProfile | null;
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  initialProfile,
  isOpen,
  onComplete,
  onCancel,
  isEditing = false,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form states
  const [name, setName] = useState(initialProfile?.name || user.displayName || 'Athlete');
  const [age, setAge] = useState<number>(initialProfile?.age || 22);
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'male');
  const [heightCm, setHeightCm] = useState<number>(initialProfile?.heightCm || 180);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(initialProfile?.currentWeightKg || 106);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(initialProfile?.targetWeightKg || 96);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activityLevel || 'moderate');
  const [weeklyLossPace, setWeeklyLossPace] = useState<number>(initialProfile?.weeklyLossPace || 0.75);
  const [dietType, setDietType] = useState<DietType>(initialProfile?.dietType || 'high_protein');
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState<number>(initialProfile?.workoutDaysPerWeek || 5);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time computed metrics using Mifflin-St Jeor formula
  const calculated = useMemo(() => {
    return computeProfileMetrics({
      age: Number(age) || 22,
      gender,
      heightCm: Number(heightCm) || 180,
      currentWeightKg: Number(currentWeightKg) || 106,
      targetWeightKg: Number(targetWeightKg) || 96,
      activityLevel,
      weeklyLossPace: Number(weeklyLossPace) || 0.75,
    });
  }, [age, gender, heightCm, currentWeightKg, targetWeightKg, activityLevel, weeklyLossPace]);

  if (!isOpen) return null;

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const profileData: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      name: name.trim() || 'Athlete',
      age: Number(age),
      gender,
      heightCm: Number(heightCm),
      currentWeightKg: Number(currentWeightKg),
      targetWeightKg: Number(targetWeightKg),
      activityLevel,
      weeklyLossPace: Number(weeklyLossPace),
      dietType,
      workoutDaysPerWeek: Number(workoutDaysPerWeek),
      bmr: calculated.bmr,
      tdee: calculated.tdee,
      dailyCalorieDeficit: calculated.dailyCalorieDeficit,
      dailyCalorieTarget: calculated.dailyCalorieTarget,
      dailyProteinTarget: calculated.dailyProteinTarget,
      dailyWaterGoalMl: calculated.dailyWaterGoalMl,
      dailyStepGoal: calculated.dailyStepGoal,
      onboardingCompleted: true,
      themeMode: initialProfile?.themeMode || 'light',
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserProfile(profileData);
      onComplete(profileData);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-xl my-6 bg-[#FCFBF9] dark:bg-[#141312] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 overflow-hidden text-[#1C1917] dark:text-[#F5F5F4]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              <span>{isEditing ? 'Profile & Goals' : `Step ${step} of 3`}</span>
              <span>·</span>
              <span>Mifflin-St Jeor Engine</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white mt-0.5">
              {isEditing ? 'Update Body Profile & Goals' : step === 1 ? 'Personal & Body Baseline' : step === 2 ? 'Activity & Routine' : 'Target Deficit Architecture'}
            </h2>
          </div>
          {isEditing && onCancel && (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleFinish} className="mt-5 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Neutral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Current (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="300"
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none font-semibold text-stone-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Target (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="300"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none font-semibold text-emerald-600 dark:text-emerald-400"
                    required
                  />
                </div>
              </div>

              {/* BMR Preview */}
              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold block text-stone-900 dark:text-stone-100">Calculated Basal Metabolic Rate (BMR)</span>
                  <span className="text-stone-500 text-[11px]">Energy burned at complete rest (Mifflin-St Jeor formula)</span>
                </div>
                <span className="text-base font-extrabold text-stone-900 dark:text-white tabular-nums">
                  {calculated.bmr} <span className="text-xs font-normal text-stone-400">kcal</span>
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Daily Activity Level
                </label>
                <div className="space-y-2">
                  {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((level) => {
                    const info = ACTIVITY_MULTIPLIERS[level];
                    return (
                      <label
                        key={level}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          activityLevel === level
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="activityLevel"
                            checked={activityLevel === level}
                            onChange={() => setActivityLevel(level)}
                            className="hidden"
                          />
                          <div>
                            <span className="text-xs font-bold block">{info.label}</span>
                            <span className={`text-[11px] ${activityLevel === level ? 'text-stone-300 dark:text-stone-700' : 'text-stone-500'}`}>
                              {info.description}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-semibold tabular-nums shrink-0">
                          {info.multiplier}x
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Workout Days per Week
                  </label>
                  <select
                    value={workoutDaysPerWeek}
                    onChange={(e) => setWorkoutDaysPerWeek(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {num} days / week
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Diet Preference
                  </label>
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value as DietType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none capitalize"
                  >
                    <option value="high_protein">High Protein (Recommended)</option>
                    <option value="standard">Standard Balanced</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Plant-Based / Vegan</option>
                    <option value="keto">Ketogenic</option>
                  </select>
                </div>
              </div>

              {/* TDEE Result */}
              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold block text-stone-900 dark:text-stone-100">Calculated TDEE (Maintenance)</span>
                  <span className="text-stone-500 text-[11px]">BMR × Activity Multiplier</span>
                </div>
                <span className="text-base font-extrabold text-stone-900 dark:text-white tabular-nums">
                  {calculated.tdee} <span className="text-xs font-normal text-stone-400">kcal/day</span>
                </span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Weekly Weight Loss Pace
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.25, 0.5, 0.75, 1.0].map((pace) => (
                    <button
                      type="button"
                      key={pace}
                      onClick={() => setWeeklyLossPace(pace)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold text-center border transition ${
                        weeklyLossPace === pace
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <span>{pace} kg/wk</span>
                      <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                        -{Math.round(pace * 1100)} kcal/d
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Formula Architecture Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
                <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider block">
                  Your Scientific Target Architecture
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[11px] text-stone-500 block">Daily Calorie Target</span>
                    <span className="text-xl font-black text-stone-900 dark:text-white tabular-nums mt-0.5 block">
                      {calculated.dailyCalorieTarget} <span className="text-xs font-normal text-stone-400">kcal</span>
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                      Deficit: -{calculated.dailyCalorieDeficit} kcal/day
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[11px] text-stone-500 block">Daily Protein Target</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
                      {calculated.dailyProteinTarget} <span className="text-xs font-normal text-stone-400">g</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      2.0g / kg bodyweight
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[11px] text-stone-500 block">Hydration Target</span>
                    <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums mt-0.5 block">
                      {calculated.dailyWaterGoalMl} <span className="text-xs font-normal text-stone-400">ml</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      35ml / kg bodyweight
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                    <span className="text-[11px] text-stone-500 block">Daily Steps Goal</span>
                    <span className="text-xl font-black text-stone-900 dark:text-white tabular-nums mt-0.5 block">
                      10,000 <span className="text-xs font-normal text-stone-400">steps</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      Active baseline
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
                  Formula applied: BMR ({calculated.bmr}) × Activity ({ACTIVITY_MULTIPLIERS[activityLevel].multiplier}) = TDEE ({calculated.tdee}) − Deficit ({calculated.dailyCalorieDeficit}) = <strong>{calculated.dailyCalorieTarget} kcal/day</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Navigation & Submit Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition shadow-xs"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold hover:opacity-90 transition shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Saving Profile...' : isEditing ? 'Save Changes' : 'Launch Dashboard'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
