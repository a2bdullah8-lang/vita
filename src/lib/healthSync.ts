/**
 * Google Health API & Fitness Sync Service
 * Seamlessly operates both in full-stack dev and static SPA deployment (Vercel)
 */

import { HealthSyncData } from '../types';

const STORAGE_KEY = 'vita_health_sync_data';

const DEFAULT_HEALTH_DATA: HealthSyncData = {
  connected: true,
  lastSyncTime: new Date().toISOString(),
  steps: 7840,
  targetSteps: 10000,
  activeCalories: 640,
  distanceKm: 5.8,
  hourlySteps: [0, 0, 0, 0, 0, 0, 180, 850, 1200, 420, 680, 950, 1100, 310, 180, 720, 850, 400, 0, 0, 0, 0, 0, 0],
  lastHourSteps: 180,
};

export function loadStoredHealthData(): HealthSyncData {
  if (typeof window === 'undefined') return DEFAULT_HEALTH_DATA;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_HEALTH_DATA;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_HEALTH_DATA;
  }
}

export function saveStoredHealthData(data: HealthSyncData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function fetchHealthSyncData(): Promise<HealthSyncData> {
  // 1. Try server endpoint if running with Express server
  try {
    const res = await fetch('/api/health/sync');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        saveStoredHealthData(json.data);
        return json.data;
      }
    }
  } catch {
    // Backend offline / static SPA on Vercel
  }

  // 2. Return local persisted health sync state
  const current = loadStoredHealthData();
  current.lastSyncTime = new Date().toISOString();
  saveStoredHealthData(current);
  return current;
}

export async function addStepsToHealthSync(steps: number): Promise<HealthSyncData> {
  const numSteps = Math.max(0, Number(steps));

  // Try backend first
  try {
    const res = await fetch('/api/health/add-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: numSteps }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        saveStoredHealthData(json.data);
        return json.data;
      }
    }
  } catch {
    // Static mode
  }

  // Client-side fallback calculation
  const current = loadStoredHealthData();
  current.steps += numSteps;
  current.activeCalories += Math.round(numSteps * 0.045);
  current.distanceKm = Number((current.steps * 0.00078).toFixed(2));
  current.lastHourSteps += numSteps;
  current.lastSyncTime = new Date().toISOString();

  const hour = new Date().getHours();
  current.hourlySteps[hour] = (current.hourlySteps[hour] || 0) + numSteps;

  saveStoredHealthData(current);
  return current;
}

export async function simulateStagnantHealthHour(): Promise<HealthSyncData> {
  try {
    const res = await fetch('/api/health/simulate-hour-stagnant', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        saveStoredHealthData(json.data);
        return json.data;
      }
    }
  } catch {
    // Static mode
  }

  const current = loadStoredHealthData();
  current.lastHourSteps = 120; // < 250 steps threshold
  current.lastSyncTime = new Date().toISOString();
  saveStoredHealthData(current);
  return current;
}
