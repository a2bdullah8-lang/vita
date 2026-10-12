import React, { useState } from 'react';
import { loginWithGoogle } from '../lib/firebase';

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Failed to sign in with Google. Please check your network and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#FCFBF9] dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F5F4] transition-colors">
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-8 animate-fadeIn">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 flex items-center justify-center text-2xl font-black shadow-md">
            V
          </div>
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-stone-400 dark:text-stone-500">
            Aesthetic Health Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            VITA
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-sm leading-relaxed">
            Zero mock data. Mifflin-St Jeor metabolic tracking, daily nutrition deficit accounting, and AI coaching calibrated strictly to your real body stats.
          </p>
        </div>

        {/* Feature Highlights (Clean unboxed editorial text) */}
        <div className="w-full py-5 px-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3.5 text-left text-xs">
          <div className="flex items-start gap-3">
            <span className="text-base text-stone-900 dark:text-stone-100">✦</span>
            <div>
              <strong className="text-stone-900 dark:text-stone-100 block">Metabolic Formula Precision</strong>
              <span className="text-stone-500 dark:text-stone-400">Calculates your real BMR, TDEE, and daily deficit based on your stats.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-base text-stone-900 dark:text-stone-100">✦</span>
            <div>
              <strong className="text-stone-900 dark:text-stone-100 block">Automatic Local Midnight Reset</strong>
              <span className="text-stone-500 dark:text-stone-400">Starts each day fresh at zero while keeping your history in Firestore.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-base text-stone-900 dark:text-stone-100">✦</span>
            <div>
              <strong className="text-stone-900 dark:text-stone-100 block">Weekly & Monthly AI Reports</strong>
              <span className="text-stone-500 dark:text-stone-400">Real weight trend lines, net calorie delta, and Gemini data summaries.</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="w-full p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Sign In CTA */}
        <div className="w-full space-y-3">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            Secure Google authentication via Firebase · Offline-first PWA enabled
          </p>
        </div>
      </div>
    </div>
  );
};
