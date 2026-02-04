'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EventItem {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
}

interface UpcomingEventsWidgetProps {
  initialEvents: EventItem[]
  isStaff: boolean
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatEventTime(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
  const datePart = s.toLocaleDateString(undefined, dateOpts)
  const startTime = s.toLocaleTimeString(undefined, timeOpts)
  const endTime = e.toLocaleTimeString(undefined, timeOpts)
  return `${datePart}, ${startTime} – ${endTime}`
}

export default function UpcomingEventsWidget({ initialEvents, isStaff }: UpcomingEventsWidgetProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ title: '', description: '', start_time: '', end_time: '' })
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  function startEditing(event: EventItem) {
    if (!isStaff || saving) return
    setEditingId(event.id)
    setEditValues({
      title: event.title,
      description: event.description || '',
      start_time: toLocalInput(event.start_time),
      end_time: toLocalInput(event.end_time),
    })
    setPendingDeleteId(null)
    setError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setError('')
  }

  async function saveEdit() {
    if (!editingId || saving) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('events')
      .update({
        title: editValues.title.trim(),
        description: editValues.description.trim() || null,
        start_time: new Date(editValues.start_time).toISOString(),
        end_time: new Date(editValues.end_time).toISOString(),
      })
      .eq('id', editingId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setEvents(prev => prev.map(e =>
      e.id === editingId
        ? {
            ...e,
            title: editValues.title.trim(),
            description: editValues.description.trim() || null,
            start_time: new Date(editValues.start_time).toISOString(),
            end_time: new Date(editValues.end_time).toISOString(),
          }
        : e
    ))
    setEditingId(null)
    setSaving(false)
  }

  async function addEvent() {
    if (saving) return
    setSaving(true)
    setError('')

    const now = new Date()
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    const { data, error: insertError } = await supabase
      .from('events')
      .insert({
        title: 'New Event',
        description: '',
        event_type: 'class',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      })
      .select('id, title, description, start_time, end_time')
      .single()

    if (insertError || !data) {
      setError(insertError?.message || 'Failed to create event')
      setSaving(false)
      return
    }

    setEvents(prev => [data, ...prev])
    setSaving(false)
    startEditing(data)
  }

  async function confirmDelete(id: string) {
    if (saving) return
    setSaving(true)
    setError('')

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setSaving(false)
      return
    }

    setEvents(prev => prev.filter(e => e.id !== id))
    setPendingDeleteId(null)
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    fontSize: '0.9rem',
    outline: 'none',
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontWeight: 600 }}>Upcoming Events</h3>
        {isStaff && (
          <button
            className="btn btn-primary"
            onClick={addEvent}
            disabled={saving}
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
          >
            + Add Event
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
      )}

      {events.length === 0 && (
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
          No upcoming events yet.{isStaff ? ' Click "+ Add Event" to create one.' : ' Check back soon!'}
        </p>
      )}

      {events.map((event, i) => {
        if (pendingDeleteId === event.id) {
          return (
            <div
              key={event.id}
              style={{
                padding: '0.75rem',
                background: '#fef2f2',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: i < events.length - 1 ? '0.5rem' : 0,
              }}
            >
              <span style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: 500 }}>
                Delete &ldquo;{event.title}&rdquo;?
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => confirmDelete(event.id)}
                  disabled={saving}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setPendingDeleteId(null)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        }

        if (editingId === event.id) {
          return (
            <div
              key={event.id}
              style={{
                padding: '0.75rem',
                background: 'var(--muted)',
                borderRadius: '0.5rem',
                marginBottom: i < events.length - 1 ? '0.5rem' : 0,
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={editValues.title}
                  onChange={(e) => setEditValues(v => ({ ...v, title: e.target.value }))}
                  placeholder="Event title"
                  style={{ ...inputStyle, fontWeight: 600 }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <textarea
                  value={editValues.description}
                  onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={editValues.start_time}
                    onChange={(e) => setEditValues(v => ({ ...v, start_time: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={editValues.end_time}
                    onChange={(e) => setEditValues(v => ({ ...v, end_time: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-outline"
                  onClick={cancelEditing}
                  disabled={saving}
                  style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveEdit}
                  disabled={saving || !editValues.title.trim()}
                  style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem' }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )
        }

        return (
          <div
            key={event.id}
            style={{
              padding: '0.75rem 0',
              borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              cursor: isStaff ? 'pointer' : 'default',
            }}
            onClick={() => startEditing(event)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{event.title}</div>
              {event.description && (
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {event.description}
                </div>
              )}
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {formatEventTime(event.start_time, event.end_time)}
              </div>
            </div>
            {isStaff && (
              <button
                onClick={(e) => { e.stopPropagation(); setPendingDeleteId(event.id) }}
                title="Delete event"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '0.25rem',
                  lineHeight: 1,
                  marginLeft: '0.5rem',
                }}
              >
                &times;
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
