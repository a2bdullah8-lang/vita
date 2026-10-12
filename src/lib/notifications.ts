/**
 * Notification engine for Hydration, Movement (< 250 steps/hr), and Mindset.
 * Integrates Web Push / Notification API with in-app banner fallback.
 */

import { NotificationSettings } from '../types';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  hydrationEnabled: true,
  hydrationIntervalMinutes: 120, // 2 hours
  movementEnabled: true,
  movementThresholdSteps: 250,
  mindsetEnabled: true,
  mindsetTime: '08:00',
};

class NotificationManager {
  private inAppSubscribers: Array<(notification: { title: string; body: string; type: string }) => void> = [];

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return 'denied';
    }
  }

  public subscribeInApp(cb: (notif: { title: string; body: string; type: string }) => void) {
    this.inAppSubscribers.push(cb);
    return () => {
      this.inAppSubscribers = this.inAppSubscribers.filter((s) => s !== cb);
    };
  }

  public send(title: string, body: string, type: 'hydration' | 'movement' | 'mindset' = 'mindset') {
    // 1. Notify in-app subscribers always for immediate feedback
    this.inAppSubscribers.forEach((cb) => cb({ title, body, type }));

    // 2. Dispatch browser system notification if permitted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: '/pwa-192x192.png',
              badge: '/icon.svg',
              tag: `vita-${type}`,
            });
          });
        } else {
          new Notification(title, {
            body,
            icon: '/pwa-192x192.png',
            tag: `vita-${type}`,
          });
        }
      } catch (err) {
        console.warn('System notification error:', err);
      }
    }
  }

  // Pre-configured notification triggers
  public triggerHydrationNotification() {
    this.send('Hydration Check', 'Drink a glass of water.', 'hydration');
  }

  public triggerMovementNotification(stepsLastHour: number) {
    this.send(
      'Movement Alert',
      `You took only ${stepsLastHour} steps in the last hour. Stand up and walk for 2 minutes.`,
      'movement'
    );
  }

  public triggerMindsetNotification(currentWeight: number = 106, targetWeight: number = 96) {
    this.send(
      'Morning Mindset',
      `Target: ${targetWeight}kg. You started at ${currentWeight}kg. Consistency beats motivation every single day. Let's get it!`,
      'mindset'
    );
  }
}

export const notificationManager = new NotificationManager();
