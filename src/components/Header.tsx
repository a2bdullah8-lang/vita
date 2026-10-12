import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'dashboard' | 'workouts' | 'nutrition' | 'reminders';
  setActiveTab: (tab: 'dashboard' | 'workouts' | 'nutrition' | 'reminders') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  openSosModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  user,
  onLogin,
  onLogout,
  openSosModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FCFBF9]/90 dark:bg-[#121110]/90 border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-stone-50 dark:text-stone-900 font-extrabold text-sm tracking-wider shadow-sm">
              V
            </div>
            <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
              VITA
            </span>
          </button>
        </div>

        {/* Zone 2: 4 single-line nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'dashboard'
                ? 'text-stone-900 dark:text-white border-stone-900 dark:border-white font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'workouts'
                ? 'text-stone-900 dark:text-white border-stone-900 dark:border-white font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Workouts
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'nutrition'
                ? 'text-stone-900 dark:text-white border-stone-900 dark:border-white font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Nutrition
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`whitespace-nowrap transition-colors pb-0.5 border-b-2 ${
              activeTab === 'reminders'
                ? 'text-stone-900 dark:text-white border-stone-900 dark:border-white font-semibold'
                : 'border-transparent hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Reminders
          </button>
        </nav>

        {/* Zone 3: Actions (PWA install, Theme toggle, SOS Coach, Auth) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <PWAInstallButton />

          {/* SOS Coach Quick Trigger */}
          <button
            onClick={openSosModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 text-xs font-semibold hover:bg-rose-100 transition whitespace-nowrap shadow-xs"
            title="AI Craving Crusher Coach"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>SOS Coach</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition text-xs font-medium"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '☾' : '☼'}
          </button>

          {/* Firebase Authentication state */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-stone-600 dark:text-stone-400 max-w-[90px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                onClick={onLogout}
                className="px-2.5 py-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition whitespace-nowrap"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
