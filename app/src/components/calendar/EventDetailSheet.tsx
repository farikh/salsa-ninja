'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import { format, parseISO } from 'date-fns';

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  class: 'Class',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  studio_social: 'Social',
  community: 'Community',
  private_lesson: 'Private Lesson',
};

export function EventDetailSheet({ event, open, onClose }: EventDetailSheetProps) {
  if (!event) return null;

  const colors = EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.class;
  const start = parseISO(event.start_time);
  const end = parseISO(event.end_time);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="bg-card border-border w-[400px]">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: `${colors.border}40`,
              }}
            >
              {TYPE_LABELS[event.event_type] ?? event.event_type}
            </Badge>
            {event.difficulty && (
              <Badge variant="outline" className="text-xs capitalize">
                {event.difficulty.replace('_', ' ')}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-lg">{event.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: 'var(--muted-foreground)' }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <p className="text-sm font-medium">
                {format(start, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Instructor */}
          {event.instructor_name && (
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 shrink-0"
                style={{ color: 'var(--muted-foreground)' }}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p className="text-sm">{event.instructor_name}</p>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 shrink-0"
                style={{ color: 'var(--muted-foreground)' }}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p className="text-sm">{event.location}</p>
            </div>
          )}

          {/* Dance Style */}
          {event.dance_style && (
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 shrink-0"
                style={{ color: 'var(--muted-foreground)' }}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <p className="text-sm capitalize">
                {event.dance_style.replace('_', ' ')}
              </p>
            </div>
          )}

          {/* Capacity / RSVP */}
          {event.capacity != null && (
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 shrink-0"
                style={{ color: 'var(--muted-foreground)' }}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-sm">
                {event.rsvp_count} / {event.capacity} spots
                {event.is_full && (
                  <span className="text-red-500 ml-1 font-medium">Full</span>
                )}
              </p>
            </div>
          )}

          {/* RSVP Status */}
          {event.user_rsvp_status && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Your RSVP:{' '}
                <span
                  className="font-medium capitalize"
                  style={{
                    color:
                      event.user_rsvp_status === 'going'
                        ? '#22c55e'
                        : event.user_rsvp_status === 'waitlist'
                          ? '#f59e0b'
                          : undefined,
                  }}
                >
                  {event.user_rsvp_status}
                </span>
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
