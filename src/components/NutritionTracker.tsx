import React, { useState } from 'react';
import { DailyEntry, MealItem, UserProfile } from '../types';

interface NutritionTrackerProps {
  profile: UserProfile;
  todayEntry: DailyEntry;
  onUpdateTodayEntry: (updated: DailyEntry) => Promise<void>;
}

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({
  profile,
  todayEntry,
  onUpdateTodayEntry,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [type, setType] = useState<MealItem['type']>('lunch');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  const meals = todayEntry.meals || [];
  const totalCalories = todayEntry.caloriesConsumed || 0;
  const totalProtein = todayEntry.proteinGrams || 0;
  const totalCarbs = todayEntry.carbsGrams || 0;
  const totalFat = todayEntry.fatGrams || 0;

  const targetCalories = profile.dailyCalorieTarget || 2000;
  const targetProtein = profile.dailyProteinTarget || 150;
  const remainingCalories = targetCalories - totalCalories;
  const caloriePercent = Math.round((totalCalories / targetCalories) * 100);

  // Open modal for new meal
  const handleOpenAdd = () => {
    setEditingMealId(null);
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setType('lunch');
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = (meal: MealItem) => {
    setEditingMealId(meal.id);
    setName(meal.name);
    setCalories(meal.calories.toString());
    setProtein(meal.protein.toString());
    setCarbs(meal.carbs.toString());
    setFat(meal.fat.toString());
    setType(meal.type);
    setTime(meal.time);
    setShowModal(true);
  };

  // Save (Add or Update)
  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !calories) return;

    const parsedCal = Math.max(0, parseInt(calories, 10) || 0);
    const parsedProtein = Math.max(0, parseInt(protein, 10) || 0);
    const parsedCarbs = Math.max(0, parseInt(carbs, 10) || 0);
    const parsedFat = Math.max(0, parseInt(fat, 10) || 0);

    let nextMeals: MealItem[];

    if (editingMealId) {
      // Update existing
      nextMeals = meals.map((m) =>
        m.id === editingMealId
          ? {
              ...m,
              name: name.trim(),
              calories: parsedCal,
              protein: parsedProtein,
              carbs: parsedCarbs,
              fat: parsedFat,
              type,
              time,
            }
          : m
      );
    } else {
      // Add new
      const newMeal: MealItem = {
        id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        calories: parsedCal,
        protein: parsedProtein,
        carbs: parsedCarbs,
        fat: parsedFat,
        type,
        time,
      };
      nextMeals = [...meals, newMeal];
    }

    // Recalculate daily totals
    const nextConsumed = nextMeals.reduce((sum, m) => sum + m.calories, 0);
    const nextProt = nextMeals.reduce((sum, m) => sum + m.protein, 0);
    const nextCarb = nextMeals.reduce((sum, m) => sum + m.carbs, 0);
    const nextFatVal = nextMeals.reduce((sum, m) => sum + m.fat, 0);

    const updatedDay: DailyEntry = {
      ...todayEntry,
      meals: nextMeals,
      caloriesConsumed: nextConsumed,
      proteinGrams: nextProt,
      carbsGrams: nextCarb,
      fatGrams: nextFatVal,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateTodayEntry(updatedDay);
    setShowModal(false);
  };

  // Delete Meal
  const handleDeleteMeal = async (id: string) => {
    const nextMeals = meals.filter((m) => m.id !== id);
    const nextConsumed = nextMeals.reduce((sum, m) => sum + m.calories, 0);
    const nextProt = nextMeals.reduce((sum, m) => sum + m.protein, 0);
    const nextCarb = nextMeals.reduce((sum, m) => sum + m.carbs, 0);
    const nextFatVal = nextMeals.reduce((sum, m) => sum + m.fat, 0);

    const updatedDay: DailyEntry = {
      ...todayEntry,
      meals: nextMeals,
      caloriesConsumed: nextConsumed,
      proteinGrams: nextProt,
      carbsGrams: nextCarb,
      fatGrams: nextFatVal,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateTodayEntry(updatedDay);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
            Daily Nutrition & Macros
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Manual meal tracking calibrated to your {profile.dailyCalorieTarget} kcal deficit ceiling.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition self-start sm:self-auto shadow-xs flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span>
          <span>Log Meal</span>
        </button>
      </div>

      {/* Warning System */}
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
                You have logged <strong>{totalCalories} kcal</strong> today against your target ceiling of <strong>{targetCalories} kcal</strong>. Consider a brisk walk or keeping remaining snacks light.
              </p>
            </div>
          </div>
        </div>
      ) : caloriePercent >= 85 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ▲
            </span>
            <div>
              <h2 className="text-sm font-bold">
                Approaching Deficit Limit — {remainingCalories} kcal Remaining
              </h2>
              <p className="text-xs mt-1 text-amber-700 dark:text-amber-300 leading-relaxed">
                You are at <strong>{caloriePercent}%</strong> of your daily target. Prioritize high protein items for your remaining intake today.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Macronutrient Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Calories
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-white tabular-nums mt-1 block">
            {totalCalories}
          </span>
          <span className="text-[11px] text-stone-400">
            Target: {targetCalories} kcal ({caloriePercent}%)
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Protein
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
            {totalProtein} <span className="text-xs font-normal text-stone-400">g</span>
          </span>
          <span className="text-[11px] text-stone-400">
            Target: {targetProtein}g ({Math.round((totalProtein / targetProtein) * 100)}%)
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Carbohydrates
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-white tabular-nums mt-1 block">
            {totalCarbs} <span className="text-xs font-normal text-stone-400">g</span>
          </span>
          <span className="text-[11px] text-stone-400">
            Workout fuel
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Healthy Fats
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-white tabular-nums mt-1 block">
            {totalFat} <span className="text-xs font-normal text-stone-400">g</span>
          </span>
          <span className="text-[11px] text-stone-400">
            Hormonal health
          </span>
        </div>
      </div>

      {/* Logged Meals List */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            Today's Logged Meals ({meals.length})
          </h3>
          <span className="text-xs font-mono text-stone-400">{todayEntry.date}</span>
        </div>

        {meals.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto text-lg">
              🍽️
            </div>
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
              Log your first meal
            </p>
            <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
              Nothing logged for today yet. Every meal you log will update your calories, protein, and deficit rings in real time.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition"
            >
              + Log Meal Now
            </button>
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
                    <span className="font-semibold text-stone-900 dark:text-white">{meal.name}</span>
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                      {meal.type} · {meal.time}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                    <span>{meal.protein}g Protein</span> · <span>{meal.carbs}g Carbs</span> · <span>{meal.fat}g Fat</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                    {meal.calories} kcal
                  </span>
                  <button
                    onClick={() => handleOpenEdit(meal)}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition text-xs p-1"
                    title="Edit meal"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="text-stone-400 hover:text-rose-600 transition text-xs p-1"
                    title="Delete meal"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#FCFBF9] dark:bg-[#141312] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {editingMealId ? 'Edit Meal Entry' : 'Log New Meal'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Meal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Breast with Rice"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="450"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-semibold tabular-nums focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="40"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Carbohydrates (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="35"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="8"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs capitalize focus:outline-none"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Time Logged
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition mt-2"
              >
                {editingMealId ? 'Update Meal' : 'Save Meal Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
