import React, { useState } from 'react';
import { MealItem, UserProfile } from '../types';

interface NutritionTrackerProps {
  profile: UserProfile;
  meals: MealItem[];
  onAddMeal: (meal: MealItem) => void;
  onDeleteMeal: (mealId: string) => void;
}

const QUICK_PRESETS = [
  { name: 'Grilled Chicken Breast & Jasmine Rice', calories: 480, protein: 46, carbs: 48, fat: 6, type: 'lunch' as const },
  { name: '4 Egg Whites + 1 Whole Egg & Toast', calories: 310, protein: 28, carbs: 26, fat: 7, type: 'breakfast' as const },
  { name: 'Whey Protein Isolate Shake (Water/Almond Milk)', calories: 140, protein: 27, carbs: 3, fat: 1.5, type: 'snack' as const },
  { name: 'Non-Fat Greek Yogurt & Fresh Berries', calories: 175, protein: 20, carbs: 18, fat: 1, type: 'snack' as const },
  { name: 'Steaked Tuna Salad with Greens', calories: 280, protein: 38, carbs: 8, fat: 5, type: 'dinner' as const },
  { name: 'Cottage Cheese & Apple Slices', calories: 210, protein: 24, carbs: 22, fat: 3, type: 'snack' as const },
];

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({
  profile,
  meals,
  onAddMeal,
  onDeleteMeal,
}) => {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [showForm, setShowForm] = useState(false);

  // Calorie calculations
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.proteinGrams, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbsGrams || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fatGrams || 0), 0);

  const calorieLimit = profile.dailyCalorieTarget || 1850;
  const remainingCalories = calorieLimit - totalCalories;
  const caloriePercent = Math.round((totalCalories / calorieLimit) * 100);

  // Recommended protein target: 1.6g - 1.8g per kg bodyweight (106kg -> ~170-190g)
  const proteinTarget = 175;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || !calories) return;

    const newMeal: MealItem = {
      id: `m_${Date.now()}`,
      userId: profile.uid,
      name: mealName.trim(),
      calories: Math.max(0, parseInt(calories) || 0),
      proteinGrams: Math.max(0, parseInt(protein) || 0),
      carbsGrams: Math.max(0, parseInt(carbs) || 0),
      fatGrams: Math.max(0, parseInt(fat) || 0),
      mealType,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onAddMeal(newMeal);
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setShowForm(false);
  };

  const handleAddPreset = (preset: typeof QUICK_PRESETS[0]) => {
    const newMeal: MealItem = {
      id: `m_preset_${Date.now()}`,
      userId: profile.uid,
      name: preset.name,
      calories: preset.calories,
      proteinGrams: preset.protein,
      carbsGrams: preset.carbs,
      fatGrams: preset.fat,
      mealType: preset.type,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    onAddMeal(newMeal);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Nutrition & Deficit Tracker
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Calorie deficit engine calibrated for aggressive 1.5kg/week fat reduction at {profile.currentWeightKg}kg.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition self-start sm:self-auto shadow-xs"
        >
          {showForm ? 'Close Entry Form' : '+ Log Custom Meal'}
        </button>
      </div>

      {/* Visual Warning System for 1.5kg/week Deficit Limit */}
      {caloriePercent > 100 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              !
            </span>
            <div>
              <h2 className="text-sm font-bold">
                Deficit Ceiling Exceeded by {Math.abs(remainingCalories)} kcal
              </h2>
              <p className="text-xs mt-1 text-rose-700 dark:text-rose-300 leading-relaxed">
                You have consumed <strong>{totalCalories} kcal</strong> against your <strong>{calorieLimit} kcal</strong> limit.
                To preserve your aggressive 1.5kg/week target towards 96kg, avoid further intake tonight or complete a 45-minute brisk walk to offset.
              </p>
            </div>
          </div>
        </div>
      ) : caloriePercent >= 80 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ▲
            </span>
            <div>
              <h2 className="text-sm font-bold">
                Approaching Deficit Limit — Only {remainingCalories} kcal Remaining
              </h2>
              <p className="text-xs mt-1 text-amber-700 dark:text-amber-300 leading-relaxed">
                You are at <strong>{caloriePercent}%</strong> of your daily allowance. Prioritize lean protein sources (chicken, egg whites, whey) for your remaining intake to prevent exceeding your ceiling.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-stone-800 dark:text-stone-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">Optimal Deficit Pace</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-500">{remainingCalories} kcal remaining for today</span>
            </div>
            <span className="font-bold tabular-nums">{caloriePercent}% of limit</span>
          </div>
        </div>
      )}

      {/* Calorie & Macronutrient Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Calories Consumed
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums mt-1 block">
            {totalCalories}
          </span>
          <span className="text-[11px] text-stone-500">
            Target: {calorieLimit} kcal
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Protein (Muscle Shield)
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
            {totalProtein} <span className="text-xs font-normal text-stone-400">g</span>
          </span>
          <span className="text-[11px] text-stone-500">
            Target: {proteinTarget}g ({Math.round((totalProtein / proteinTarget) * 100)}%)
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Carbohydrates
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums mt-1 block">
            {totalCarbs} <span className="text-xs font-normal text-stone-400">g</span>
          </span>
          <span className="text-[11px] text-stone-500">
            Complex workout fuel
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/70 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Healthy Fats
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tabular-nums mt-1 block">
            {totalFat} <span className="text-xs font-normal text-stone-400">g</span>
          </span>
          <span className="text-[11px] text-stone-500">
            Hormonal baseline
          </span>
        </div>
      </div>

      {/* Custom Meal Form (Collapsible) */}
      {showForm && (
        <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/70 dark:border-stone-800 shadow-xs max-w-2xl animate-fadeIn">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
            Log New Meal or Snack
          </h3>
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Meal Name
              </label>
              <input
                type="text"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g. 200g Grilled Chicken Salad, Whey Shake"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="380"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="35"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="25"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="8"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Meal Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`py-2 text-xs font-medium rounded-lg capitalize transition ${
                      mealType === t
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs hover:opacity-90 transition"
            >
              Log Meal & Update Deficit
            </button>
          </form>
        </section>
      )}

      {/* 1-Tap Quick-Add High Protein Presets */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/70 dark:border-stone-800 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
          1-Tap High Protein Presets (Calibrated for Weight Cut)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleAddPreset(p)}
              className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 text-left hover:border-stone-400 dark:hover:border-stone-600 transition flex items-center justify-between group bg-stone-50/40 dark:bg-stone-800/20"
            >
              <div>
                <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block group-hover:text-orange-600 transition">
                  {p.name}
                </span>
                <span className="text-[11px] text-stone-500 tabular-nums">
                  {p.calories} kcal · <strong className="text-emerald-600">{p.protein}g protein</strong>
                </span>
              </div>
              <span className="text-xs font-bold text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100">
                +
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Logged Meals List */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/70 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Today's Logged Meals
          </h3>
          <span className="text-xs text-stone-500 tabular-nums">
            {meals.length} items logged
          </span>
        </div>

        {meals.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            No meals logged today yet. Use 1-Tap presets or log your meals above.
          </div>
        ) : (
          <div className="space-y-2.5">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 dark:text-stone-100">{meal.name}</span>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {meal.mealType}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                    <span>{meal.proteinGrams}g Protein</span> · <span>{meal.carbsGrams || 0}g Carbs</span> · <span>{meal.fatGrams || 0}g Fat</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                    {meal.calories} kcal
                  </span>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className="text-stone-400 hover:text-rose-600 transition text-xs p-1"
                    title="Delete meal entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
