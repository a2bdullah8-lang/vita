/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  UserProfile,
  DailyEntry,
  UserReminder,
  ChatMessage,
} from './types';
import {
  auth,
  loadUserProfile,
  saveUserProfile,
  loadDailyEntry,
  saveDailyEntry,
  loadRecentDailyEntries,
  createEmptyDailyEntry,
  loadUserReminders,
  saveUserReminder,
  deleteUserReminder,
  loginWithGoogle,
  logoutUser,
} from './lib/firebase';
import { getLocalDateKey } from './lib/calculations';
import { notificationManager } from './lib/notifications';
import { Header } from './components/Header';
import { MobileNavigation } from './components/MobileNavigation';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { SmartDashboard } from './components/SmartDashboard';
import { NutritionTracker } from './components/NutritionTracker';
import { WorkoutsTracker } from './components/WorkoutsTracker';
import { ReportsView } from './components/ReportsView';
import { RemindersView } from './components/RemindersView';
import { CravingCrusherModal } from './components/CravingCrusherModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Theme state: cream (#FCFBF9) / dark (#121110)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('vita_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Active navigation tab (5 core tabs)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'workouts' | 'reports' | 'reminders'>('dashboard');

  // Auth & Profile state
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // Daily Tracking & Automatic Reset Date Key
  const [currentDateKey, setCurrentDateKey] = useState<string>(() => getLocalDateKey());
  const [todayEntry, setTodayEntry] = useState<DailyEntry>(() => createEmptyDailyEntry('', getLocalDateKey()));
  const [recentDays, setRecentDays] = useState<DailyEntry[]>([]);

  // User Reminders & SOS Coach Chat
  const [reminders, setReminders] = useState<UserReminder[]>([]);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Apply dark theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('vita_theme', theme);
  }, [theme]);

  // Load user data for a specific date
  const loadUserDataForDate = useCallback(async (uid: string, dateKey: string) => {
    try {
      const day = await loadDailyEntry(uid, dateKey);
      setTodayEntry(day);

      const recent = await loadRecentDailyEntries(uid, 30);
      setRecentDays(recent);

      const userReminders = await loadUserReminders(uid);
      setReminders(userReminders);

      const savedChat = localStorage.getItem(`vita_chat_${uid}`);
      if (savedChat) {
        try {
          setChatHistory(JSON.parse(savedChat));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const loadedProfile = await loadUserProfile(currentUser.uid);
        setProfile(loadedProfile);
        const todayKey = getLocalDateKey();
        setCurrentDateKey(todayKey);
        await loadUserDataForDate(currentUser.uid, todayKey);
      } else {
        setProfile(null);
        setTodayEntry(createEmptyDailyEntry('', getLocalDateKey()));
        setRecentDays([]);
        setReminders([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, [loadUserDataForDate]);

  // 3. AUTOMATIC DAILY RESET AT LOCAL MIDNIGHT
  // Detect date change via interval and visibilitychange event
  useEffect(() => {
    const checkDateTransition = () => {
      const nowKey = getLocalDateKey();
      if (nowKey !== currentDateKey) {
        console.log(`[VITA] Date transition detected: ${currentDateKey} -> ${nowKey}. Resetting day.`);
        setCurrentDateKey(nowKey);
        if (user) {
          loadUserDataForDate(user.uid, nowKey);
        } else {
          setTodayEntry(createEmptyDailyEntry('', nowKey));
        }
      }
    };

    // Check every 10 seconds
    const intervalTimer = setInterval(checkDateTransition, 10000);

    // Also check immediately when the app or tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateTransition();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentDateKey, user, loadUserDataForDate]);

  // Reminder schedule runner: checks every minute if an active reminder is due
  useEffect(() => {
    if (reminders.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;

      reminders.forEach((r) => {
        if (r.enabled && r.time === timeStr) {
          const firedKey = `vita_fired_${r.id}_${currentDateKey}_${timeStr}`;
          if (!sessionStorage.getItem(firedKey)) {
            sessionStorage.setItem(firedKey, 'true');
            notificationManager.send(
              `Reminder: ${r.title}`,
              `Scheduled at ${r.time} · Keep pushing towards your target!`
            );
          }
        }
      });
    };

    const reminderTimer = setInterval(checkReminders, 30000);
    return () => clearInterval(reminderTimer);
  }, [reminders, currentDateKey]);

  // Update Today's Daily Entry (Saved to Firestore users/{uid}/days/{YYYY-MM-DD})
  const handleUpdateTodayEntry = async (updated: DailyEntry) => {
    setTodayEntry(updated);
    if (user) {
      await saveDailyEntry(updated);
      setRecentDays((prev) => {
        const withoutToday = prev.filter((d) => d.date !== updated.date);
        const merged = [...withoutToday, updated].sort((a, b) => a.date.localeCompare(b.date));
        return merged;
      });
    }
  };

  // Update Profile (Saved to Firestore users/{uid}/profile)
  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    setIsEditingProfile(false);
    if (user) {
      await saveUserProfile(updated);
    }
  };

  // Reminders Management (users/{uid}/reminders/{reminderId})
  const handleAddReminder = async (item: Omit<UserReminder, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const newReminder: UserReminder = {
      ...item,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    const nextList = [...reminders, newReminder].sort((a, b) => a.time.localeCompare(b.time));
    setReminders(nextList);
    await saveUserReminder(newReminder);
  };

  const handleToggleReminder = async (item: UserReminder) => {
    if (!user) return;
    const toggled: UserReminder = { ...item, enabled: !item.enabled };
    const nextList = reminders.map((r) => (r.id === item.id ? toggled : r));
    setReminders(nextList);
    await saveUserReminder(toggled);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!user) return;
    const nextList = reminders.filter((r) => r.id !== reminderId);
    setReminders(nextList);
    await deleteUserReminder(user.uid, reminderId);
  };

  // Save SOS Chat Messages
  const handleSaveChatHistory = (newHistory: ChatMessage[]) => {
    setChatHistory(newHistory);
    if (user) {
      localStorage.setItem(`vita_chat_${user.uid}`, JSON.stringify(newHistory));
    }
  };

  // 1. Initial Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFBF9] dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F5F4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 flex items-center justify-center font-black text-xl shadow-md animate-pulse">
            V
          </div>
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400">
            VITA HEALTH
          </span>
        </div>
      </div>
    );
  }

  // 1. AUTH GATE: Signed-out users see ONLY the sign-in screen
  if (!user) {
    return (
      <AuthScreen
        onSuccess={() => {
          // Handled via onAuthStateChanged
        }}
      />
    );
  }

  // 1. FIRST LOGIN ONBOARDING GATE
  // If user is logged in but hasn't completed onboarding, open full multi-step setup
  const needsOnboarding = !profile || !profile.onboardingCompleted;

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF9] dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F5F4] transition-colors duration-200">
      {/* Onboarding & Profile Editing Modal */}
      {(needsOnboarding || isEditingProfile) && (
        <OnboardingModal
          user={user}
          initialProfile={profile}
          isOpen={true}
          isEditing={isEditingProfile}
          onComplete={handleUpdateProfile}
          onCancel={isEditingProfile ? () => setIsEditingProfile(false) : undefined}
        />
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogin={loginWithGoogle}
        onLogout={logoutUser}
        openSosModal={() => setIsSosOpen(true)}
        onOpenSettings={() => setIsEditingProfile(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-16">
        {profile && (
          <>
            {activeTab === 'dashboard' && (
              <SmartDashboard
                profile={profile}
                todayEntry={todayEntry}
                onUpdateTodayEntry={handleUpdateTodayEntry}
                onUpdateProfile={handleUpdateProfile}
                onOpenEditProfile={() => setIsEditingProfile(true)}
                onOpenSosCoach={() => setIsSosOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'nutrition' && (
              <NutritionTracker
                profile={profile}
                todayEntry={todayEntry}
                onUpdateTodayEntry={handleUpdateTodayEntry}
              />
            )}

            {activeTab === 'workouts' && (
              <WorkoutsTracker
                profile={profile}
                todayEntry={todayEntry}
                onUpdateTodayEntry={handleUpdateTodayEntry}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                profile={profile}
                dailyEntries={
                  // Ensure today's entry is reflected in reports
                  recentDays.some((d) => d.date === todayEntry.date)
                    ? recentDays.map((d) => (d.date === todayEntry.date ? todayEntry : d))
                    : [...recentDays, todayEntry].sort((a, b) => a.date.localeCompare(b.date))
                }
              />
            )}

            {activeTab === 'reminders' && (
              <RemindersView
                profile={profile}
                reminders={reminders}
                onAddReminder={handleAddReminder}
                onToggleReminder={handleToggleReminder}
                onDeleteReminder={handleDeleteReminder}
              />
            )}
          </>
        )}
      </main>

      {/* Dedicated Floating 'SOS' Craving Crusher Coach Button */}
      <div className="fixed bottom-20 md:bottom-8 right-5 z-40">
        <button
          onClick={() => setIsSosOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:scale-95 transition-all"
          title="Open AI Craving Crusher & Motivation Coach"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>Craving Crusher SOS</span>
          {profile && (
            <span className="hidden sm:inline text-rose-200 text-[10px]">
              {profile.targetWeightKg}kg
            </span>
          )}
        </button>
      </div>

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* AI Craving Crusher Modal */}
      {profile && (
        <CravingCrusherModal
          isOpen={isSosOpen}
          onClose={() => setIsSosOpen(false)}
          profile={profile}
          chatHistory={chatHistory}
          onSaveChat={handleSaveChatHistory}
          onAddWater={async (amount) => {
            const nextWater = (todayEntry.waterMl || 0) + amount;
            await handleUpdateTodayEntry({
              ...todayEntry,
              waterMl: nextWater,
              updatedAt: new Date().toISOString(),
            });
          }}
        />
      )}

      {/* PWA Offline Indicator Banner */}
      <OfflineIndicator />
    </div>
  );
}
