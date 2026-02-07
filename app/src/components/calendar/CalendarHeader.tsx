'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CalendarViewType } from '@/types/calendar';

interface CalendarHeaderProps {
  currentView: CalendarViewType;
  currentDate: Date;
  onViewChange: (view: CalendarViewType) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
  title: string;
  actions?: React.ReactNode;
}

const VIEWS: { key: CalendarViewType; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
  { key: 'list', label: 'List' },
];

export function CalendarHeader({
  currentView,
  currentDate,
  onViewChange,
  onDateChange,
  onToday,
  title,
  actions,
}: CalendarHeaderProps) {
  function navigatePrev() {
    const d = new Date(currentDate);
    switch (currentView) {
      case 'month':
        d.setMonth(d.getMonth() - 1);
        break;
      case 'week':
      case 'list':
        d.setDate(d.getDate() - 7);
        break;
      case 'day':
        d.setDate(d.getDate() - 1);
        break;
    }
    onDateChange(d);
  }

  function navigateNext() {
    const d = new Date(currentDate);
    switch (currentView) {
      case 'month':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'week':
      case 'list':
        d.setDate(d.getDate() + 7);
        break;
      case 'day':
        d.setDate(d.getDate() + 1);
        break;
    }
    onDateChange(d);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="text-xs h-8"
        >
          Today
        </Button>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigatePrev}
            className="h-8 w-8"
            aria-label="Previous"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateNext}
            className="h-8 w-8"
            aria-label="Next"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
        </div>

        <h2 className="text-base sm:text-lg font-semibold ml-1">{title}</h2>
      </div>

      {/* Right: View switcher + actions */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-border overflow-hidden">
          {VIEWS.map((v) => (
            <button
              type="button"
              key={v.key}
              onClick={() => onViewChange(v.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                currentView === v.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        {actions}
      </div>
    </div>
  );
}
