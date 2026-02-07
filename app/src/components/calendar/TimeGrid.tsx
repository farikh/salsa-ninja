'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

interface TimeGridProps {
  hourStart?: number;
  hourEnd?: number;
  columnCount: number;
  columnHeaders?: React.ReactNode;
  renderColumn: (columnIndex: number) => React.ReactNode;
  showCurrentTime?: boolean;
  className?: string;
}

export function TimeGrid({
  hourStart = 6,
  hourEnd = 22,
  columnCount,
  columnHeaders,
  renderColumn,
  showCurrentTime = true,
  className,
}: TimeGridProps) {
  const hours = [];
  for (let h = hourStart; h < hourEnd; h++) {
    hours.push(h);
  }

  function formatHour(h: number): string {
    if (h === 0 || h === 24) return '12 AM';
    if (h === 12) return '12 PM';
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Column headers */}
      {columnHeaders && (
        <div className="flex border-b border-border">
          <div className="w-16 shrink-0" /> {/* Gutter spacer */}
          {columnHeaders}
        </div>
      )}

      {/* Grid body */}
      <div className="flex flex-1 relative">
        {/* Time gutter */}
        <div className="w-16 shrink-0">
          {hours.map((h) => (
            <div
              key={h}
              className="h-16 flex items-start justify-end pr-2 -mt-2"
            >
              <span className="text-xs text-muted-foreground font-medium">
                {formatHour(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Columns */}
        <div className="flex flex-1 relative">
          {/* Hour lines */}
          <div className="absolute inset-0 pointer-events-none">
            {hours.map((h) => (
              <div
                key={h}
                className="h-16 border-b border-border"
              />
            ))}
          </div>

          {/* Current time indicator */}
          {showCurrentTime && (
            <CurrentTimeIndicator hourStart={hourStart} hourEnd={hourEnd} />
          )}

          {/* Day columns */}
          {Array.from({ length: columnCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 relative',
                i > 0 && 'border-l border-border'
              )}
              style={{ minHeight: `${hours.length * 64}px` }}
            >
              {renderColumn(i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
