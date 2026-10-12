import React from 'react';

interface MobileNavigationProps {
  activeTab: 'dashboard' | 'workouts' | 'nutrition' | 'reminders';
  setActiveTab: (tab: 'dashboard' | 'workouts' | 'nutrition' | 'reminders') => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCFBF9]/95 dark:bg-[#121110]/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800">
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeTab === 'dashboard'
              ? 'text-stone-900 dark:text-stone-100 font-semibold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] tracking-tight mt-1">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('workouts')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeTab === 'workouts'
              ? 'text-stone-900 dark:text-stone-100 font-semibold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-[10px] tracking-tight mt-1">Workouts</span>
        </button>

        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeTab === 'nutrition'
              ? 'text-stone-900 dark:text-stone-100 font-semibold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-[10px] tracking-tight mt-1">Nutrition</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeTab === 'reminders'
              ? 'text-stone-900 dark:text-stone-100 font-semibold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-[10px] tracking-tight mt-1">Reminders</span>
        </button>
      </div>
    </nav>
  );
};
