/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  UserProfile,
  MealItem,
  WorkoutLog,
  HealthSyncData,
  ChatMessage,
  NotificationSettings,
} from './types';
import {
  auth,
  DEFAULT_USER_PROFILE,
  loadUserProfile,
  saveUserProfile,
  loadMealsLocal,
  loadMealsFromFirestore,
  saveMeal,
  deleteMeal,
  loadWorkoutsLocal,
  saveWorkout,
  loadSosChatHistory,
  saveSosChatThread,
  loginWithGoogle,
  logoutUser,
  testConnection,
} from './lib/firebase';
import { notificationManager, DEFAULT_NOTIFICATION_SETTINGS } from './lib/notifications';
import {
  fetchHealthSyncData,
  addStepsToHealthSync,
  simulateStagnantHealthHour,
} from './lib/healthSync';
import { Header } from './components/Header';
import { MobileNavigation } from './components/MobileNavigation';
import { SmartDashboard } from './components/SmartDashboard';
import { DualWorkoutEngine } from './components/DualWorkoutEngine';
import { NutritionTracker } from './components/NutritionTracker';
import { CravingCrusherModal } from './components/CravingCrusherModal';
import { RemindersSettingsModal } from './components/RemindersSettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Theme state: cream (#FCFBF9) / dark (#121110)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('vita_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workouts' | 'nutrition' | 'reminders'>('dashboard');

  // User & Profile
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  // Core Data
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [waterMl, setWaterMl] = useState<number>(() => {
    const saved = localStorage.getItem('vita_water_today');
    return saved ? parseInt(saved, 10) : 1250;
  });

  // Health API Sync Data
  const [healthData, setHealthData] = useState<HealthSyncData>({
    connected: true,
    lastSyncTime: new Date().toISOString(),
    steps: 7840,
    targetSteps: 10000,
    activeCalories: 640,
    distanceKm: 5.8,
    hourlySteps: [0, 0, 0, 0, 0, 0, 180, 850, 1200, 420, 680, 950, 1100, 310, 180, 720, 850, 400, 0, 0, 0, 0, 0, 0],
    lastHourSteps: 180,
  });

  // Chat & Notification Modals
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('vita_notification_settings');
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATION_SETTINGS;
  });

  // In-app Notification Banner
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string } | null>(null);

  // Apply dark class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('vita_theme', theme);
  }, [theme]);

  // Initial load & Auth Listener
  useEffect(() => {
    testConnection();

    // Load initial local data
    setMeals(loadMealsLocal());
    setWorkouts(loadWorkoutsLocal());
    setChatHistory(loadSosChatHistory());

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const loadedProfile = await loadUserProfile(currentUser.uid);
        setProfile(loadedProfile);
        const remoteMeals = await loadMealsFromFirestore(currentUser.uid);
        setMeals(remoteMeals);
      } else {
        const loadedProfile = await loadUserProfile();
        setProfile(loadedProfile);
      }
    });

    // Subscribe to in-app notification toasts
    const unsubscribeNotif = notificationManager.subscribeInApp((n) => {
      setActiveNotification(n);
      setTimeout(() => setActiveNotification(null), 6000);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotif();
    };
  }, []);

  // Fetch initial Google Health sync
  const fetchHealthSync = useCallback(async () => {
    try {
      const data = await fetchHealthSyncData();
      setHealthData(data);
      if (
        notificationSettings.movementEnabled &&
        data.lastHourSteps < notificationSettings.movementThresholdSteps
      ) {
        notificationManager.triggerMovementNotification(data.lastHourSteps);
      }
    } catch (e) {
      console.warn('Health sync notice:', e);
    }
  }, [notificationSettings]);

  useEffect(() => {
    fetchHealthSync();
  }, [fetchHealthSync]);

  // Periodic Hydration Reminder (every 2 hours)
  useEffect(() => {
    if (!notificationSettings.hydrationEnabled) return;
    const intervalMs = notificationSettings.hydrationIntervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      notificationManager.triggerHydrationNotification();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [notificationSettings.hydrationEnabled, notificationSettings.hydrationIntervalMinutes]);

  // Handlers
  const handleUpdateProfile = async (updated: UserProfile) => {
    setProfile(updated);
    await saveUserProfile(updated);
  };

  const handleAddMeal = async (meal: MealItem) => {
    const updated = [meal, ...meals];
    setMeals(updated);
    await saveMeal(meal);
  };

  const handleDeleteMeal = async (mealId: string) => {
    const updated = meals.filter((m) => m.id !== mealId);
    setMeals(updated);
    await deleteMeal(mealId);
  };

  const handleSaveWorkout = async (workout: WorkoutLog) => {
    const updated = [workout, ...workouts];
    setWorkouts(updated);
    await saveWorkout(workout);
  };

  const handleAddWater = (amountMl: number) => {
    const newTotal = waterMl + amountMl;
    setWaterMl(newTotal);
    localStorage.setItem('vita_water_today', newTotal.toString());
  };

  const handleAddSteps = async (steps: number) => {
    const data = await addStepsToHealthSync(steps);
    setHealthData(data);
  };

  const handleSimulateInactivity = async () => {
    const data = await simulateStagnantHealthHour();
    setHealthData(data);
    notificationManager.triggerMovementNotification(data.lastHourSteps);
  };

  const handleSaveChatHistory = async (newHistory: ChatMessage[]) => {
    setChatHistory(newHistory);
    await saveSosChatThread(newHistory);
  };

  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    localStorage.setItem('vita_notification_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF9] dark:bg-[#121110] text-[#1C1917] dark:text-[#F5F5F4] transition-colors duration-200">
      {/* In-App Notification Toast */}
      {activeNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 p-4 shadow-xl border border-stone-700/50 dark:border-stone-200/50 animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold block">{activeNotification.title}</span>
              <p className="text-xs mt-0.5 text-stone-300 dark:text-stone-700 leading-snug">
                {activeNotification.body}
              </p>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              className="text-stone-400 hover:text-white dark:hover:text-stone-900 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(t) => {
          if (t === 'reminders') {
            setIsRemindersOpen(true);
          } else {
            setActiveTab(t);
          }
        }}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogin={loginWithGoogle}
        onLogout={logoutUser}
        openSosModal={() => setIsSosOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-16">
        {activeTab === 'dashboard' && (
          <SmartDashboard
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            healthData={healthData}
            onSyncHealth={fetchHealthSync}
            onAddSteps={handleAddSteps}
            onSimulateInactivity={handleSimulateInactivity}
            meals={meals}
            workouts={workouts}
            waterMl={waterMl}
            onAddWater={handleAddWater}
            openSosModal={() => setIsSosOpen(true)}
          />
        )}

        {activeTab === 'workouts' && (
          <DualWorkoutEngine
            onSaveWorkout={handleSaveWorkout}
            recentWorkouts={workouts}
          />
        )}

        {activeTab === 'nutrition' && (
          <NutritionTracker
            profile={profile}
            meals={meals}
            onAddMeal={handleAddMeal}
            onDeleteMeal={handleDeleteMeal}
          />
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
          <span className="hidden sm:inline text-rose-200 text-[10px]">96kg</span>
        </button>
      </div>

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        setActiveTab={(t) => {
          if (t === 'reminders') {
            setIsRemindersOpen(true);
          } else {
            setActiveTab(t);
          }
        }}
      />

      {/* AI Craving Crusher Modal */}
      <CravingCrusherModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        profile={profile}
        chatHistory={chatHistory}
        onSaveChat={handleSaveChatHistory}
        onAddWater={handleAddWater}
      />

      {/* Push Reminders Settings Modal */}
      <RemindersSettingsModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        profile={profile}
        settings={notificationSettings}
        onUpdateSettings={handleUpdateNotificationSettings}
      />

      {/* PWA Offline Indicator Banner */}
      <OfflineIndicator />
    </div>
  );
}
