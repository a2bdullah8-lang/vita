import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-900/90 text-amber-100 backdrop-blur-md px-3.5 py-2 text-xs font-medium shadow-lg border border-amber-700/50">
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
      <span>Offline Mode — Cached data is active.</span>
    </div>
  );
};
