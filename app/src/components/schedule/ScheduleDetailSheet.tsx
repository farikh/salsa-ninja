'use client';

import { useCallback, useState } from 'react';
import { format, parseISO, differenceInHours } from 'date-fns';
import { Check, X, Loader2, MessageSquare, Calendar, User, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EventDetailSheet } from '@/components/calendar/EventDetailSheet';
import { EventDetailDrawer } from '@/components/calendar/EventDetailDrawer';
import type { ScheduleItem } from '@/types/schedule';
import { AVAILABLE_SLOT_COLORS, BOOKING_COLORS } from '@/types/schedule';

interface ScheduleDetailSheetProps {
  item: ScheduleItem | null;
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  currentUserId?: string | null;
  onBookingUpdate?: () => void;
}

// --- Booking helpers ---

function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Approval';
    case 'confirmed':
      return 'Confirmed';
    case 'declined':
      return 'Declined';
    case 'cancelled_by_member':
      return 'Cancelled by Member';
    case 'cancelled_by_instructor':
      return 'Cancelled by Instructor';
    case 'completed':
      return 'Completed';
    case 'no_show':
      return 'No Show';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'declined':
    case 'cancelled_by_member':
    case 'cancelled_by_instructor':
    case 'no_show':
      return 'destructive';
    default:
      return 'outline';
  }
}

function canCancel(
  booking: { status: string; instructor_id: string; start_time: string },
  currentUserId: string | null
): boolean {
  if (booking.status === 'pending') return true;
  if (booking.status !== 'confirmed') return false;
  if (booking.instructor_id === currentUserId) return true;
  const hoursUntil = differenceInHours(parseISO(booking.start_time), new Date());
  return hoursUntil >= 24;
}

function canConfirmOrDecline(
  booking: { status: string; instructor_id: string },
  currentUserId: string | null
): boolean {
  return booking.status === 'pending' && booking.instructor_id === currentUserId;
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// --- Booking detail content (shared between Sheet and Drawer) ---

function BookingDetailContent({
  item,
  currentUserId,
  onBookingUpdate,
  onClose,
}: {
  item: ScheduleItem;
  currentUserId: string | null | undefined;
  onBookingUpdate?: () => void;
  onClose: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const booking = item.booking;
  if (!booking) return null;

  const start = parseISO(booking.start_time);
  const end = parseISO(booking.end_time);
  const uid = currentUserId ?? null;

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        onBookingUpdate?.();
        onClose();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to cancel booking');
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  }, [booking.id, onBookingUpdate, onClose]);

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        onBookingUpdate?.();
        onClose();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to confirm booking');
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setConfirming(false);
    }
  }, [booking.id, onBookingUpdate, onClose]);

  const handleDecline = useCallback(async () => {
    setDeclining(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        onBookingUpdate?.();
        onClose();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to decline booking');
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setDeclining(false);
    }
  }, [booking.id, onBookingUpdate, onClose]);

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <Badge variant={statusVariant(booking.status)}>
          {statusLabel(booking.status)}
        </Badge>
        {item.hasUnread && (
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <MessageSquare className="size-3" />
            New messages
          </span>
        )}
      </div>

      {/* Other party (instructor or student) */}
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {item.otherPartyAvatar ? (
            <AvatarImage src={item.otherPartyAvatar} alt={item.otherPartyName ?? ''} />
          ) : null}
          <AvatarFallback>{getInitials(item.otherPartyName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{item.otherPartyName ?? 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">
            {booking.instructor_id === uid ? 'Student' : 'Instructor'}
          </p>
        </div>
      </div>

      {/* Date & Time */}
      <div className="flex items-start gap-3">
        <Calendar className="size-5 mt-0.5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{format(start, 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-sm text-muted-foreground">
            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
          </p>
        </div>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{booking.notes}</p>
        </div>
      )}

      {/* Cancellation reason */}
      {booking.cancellation_reason && (
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-xs font-medium text-destructive mb-1">Cancellation Reason</p>
          <p className="text-sm">{booking.cancellation_reason}</p>
        </div>
      )}

      {/* Message thread link */}
      <Button variant="outline" size="sm" className="w-full" asChild>
        <a href={`/private-sessions?booking=${booking.id}`}>
          <MessageSquare className="size-4" />
          View Message Thread
        </a>
      </Button>

      {/* Confirm / Decline (instructor only, pending bookings) */}
      {canConfirmOrDecline(booking, uid) && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={confirming || declining}
            className="flex-1"
          >
            {confirming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Confirm
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDecline}
            disabled={confirming || declining}
            className="flex-1"
          >
            {declining ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
            Decline
          </Button>
        </div>
      )}

      {/* Cancel button (when not showing confirm/decline) */}
      {canCancel(booking, uid) && !canConfirmOrDecline(booking, uid) && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full"
        >
          {cancelling && <Loader2 className="size-4 animate-spin" />}
          Cancel Booking
        </Button>
      )}

      {/* Error */}
      {actionError && <p className="text-xs text-destructive">{actionError}</p>}
    </div>
  );
}

