import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#1F3A3D] text-[#FAF8F5] px-3.5 py-2 text-xs font-medium shadow-lg border border-[#F1931E]/40"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#F1931E]" />
      <span>Offline Mode — Your passes &amp; streaks remain saved locally.</span>
    </div>
  );
};
