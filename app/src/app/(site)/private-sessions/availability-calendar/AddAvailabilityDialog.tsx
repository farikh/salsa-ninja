'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
]

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

interface AddAvailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructorId: string
  defaultDay?: number
  defaultStartTime?: string
  onSaved: () => void
}

export function AddAvailabilityDialog({
  open,
  onOpenChange,
  instructorId,
  defaultDay,
  defaultStartTime,
  onSaved,
}: AddAvailabilityDialogProps) {
  const [selectedDay, setSelectedDay] = useState<string>(
    defaultDay !== undefined ? defaultDay.toString() : '1'
  )
  const [startTime, setStartTime] = useState<string>(defaultStartTime ?? '10:00')
  const [endTime, setEndTime] = useState<string>(() => {
    // Default end time: 4 hours after start
    if (defaultStartTime) {
      const [h] = defaultStartTime.split(':')
      const endH = Math.min(parseInt(h) + 4, 22)
      return `${endH.toString().padStart(2, '0')}:00`
    }
    return '18:00'
  })
  const [slotDuration, setSlotDuration] = useState<string>('60')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens with new defaults
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (defaultDay !== undefined) setSelectedDay(defaultDay.toString())
      if (defaultStartTime) {
        setStartTime(defaultStartTime)
        const [h] = defaultStartTime.split(':')
        const endH = Math.min(parseInt(h) + 4, 22)
        setEndTime(`${endH.toString().padStart(2, '0')}:00`)
      }
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const handleSave = async () => {
    if (startTime >= endTime) {
      setError('End time must be after start time')
      return
    }

    setSaving(true)
    setError(null)

    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructor_id: instructorId,
        day_of_week: parseInt(selectedDay),
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: parseInt(slotDuration),
      }),
    })

    if (res.ok) {
      onOpenChange(false)
      onSaved()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to add availability')
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Available Hours</DialogTitle>
          <DialogDescription>
            Set a recurring weekly time window when you&apos;re available for
            private lessons
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <div>
            <label
              style={{
                fontWeight: 500,
                fontSize: '0.875rem',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Day of Week
            </label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <label
                style={{
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                Start Time
              </label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {formatTime(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                style={{
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  display: 'block',
                  marginBottom: '0.25rem',
                }}
              >
                End Time
              </label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {formatTime(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label
              style={{
                fontWeight: 500,
                fontSize: '0.875rem',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Lesson Duration
            </label>
            <Select value={slotDuration} onValueChange={setSlotDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p
              style={{
                color: '#ef4444',
                fontSize: '0.875rem',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Adding...' : 'Add Availability'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
