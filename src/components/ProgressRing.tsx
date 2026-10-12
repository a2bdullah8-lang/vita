import React from 'react';

interface ProgressRingProps {
  caloriesConsumed: number;
  calorieTarget: number;
  caloriesBurned: number;
  burnedTarget: number;
  steps: number;
  stepGoal: number;
  size?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  caloriesConsumed,
  calorieTarget,
  caloriesBurned,
  burnedTarget,
  steps,
  stepGoal,
  size = 280,
}) => {
  const center = size / 2;
  const strokeWidth = 14;

  // Radii for 3 concentric rings
  const rCalories = size * 0.41;
  const rBurned = size * 0.31;
  const rSteps = size * 0.21;

  const circCalories = 2 * Math.PI * rCalories;
  const circBurned = 2 * Math.PI * rBurned;
  const circSteps = 2 * Math.PI * rSteps;

  // Calorie ratio & warning state
  const calorieRatio = calorieTarget > 0 ? caloriesConsumed / calorieTarget : 0;
  const burnedRatio = burnedTarget > 0 ? caloriesBurned / burnedTarget : 0;
  const stepRatio = stepGoal > 0 ? steps / stepGoal : 0;

  // Stroke offsets (clamp to 1.0 for visual loop or slight overflow)
  const offsetCalories = circCalories * (1 - Math.min(1, calorieRatio));
  const offsetBurned = circBurned * (1 - Math.min(1, burnedRatio));
  const offsetSteps = circSteps * (1 - Math.min(1, stepRatio));

  // Dynamic color for calories: clean slate -> amber if approaching -> coral/rose if exceeded
  let calorieColor = '#292524'; // Stone-800
  if (calorieRatio > 1.0) {
    calorieColor = '#E11D48'; // Rose-600 warning
  } else if (calorieRatio > 0.85) {
    calorieColor = '#D97706'; // Amber-600 caution
  }

  const burnedColor = '#EA580C'; // Vibrant Orange-600
  const stepsColor = '#059669'; // Emerald-600

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track 1: Calories Consumed */}
        <circle
          cx={center}
          cy={center}
          r={rCalories}
          fill="none"
          stroke="#F5F5F4"
          strokeWidth={strokeWidth}
          className="dark:stroke-stone-800/60"
        />
        <circle
          cx={center}
          cy={center}
          r={rCalories}
          fill="none"
          stroke={calorieColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circCalories}
          strokeDashoffset={offsetCalories}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Track 2: Calories Burned */}
        <circle
          cx={center}
          cy={center}
          r={rBurned}
          fill="none"
          stroke="#F5F5F4"
          strokeWidth={strokeWidth}
          className="dark:stroke-stone-800/60"
        />
        <circle
          cx={center}
          cy={center}
          r={rBurned}
          fill="none"
          stroke={burnedColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circBurned}
          strokeDashoffset={offsetBurned}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Track 3: Daily Steps */}
        <circle
          cx={center}
          cy={center}
          r={rSteps}
          fill="none"
          stroke="#F5F5F4"
          strokeWidth={strokeWidth}
          className="dark:stroke-stone-800/60"
        />
        <circle
          cx={center}
          cy={center}
          r={rSteps}
          fill="none"
          stroke={stepsColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circSteps}
          strokeDashoffset={offsetSteps}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center Metrics Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
        <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Net Calories
        </span>
        <span className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
          {Math.max(0, caloriesConsumed - caloriesBurned)}
        </span>
        <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums mt-0.5">
          {Math.round(calorieRatio * 100)}% of limit
        </span>
      </div>

      {/* Legend below the ring */}
      <div className="mt-4 flex items-center justify-center gap-5 text-xs text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: calorieColor }} />
          <span>Consumed ({caloriesConsumed})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
          <span>Burned ({caloriesBurned})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Steps ({steps.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
};
