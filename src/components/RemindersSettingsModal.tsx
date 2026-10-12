import React, { useState, useEffect } from 'react';
import { NotificationSettings, UserProfile } from '../types';
import { notificationManager } from '../lib/notifications';

interface RemindersSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
}

export const RemindersSettingsModal: React.FC<RemindersSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  settings,
  onUpdateSettings,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    setPermission(notificationManager.getPermission());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await notificationManager.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      notificationManager.send('Notifications Enabled', 'VITA smart health reminders are now active on your device.');
      setTestStatus('Permission granted and welcome notification dispatched!');
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const handleTestHydration = () => {
    notificationManager.triggerHydrationNotification();
    setTestStatus('Dispatched Hydration Reminder: "Drink a glass of water."');
    setTimeout(() => setTestStatus(null), 4000);
  };

  const handleTestMovement = () => {
    notificationManager.triggerMovementNotification(140);
    setTestStatus('Dispatched Movement Alert: "Stand up and walk for 2 minutes."');
    setTimeout(() => setTestStatus(null), 4000);
  };

  const handleTestMindset = () => {
    notificationManager.triggerMindsetNotification(profile.currentWeightKg, profile.targetWeightKg);
    setTestStatus('Dispatched Morning Mindset: "Target: 96kg. Consistency beats motivation."');
    setTimeout(() => setTestStatus(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FCFBF9] dark:bg-[#141312] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Intelligent Push Reminders
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Hydration, Movement inactivity alerts & Morning mindset.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* Permission Status Banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-stone-900 dark:text-stone-100 block">
              Browser Notification Permission
            </span>
            <span className="text-[11px] text-stone-500 capitalize">
              Status: <strong>{permission}</strong>
            </span>
          </div>

          {permission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs hover:opacity-90 transition whitespace-nowrap"
            >
              Enable Notifications
            </button>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
              ✓ Active
            </span>
          )}
        </div>

        {testStatus && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-medium animate-fadeIn">
            {testStatus}
          </div>
        )}

        {/* Reminder Modules List */}
        <div className="mt-5 space-y-4">
          {/* 1. Hydration Reminder */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Hydration Interval</span>
                <span className="text-[10px] text-cyan-600 font-semibold">Every 2 Hours</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Dispatches: <em>"Drink a glass of water."</em>
              </p>
              <button
                onClick={handleTestHydration}
                className="mt-2 text-[10px] font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline"
              >
                Trigger Test Now
              </button>
            </div>

            <button
              onClick={() => toggleSetting('hydrationEnabled')}
              className={`w-11 h-6 rounded-full transition p-1 shrink-0 ${
                localSettings.hydrationEnabled ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white dark:bg-stone-900 transition-transform ${
                  localSettings.hydrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Movement / Inactivity Alert */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Movement Stagnation Guard</span>
                <span className="text-[10px] text-orange-600 font-semibold">&lt; 250 steps/hr</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Triggered when Google Health API shows under 250 steps in the past hour: <em>"Stand up and walk for 2 minutes."</em>
              </p>
              <button
                onClick={handleTestMovement}
                className="mt-2 text-[10px] font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline"
              >
                Trigger Test Now
              </button>
            </div>

            <button
              onClick={() => toggleSetting('movementEnabled')}
              className={`w-11 h-6 rounded-full transition p-1 shrink-0 ${
                localSettings.movementEnabled ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white dark:bg-stone-900 transition-transform ${
                  localSettings.movementEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Mindset Morning Reinforcement */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-xs flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Daily Morning Mindset</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Goal 96kg</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                Dispatches daily morning boost reinforcing your 96kg target weight and relentless consistency.
              </p>
              <button
                onClick={handleTestMindset}
                className="mt-2 text-[10px] font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline"
              >
                Trigger Test Now
              </button>
            </div>

            <button
              onClick={() => toggleSetting('mindsetEnabled')}
              className={`w-11 h-6 rounded-full transition p-1 shrink-0 ${
                localSettings.mindsetEnabled ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-200 dark:bg-stone-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white dark:bg-stone-900 transition-transform ${
                  localSettings.mindsetEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
