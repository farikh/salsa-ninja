'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import type { CalendarDateRange } from '@/types/calendar';
import type { ScheduleItem } from '@/types/schedule';
import { AVAILABLE_SLOT_COLORS } from '@/types/schedule';
import type { TimeSlot } from '@/types/booking';

interface AvailabilityOverlayProps {
  instructorId: string | null;
  dateRange: CalendarDateRange;
  onSlotClick: (slot: ScheduleItem) => void;
}

function toScheduleItem(slot: TimeSlot, instructorId: string): ScheduleItem {
  const start = parseISO(slot.slot_start);
  const end = parseISO(slot.slot_end);
  return {
    id: `slot-${instructorId}-${slot.slot_start}`,
    type: 'available_slot',
    title: `Available ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
    start_time: slot.slot_start,
    end_time: slot.slot_end,
    color: AVAILABLE_SLOT_COLORS.bg,
    borderStyle: 'dashed',
    opacity: 0.85,
    instructorId,
  };
}

export function AvailabilityOverlay({
  instructorId,
  dateRange,
  onSlotClick,
}: AvailabilityOverlayProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const startParam = dateRange.start.toISOString();
      const endParam = dateRange.end.toISOString();
      const res = await fetch(
        `/api/slots/${instructorId}?start=${encodeURIComponent(startParam)}&end=${encodeURIComponent(endParam)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots ?? []);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [instructorId, dateRange.start, dateRange.end]);

  useEffect(() => {
    if (!instructorId) {
      setSlots([]);
      return;
    }
    fetchSlots();
  }, [instructorId, fetchSlots]);

  if (!instructorId) return null;

  if (loading) {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="animate-pulse text-xs text-muted-foreground">
          Loading availability...
        </div>
      </div>
    );
  }

  if (slots.length === 0) return null;

  return (
    <>
      {slots.map((slot) => {
        const item = toScheduleItem(slot, instructorId);
        const start = parseISO(slot.slot_start);
        const end = parseISO(slot.slot_end);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSlotClick(item)}
            className={`
              ${AVAILABLE_SLOT_COLORS.bg} ${AVAILABLE_SLOT_COLORS.border} ${AVAILABLE_SLOT_COLORS.text}
              border border-dashed rounded-md px-2 py-1
              cursor-pointer transition-colors
              hover:bg-green-100 hover:border-green-400
              text-left w-full
            `}
            style={{ opacity: 0.85 }}
          >
            <p className="text-xs font-medium truncate">
              {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
            </p>
            <p className="text-[10px] opacity-75">Available</p>
          </button>
        );
      })}
    </>
  );
}
