'use client';

import { cn } from '@/lib/utils';

interface CalendarLegendItem {
  color: string;
  label: string;
}

interface CalendarLegendProps {
  items: CalendarLegendItem[];
  compact?: boolean;
}

export function CalendarLegend({ items, compact = false }: CalendarLegendProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-3',
        compact ? 'gap-2' : 'gap-4 p-3 rounded-lg border border-border bg-card'
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span
            className={cn(
              'text-muted-foreground font-medium',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
