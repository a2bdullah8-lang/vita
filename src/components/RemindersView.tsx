import React, { useState } from 'react';
import { UserReminder, UserProfile } from '../types';
import { notificationManager } from '../lib/notifications';

interface RemindersViewProps {
  profile: UserProfile;
  reminders: UserReminder[];
  onAddReminder: (reminder: Omit<UserReminder, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onToggleReminder: (reminder: UserReminder) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
}

const PRESET_REMINDERS: Array<{
  title: string;
  type: UserReminder['type'];
  time: string;
}> = [
  { title: 'Drink a glass of water', type: 'water', time: '10:00' },
  { title: 'Log Lunch & protein target', type: 'meal', time: '13:00' },
  { title: 'Drink 500ml afternoon hydration', type: 'water', time: '15:30' },
  { title: 'Workout & movement session', type: 'workout', time: '18:00' },
  { title: 'Log dinner & review calorie deficit', type: 'meal', time: '20:30' },
  { title: 'Target weight check-in & mindset', type: 'mindset', time: '08:00' },
];

export const RemindersView: React.FC<RemindersViewProps> = ({
  profile,
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    notificationManager.getPermission()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<UserReminder['type']>('water');
  const [time, setTime] = useState('10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestPermission = async () => {
    const result = await notificationManager.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      notificationManager.send(
        'VITA Health Reminders Active',
        'You will receive intelligent notifications for your scheduled hydration, meals, and workouts.'
      );
      showToast('Notifications enabled successfully!');
    } else {
      showToast('Notifications permission was not granted by browser.');
    }
  };

  const handleTestReminder = (r: UserReminder) => {
    notificationManager.send(
      `Reminder: ${r.title}`,
      `Scheduled for ${r.time} · Target: ${profile.targetWeightKg} kg mission.`
    );
    showToast(`Dispatched test notification for "${r.title}"`);
  };

  const handleQuickAdd = async (preset: {
    title: string;
    type: UserReminder['type'];
    time: string;
  }) => {
    try {
      await onAddReminder({
        title: preset.title,
        type: preset.type,
        time: preset.time,
        enabled: true,
      });
      showToast(`Added reminder: "${preset.title}"`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !time) return;
    setIsSubmitting(true);
    try {
      await onAddReminder({
        title: title.trim(),
        type,
        time,
        enabled: true,
      });
      setTitle('');
      setTime('10:00');
      setShowAddModal(false);
      showToast('Reminder saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (t: UserReminder['type']) => {
    switch (t) {
      case 'water':
        return '💧';
      case 'meal':
        return '🥗';
      case 'workout':
        return '🏋️';
      case 'mindset':
        return '🧠';
    }
  };

  const getTypeBadgeClass = (t: UserReminder['type']) => {
    switch (t) {
      case 'water':
        return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'meal':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'workout':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'mindset':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs shadow-lg animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
            Daily Reminders & Push Alerts
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Personalized schedule for hydration, meals, and workouts saved securely to your account.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition self-start sm:self-auto shadow-xs flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span>
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Notification Permission Card */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-stone-900 dark:text-white">
              Browser Push Notifications
            </span>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                permission === 'granted'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {permission === 'granted' ? 'Active' : permission}
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {permission === 'granted'
              ? 'Notifications are permitted on this device. VITA will trigger timely alerts for your schedule.'
              : 'Enable browser notifications so you never forget to drink water or log your meals.'}
          </p>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={handleRequestPermission}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition whitespace-nowrap shrink-0"
          >
            Enable Notifications
          </button>
        )}
      </section>

      {/* Reminders List */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-stone-900 dark:text-white">
            Your Scheduled Reminders ({reminders.length})
          </h2>
          <span className="text-xs text-stone-400 font-mono">Syncs to Firestore</span>
        </div>

        {reminders.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto text-lg">
              ⏰
            </div>
            <p className="text-xs font-medium text-stone-700 dark:text-stone-300">
              No reminders created yet
            </p>
            <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
              Add your first reminder or pick from the recommended presets below to build a consistent hydration and meal routine.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition"
            >
              + Create Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  r.enabled
                    ? 'bg-stone-50/80 dark:bg-stone-800/40 border-stone-200/70 dark:border-stone-800'
                    : 'bg-stone-100/40 dark:bg-stone-900/40 border-dashed border-stone-200 dark:border-stone-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTypeIcon(r.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-white">
                        {r.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold capitalize ${getTypeBadgeClass(
                          r.type
                        )}`}
                      >
                        {r.type}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5 block">
                      Scheduled for {r.time} daily
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => handleTestReminder(r)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    title="Send test alert"
                  >
                    Test
                  </button>

                  {/* Toggle button */}
                  <button
                    onClick={() => onToggleReminder(r)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                      r.enabled
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {r.enabled ? 'On' : 'Off'}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteReminder(r.id)}
                    className="text-stone-400 hover:text-rose-600 transition text-sm p-1"
                    title="Delete reminder"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Presets Grid */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
          Recommended Habit Presets
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Tap to quickly add scientifically backed hydration and deficit accountability prompts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_REMINDERS.map((preset, idx) => {
            const alreadyExists = reminders.some((r) => r.title === preset.title);
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{getTypeIcon(preset.type)}</span>
                  <div>
                    <span className="font-semibold text-stone-900 dark:text-white block">
                      {preset.title}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {preset.time} · {preset.type}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickAdd(preset)}
                  disabled={alreadyExists}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                    alreadyExists
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                      : 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90'
                  }`}
                >
                  {alreadyExists ? 'Added' : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Create Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#FCFBF9] dark:bg-[#141312] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Add Custom Reminder
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Drink 500ml water, Take protein shake"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as UserReminder['type'])}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold focus:outline-none"
                  >
                    <option value="water">💧 Water</option>
                    <option value="meal">🥗 Meal</option>
                    <option value="workout">🏋️ Workout</option>
                    <option value="mindset">🧠 Mindset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Daily Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono font-bold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition mt-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save to Firestore'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