// --- Available slot detail content ---

function AvailableSlotContent({
  item,
  onClose,
}: {
  item: ScheduleItem;
  onClose: () => void;
}) {
  const start = parseISO(item.start_time);
  const end = parseISO(item.end_time);

  return (
    <div className="space-y-4">
      {/* Slot badge */}
      <Badge
        className={`${AVAILABLE_SLOT_COLORS.text} ${AVAILABLE_SLOT_COLORS.bg} ${AVAILABLE_SLOT_COLORS.border} border`}
      >
        Available Slot
      </Badge>

      {/* Instructor */}
      {item.instructorName && (
        <div className="flex items-center gap-3">
          <User className="size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm">{item.instructorName}</p>
        </div>
      )}

      {/* Date & Time */}
      <div className="flex items-start gap-3">
        <Calendar className="size-5 mt-0.5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{format(start, 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-sm text-muted-foreground">
            {format(start, 'h:mm a')} - {format(end, 'h:mm a')}
          </p>
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-3">
        <Clock className="size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm">
          {Math.round((end.getTime() - start.getTime()) / 60000)} minutes
        </p>
      </div>

      {/* Book CTA */}
      <Button className="w-full" asChild>
        <a
          href={`/private-sessions?instructor=${item.instructorId}&slot=${item.start_time}`}
        >
          Book This Slot
        </a>
      </Button>
    </div>
  );
}

// --- Main polymorphic component ---

export function ScheduleDetailSheet({
  item,
  open,
  onClose,
  isMobile,
  currentUserId,
  onBookingUpdate,
}: ScheduleDetailSheetProps) {
  if (!item) return null;

  // --- Event type: delegate to existing components ---
  if (item.type === 'event') {
    if (isMobile) {
      return (
        <EventDetailDrawer
          event={item.event ?? null}
          open={open}
          onClose={onClose}
        />
      );
    }
    return (
      <EventDetailSheet
        event={item.event ?? null}
        open={open}
        onClose={onClose}
      />
    );
  }

  // --- Booking type ---
  if (item.type === 'booking') {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
          <DrawerContent className="bg-card border-border max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-lg text-left">Booking Details</DrawerTitle>
              <DrawerDescription className="text-left">
                {item.title}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <BookingDetailContent
                item={item}
                currentUserId={currentUserId}
                onBookingUpdate={onBookingUpdate}
                onClose={onClose}
              />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="bg-card border-border w-[400px]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg">Booking Details</SheetTitle>
            <SheetDescription>{item.title}</SheetDescription>
          </SheetHeader>
          <div className="space-y-0 pt-2 px-4">
            <BookingDetailContent
              item={item}
              currentUserId={currentUserId}
              onBookingUpdate={onBookingUpdate}
              onClose={onClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // --- Available slot type ---
  if (item.type === 'available_slot') {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
          <DrawerContent className="bg-card border-border max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-lg text-left">Available Slot</DrawerTitle>
              <DrawerDescription className="text-left">
                Book a private lesson
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <AvailableSlotContent item={item} onClose={onClose} />
            </div>
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="bg-card border-border w-[400px]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg">Available Slot</SheetTitle>
            <SheetDescription>Book a private lesson</SheetDescription>
          </SheetHeader>
          <div className="space-y-0 pt-2 px-4">
            <AvailableSlotContent item={item} onClose={onClose} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return null;
}
