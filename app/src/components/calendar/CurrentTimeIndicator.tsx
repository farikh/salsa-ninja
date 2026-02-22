'use client';

import { useState, useEffect } from 'react';

interface CurrentTimeIndicatorProps {
  hourStart: number;
  hourEnd: number;
}

export function CurrentTimeIndicator({ hourStart, hourEnd }: CurrentTimeIndicatorProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours() + now.getMinutes() / 60;
  if (hours < hourStart || hours > hourEnd) return null;

  const totalHours = hourEnd - hourStart;
  const offsetPercent = ((hours - hourStart) / totalHours) * 100;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${offsetPercent}%` }}
    >
      <div className="relative flex items-center">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 -ml-1"
          style={{ backgroundColor: 'var(--primary)' }}
        />
        <div
          className="flex-1 h-[2px]"
          style={{ backgroundColor: 'var(--primary)' }}
        />
      </div>
    </div>
  );
}
