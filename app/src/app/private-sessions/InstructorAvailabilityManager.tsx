'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Availability = {
  id: string
  instructor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
]

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export default function InstructorAvailabilityManager({ instructorId }: { instructorId: string }) {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [selectedDay, setSelectedDay] = useState<string>('1')
  const [startTime, setStartTime] = useState<string>('10:00')
  const [endTime, setEndTime] = useState<string>('18:00')
  const [slotDuration, setSlotDuration] = useState<string>('60')

  useEffect(() => {
    fetchAvailability()
  }, [instructorId])

  const fetchAvailability = async () => {
    setLoading(true)
    const res = await fetch(`/api/availability?instructor_id=${instructorId}`)
    const data = await res.json()
    setAvailability(data.data || [])
    setLoading(false)
  }

  const addAvailability = async () => {
    if (startTime >= endTime) {
      alert('End time must be after start time')
      return
    }

    setSaving(true)
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructor_id: instructorId,
        day_of_week: parseInt(selectedDay),
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: parseInt(slotDuration)
      })
    })

    if (res.ok) {
      setDialogOpen(false)
      fetchAvailability()
      // Reset form
      setSelectedDay('1')
      setStartTime('10:00')
      setEndTime('18:00')
    } else {
      const error = await res.json()
      alert(error.error || 'Failed to add availability')
    }
    setSaving(false)
  }

  const removeAvailability = async (id: string) => {
    if (!confirm('Remove this availability? Any pending bookings in this time slot will be declined.')) {
      return
    }

    const res = await fetch(`/api/availability/${id}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      fetchAvailability()
    } else {
      const error = await res.json()
      alert(error.error || 'Failed to remove availability')
    }
  }

  // Group availability by day
  const availabilityByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayIndex: index,
    slots: availability.filter(a => a.day_of_week === index)
  }))

  return (
    <Card className="p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontWeight: 600, margin: 0 }}>Your Availability</h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', margin: 0 }}>
            Set your weekly teaching schedule
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">+ Add Hours</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Available Hours</DialogTitle>
              <DialogDescription>
                Set a recurring weekly time window when you&apos;re available for private lessons
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
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
                  <label style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
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
                <label style={{ fontWeight: 500, fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
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

              <Button onClick={addAvailability} disabled={saving}>
                {saving ? 'Adding...' : 'Add Availability'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          Loading availability...
        </div>
      ) : availability.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          No availability set. Click &quot;+ Add Hours&quot; to set your weekly teaching schedule.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {availabilityByDay
            .filter(day => day.slots.length > 0)
            .map(({ day, dayIndex, slots }) => (
              <div
                key={dayIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ width: '100px', fontWeight: 500 }}>{day}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
                  {slots.map((slot) => (
                    <Badge
                      key={slot.id}
                      variant="outline"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.25rem 0.5rem'
                      }}
                    >
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                        ({slot.slot_duration_minutes}min)
                      </span>
                      <button
                        onClick={() => removeAvailability(slot.id)}
                        style={{
                          marginLeft: '0.25rem',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '1rem',
                          lineHeight: 1,
                          color: 'var(--muted-foreground)'
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  )
}
