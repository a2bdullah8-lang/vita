import React, { useState, useMemo, useEffect } from 'react';
import { DailyEntry, UserProfile } from '../types';
import { formatLocalDateString } from '../lib/calculations';

interface ReportsViewProps {
  profile: UserProfile;
  dailyEntries: DailyEntry[]; // History sorted chronologically
}

interface DayInsight {
  date: string;
  net: number;
  diff: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ profile, dailyEntries }) => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [chartView, setChartView] = useState<'calories' | 'weight'>('calories');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Filter entries to period (past 7 or past 30 days)
  const periodDaysCount = period === 'week' ? 7 : 30;

  const filteredEntries = useMemo(() => {
    return dailyEntries.slice(-periodDaysCount);
  }, [dailyEntries, periodDaysCount]);

  // Aggregate metrics
  const stats = useMemo<{
    totalDaysRecorded: number;
    daysOnTarget: number;
    avgCalories: number;
    totalBurned: number;
    avgBurned: number;
    totalSteps: number;
    avgSteps: number;
    avgWater: number;
    totalWorkouts: number;
    startingWeight: number | null;
    latestWeight: number | null;
    weightChange: number | null;
    bestDay: DayInsight | null;
    worstDay: DayInsight | null;
  }>(() => {
    // Days with activity
    const activeDays = filteredEntries.filter(
      (d) => (d.caloriesConsumed || 0) > 0 || (d.totalCaloriesBurned || 0) > 0 || (d.steps || 0) > 0 || d.weight !== null
    );

    const totalDaysRecorded = activeDays.length;
    const targetCalories = profile.dailyCalorieTarget || 2000;

    let totalConsumed = 0;
    let totalBurned = 0;
    let totalSteps = 0;
    let totalWater = 0;
    let totalWorkouts = 0;
    let daysOnTarget = 0;

    let bestDay: DayInsight | null = null;
    let worstDay: DayInsight | null = null;

    for (const d of activeDays) {
      const cal = d.caloriesConsumed || 0;
      totalConsumed += cal;
      totalBurned += d.totalCaloriesBurned || 0;
      totalSteps += d.steps || 0;
      totalWater += d.waterMl || 0;
      totalWorkouts += d.workouts?.length || 0;

      if (cal > 0 && cal <= targetCalories) {
        daysOnTarget += 1;
      }

      const diff = cal - targetCalories;
      if (!bestDay || diff < bestDay.diff) {
        bestDay = { date: d.date, net: cal, diff };
      }
      if (!worstDay || diff > worstDay.diff) {
        worstDay = { date: d.date, net: cal, diff };
      }
    }

    // Weight difference in period
    const weightEntries = activeDays.filter((d) => d.weight !== null && (d.weight as number) > 0);
    let startingWeight: number | null = null;
    let latestWeight: number | null = null;
    let weightChange: number | null = null;

    if (weightEntries.length > 0) {
      startingWeight = weightEntries[0].weight;
      latestWeight = weightEntries[weightEntries.length - 1].weight;
      if (startingWeight !== null && latestWeight !== null) {
        weightChange = Number((latestWeight - startingWeight).toFixed(1));
      }
    }

    const divisor = Math.max(1, totalDaysRecorded);

    return {
      totalDaysRecorded,
      daysOnTarget,
      avgCalories: Math.round(totalConsumed / divisor),
      totalBurned,
      avgBurned: Math.round(totalBurned / divisor),
      totalSteps,
      avgSteps: Math.round(totalSteps / divisor),
      avgWater: Math.round(totalWater / divisor),
      totalWorkouts,
      startingWeight,
      latestWeight,
      weightChange,
      bestDay,
      worstDay,
    };
  }, [filteredEntries, profile.dailyCalorieTarget]);

  // Reset AI summary when period changes
  useEffect(() => {
    setAiSummary(null);
  }, [period]);

  // Generate AI Summary using Gemini API
  const handleGenerateAiSummary = async () => {
    if (stats.totalDaysRecorded < 2) return;
    setIsGeneratingAi(true);

    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');

    const promptText = `Analyze this user's fitness and weight loss report for the past ${period === 'week' ? '7 days' : '30 days'}:
- Days tracked: ${stats.totalDaysRecorded} days
- Daily Calorie Target: ${profile.dailyCalorieTarget} kcal
- Average Calories Consumed: ${stats.avgCalories} kcal/day
- Days on Target: ${stats.daysOnTarget} of ${stats.totalDaysRecorded} days
- Total Active Calories Burned: ${stats.totalBurned} kcal
- Average Daily Steps: ${stats.avgSteps} steps
- Workouts completed: ${stats.totalWorkouts} sessions
- Weight change: ${stats.weightChange !== null ? `${stats.weightChange} kg` : 'Not recorded'}
- Goal: Drop from ${profile.currentWeightKg} kg to ${profile.targetWeightKg} kg with a weekly pace of ${profile.weeklyLossPace} kg/week.

Provide a short, direct, highly encouraging progress review:
1. Executive summary of their discipline and calorie compliance.
2. What went well and key observation.
3. Exactly 2 or 3 specific, actionable recommendations for next week to maintain fat loss pace. Keep tone professional, empathetic, and motivating.`;

    try {
      if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            setAiSummary(reply);
            setIsGeneratingAi(false);
            return;
          }
        }
      }

      // Offline rule-based summary
      const compliance = Math.round((stats.daysOnTarget / stats.totalDaysRecorded) * 100);
      setAiSummary(
        `**Weekly Progress Summary:**\n\nYou logged ${stats.totalDaysRecorded} days with an average intake of ${stats.avgCalories} kcal/day (target: ${profile.dailyCalorieTarget} kcal). You met your deficit target on ${stats.daysOnTarget} days (${compliance}% compliance).\n\n**Key Observations:**\n- Active output: You completed ${stats.totalWorkouts} workouts and averaged ${stats.avgSteps.toLocaleString()} steps/day.\n- Weight trend: ${stats.weightChange !== null ? `${stats.weightChange > 0 ? `+${stats.weightChange}` : stats.weightChange} kg shift towards ${profile.targetWeightKg} kg` : 'Continue logging morning check-ins to track your delta'}.\n\n**Next Steps:**\n1. Maintain steady 10,000 steps daily.\n2. Keep protein above ${profile.dailyProteinTarget}g to protect lean muscle mass.\n3. Keep water above 2.5L to optimize recovery.`
      );
    } catch {
      setAiSummary('Great consistency logging your data! Keep maintaining your calorie deficit and hydration.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const maxCalorieInChart = useMemo(() => {
    let max = profile.dailyCalorieTarget || 2000;
    filteredEntries.forEach((d) => {
      const c = d.caloriesConsumed || 0;
      if (c > max) max = c;
    });
    return Math.round(max * 1.15);
  }, [filteredEntries, profile.dailyCalorieTarget]);

  const maxWeightInChart = useMemo(() => {
    let max = profile.currentWeightKg || 100;
    filteredEntries.forEach((d) => {
      if (d.weight && d.weight > max) max = d.weight;
    });
    return max + 2;
  }, [filteredEntries, profile.currentWeightKg]);

  const minWeightInChart = useMemo(() => {
    let min = profile.targetWeightKg || 90;
    filteredEntries.forEach((d) => {
      if (d.weight && d.weight < min) min = d.weight;
    });
    return Math.max(0, min - 2);
  }, [filteredEntries, profile.targetWeightKg]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
            Performance & Weight Reports
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Real aggregated analytics computed from your saved daily logs.
          </p>
        </div>

        {/* Week / Month Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800 self-start sm:self-auto">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              period === 'week'
                ? 'bg-white text-stone-900 dark:bg-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              period === 'month'
                ? 'bg-white text-stone-900 dark:bg-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Past 30 Days
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Avg Calories
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-white tabular-nums mt-1 block">
            {stats.avgCalories} <span className="text-xs font-normal text-stone-400">kcal</span>
          </span>
          <span className="text-[11px] text-stone-400">
            Target: {profile.dailyCalorieTarget} kcal
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Days on Target
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 block">
            {stats.daysOnTarget} <span className="text-xs font-normal text-stone-400">/ {stats.totalDaysRecorded}</span>
          </span>
          <span className="text-[11px] text-stone-400">
            {stats.totalDaysRecorded > 0 ? `${Math.round((stats.daysOnTarget / stats.totalDaysRecorded) * 100)}% compliance` : 'No days yet'}
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Active Burned
          </span>
          <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums mt-1 block">
            {stats.totalBurned} <span className="text-xs font-normal text-stone-400">kcal</span>
          </span>
          <span className="text-[11px] text-stone-400">
            {stats.totalWorkouts} workouts logged
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
            Weight Change
          </span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-white tabular-nums mt-1 block">
            {stats.weightChange !== null ? (
              <span className={stats.weightChange <= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {stats.weightChange > 0 ? `+${stats.weightChange}` : `${stats.weightChange}`} kg
              </span>
            ) : (
              <span className="text-stone-400 text-base font-normal">No logs</span>
            )}
          </span>
          <span className="text-[11px] text-stone-400">
            In selected period
          </span>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs">
          <span className="text-stone-400 text-[10px] uppercase font-bold block">Average Steps</span>
          <strong className="text-base font-bold text-stone-900 dark:text-white tabular-nums block mt-0.5">
            {stats.avgSteps.toLocaleString()}
          </strong>
          <span className="text-stone-500 text-[10px]">Total: {stats.totalSteps.toLocaleString()}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs">
          <span className="text-stone-400 text-[10px] uppercase font-bold block">Daily Water Avg</span>
          <strong className="text-base font-bold text-cyan-600 dark:text-cyan-400 tabular-nums block mt-0.5">
            {stats.avgWater} ml
          </strong>
          <span className="text-stone-500 text-[10px]">Goal: {profile.dailyWaterGoalMl || 3000} ml</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs">
          <span className="text-stone-400 text-[10px] uppercase font-bold block">Best Deficit Day</span>
          <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">
            {stats.bestDay ? formatLocalDateString(stats.bestDay.date) : 'N/A'}
          </strong>
          <span className="text-stone-500 text-[10px]">{stats.bestDay ? `${stats.bestDay.net} kcal consumed` : '—'}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs">
          <span className="text-stone-400 text-[10px] uppercase font-bold block">Highest Intake</span>
          <strong className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums block mt-0.5">
            {stats.worstDay ? formatLocalDateString(stats.worstDay.date) : 'N/A'}
          </strong>
          <span className="text-stone-500 text-[10px]">{stats.worstDay ? `${stats.worstDay.net} kcal consumed` : '—'}</span>
        </div>
      </div>

      {/* Chart Section: Calories & Weight Over Time */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              {chartView === 'calories'
                ? `Calorie Intake vs. Target (${period === 'week' ? 'Past 7 Days' : 'Past 30 Days'})`
                : `Weight Logs Trend (${period === 'week' ? 'Past 7 Days' : 'Past 30 Days'})`}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {chartView === 'calories'
                ? `Target limit: ${profile.dailyCalorieTarget} kcal deficit allowance.`
                : `Target goal: ${profile.targetWeightKg} kg.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartView('calories')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                chartView === 'calories'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              Calories
            </button>
            <button
              onClick={() => setChartView('weight')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                chartView === 'weight'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              }`}
            >
              Weight (kg)
            </button>
          </div>
        </div>

        {/* Visual Graph */}
        {filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            No daily records found in this period.
          </div>
        ) : chartView === 'calories' ? (
          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 w-full">
              {filteredEntries.map((entry) => {
                const cal = entry.caloriesConsumed || 0;
                const isOver = cal > (profile.dailyCalorieTarget || 2000);
                const heightPct = Math.min(100, Math.round((cal / maxCalorieInChart) * 100));

                return (
                  <div key={entry.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono text-stone-400 opacity-0 group-hover:opacity-100 transition mb-1 tabular-nums">
                      {cal}
                    </span>
                    <div className="w-full max-w-[28px] bg-stone-100 dark:bg-stone-800 rounded-t-md h-full flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : 'bg-stone-900 dark:bg-stone-200'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 truncate w-full text-center">
                      {entry.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 w-full">
              {filteredEntries.map((entry) => {
                const w = entry.weight;
                const weightRange = Math.max(1, maxWeightInChart - minWeightInChart);
                const heightPct =
                  w !== null ? Math.min(100, Math.max(15, Math.round(((w - minWeightInChart) / weightRange) * 100))) : 0;

                return (
                  <div key={entry.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300 transition mb-1 tabular-nums">
                      {w !== null ? `${w}` : '—'}
                    </span>
                    <div className="w-full max-w-[28px] bg-stone-100 dark:bg-stone-800 rounded-t-md h-full flex items-end overflow-hidden">
                      {w !== null && (
                        <div
                          className="w-full rounded-t-md bg-stone-900 dark:bg-stone-200 transition-all duration-500"
                          style={{ height: `${heightPct}%` }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 truncate w-full text-center">
                      {entry.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* AI Progress Summary Section (Gemini Integration) */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base text-rose-500">✦</span>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                AI Coach Progress Review (Gemini API)
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Synthesized strictly from your verified logged numbers.
            </p>
          </div>

          {stats.totalDaysRecorded >= 2 && (
            <button
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 shrink-0"
            >
              {isGeneratingAi ? 'Analyzing Data...' : aiSummary ? 'Regenerate Analysis' : 'Generate AI Review'}
            </button>
          )}
        </div>

        {/* State when fewer than 2 days of real data */}
        {stats.totalDaysRecorded < 2 ? (
          <div className="py-8 text-center space-y-2">
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
              Not enough data yet
            </span>
            <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
              Log at least 2 days of meals or activity to generate your personalized AI progress report without simulated estimates.
            </p>
          </div>
        ) : aiSummary ? (
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line animate-fadeIn">
            {aiSummary}
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {stats.totalDaysRecorded} days of data recorded in this period. Tap above to synthesize your AI feedback.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
