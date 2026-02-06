'use client'

import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/types/booking'

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color?: string; tooltip: string }
> = {
  pending: {
    label: 'Pending',
    variant: 'secondary',
    color: '#f59e0b',
    tooltip: 'Awaiting instructor confirmation',
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'default',
    color: '#22c55e',
    tooltip: 'Lesson confirmed',
  },
  declined: {
    label: 'Declined',
    variant: 'destructive',
    tooltip: 'Instructor declined this request',
  },
  expired: {
    label: 'Expired',
    variant: 'outline',
    tooltip: 'Request expired after 4 hours',
  },
  cancelled_by_member: {
    label: 'Cancelled',
    variant: 'outline',
    tooltip: 'Cancelled by student',
  },
  cancelled_by_instructor: {
    label: 'Cancelled',
    variant: 'outline',
    tooltip: 'Cancelled by instructor',
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
    color: '#22c55e',
    tooltip: 'Lesson completed',
  },
  no_show: {
    label: 'No Show',
    variant: 'destructive',
    tooltip: 'Student did not attend',
  },
}

interface BookingStatusBadgeProps {
  status: BookingStatus
  size?: 'sm' | 'md'
}

export function BookingStatusBadge({ status, size = 'md' }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: 'outline' as const,
    tooltip: status,
  }

  return (
    <Badge
      variant={config.variant}
      title={config.tooltip}
      style={{
        ...(config.color
          ? {
              backgroundColor: `${config.color}20`,
              color: config.color,
              borderColor: `${config.color}40`,
            }
          : {}),
        fontSize: size === 'sm' ? '0.7rem' : '0.75rem',
        padding: size === 'sm' ? '0.1rem 0.4rem' : '0.15rem 0.5rem',
      }}
    >
      {config.label}
    </Badge>
  )
}
