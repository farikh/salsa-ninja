'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const EVENT_TYPES = [
  { value: 'studio_social', label: 'Social' },
  { value: 'bootcamp', label: 'Bootcamp' },
  { value: 'community', label: 'Other' },
] as const

const EVENT_TYPE_LABELS: Record<string, string> = {
  class: 'Class',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  studio_social: 'Social',
  community: 'Other',
}

const COMMON_TAGS = ['BYOB', 'Light Bites', 'Free Parking', 'All Levels', 'Live Music']

interface EventItem {
  id: string
  title: string
  description: string | null
  event_type: string
  start_time: string
  end_time: string
  location: string | null
  music_genre: string | null
  price: number | null
  tags: string[] | null
  dress_code: string | null
  purchase_enabled: boolean
  purchase_url: string | null
}

interface UpcomingEventsWidgetProps {
  initialEvents: EventItem[]
  isStaff: boolean
}

interface EditValues {
  title: string
  description: string
  event_type: string
  start_time: string
  end_time: string
  location: string
  music_genre: string
  price: string
  tags: string[]
  dress_code: string
  purchase_enabled: boolean
  purchase_url: string
}

const DEFAULT_EDIT: EditValues = {
  title: '',
  description: '',
  event_type: 'studio_social',
  start_time: '',
  end_time: '',
  location: '',
  music_genre: '',
  price: '',
  tags: [],
  dress_code: '',
  purchase_enabled: false,
  purchase_url: '',
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
  const [editValues, setEditValues] = useState<EditValues>(DEFAULT_EDIT)
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
      event_type: event.event_type || 'studio_social',
      start_time: toLocalInput(event.start_time),
      end_time: toLocalInput(event.end_time),
      location: event.location || '',
      music_genre: event.music_genre || '',
      price: event.price != null ? String(event.price) : '',
      tags: event.tags || [],
      dress_code: event.dress_code || '',
      purchase_enabled: event.purchase_enabled || false,
      purchase_url: event.purchase_url || '',
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

    const updateData = {
      title: editValues.title.trim(),
      description: editValues.description.trim() || null,
      event_type: editValues.event_type,
      start_time: new Date(editValues.start_time).toISOString(),
      end_time: new Date(editValues.end_time).toISOString(),
      location: editValues.location.trim() || null,
      music_genre: editValues.music_genre.trim() || null,
      price: editValues.price ? parseFloat(editValues.price) : null,
      tags: editValues.tags.length > 0 ? editValues.tags : null,
      dress_code: editValues.dress_code.trim() || null,
      purchase_enabled: editValues.purchase_enabled,
      purchase_url: editValues.purchase_url.trim() || null,
    }

    const { error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', editingId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setEvents(prev => prev.map(e =>
      e.id === editingId
        ? { ...e, ...updateData }
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
        event_type: 'studio_social',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      })
      .select('id, title, description, event_type, start_time, end_time, location, music_genre, price, tags, dress_code, purchase_enabled, purchase_url')
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

  function toggleTag(tag: string) {
    setEditValues(v => ({
      ...v,
      tags: v.tags.includes(tag) ? v.tags.filter(t => t !== tag) : [...v.tags, tag],
    }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    fontSize: '0.85rem',
    outline: 'none',
    background: 'var(--card)',
    color: 'inherit',
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
        <p style={{ color: 'var(--destructive)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
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
                background: 'rgba(220,38,38,0.1)',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: i < events.length - 1 ? '0.5rem' : 0,
              }}
            >
              <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                Delete &ldquo;{event.title}&rdquo;?
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => confirmDelete(event.id)}
                  disabled={saving}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem',
                    background: 'var(--primary)',
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
                    background: 'transparent',
                    color: 'inherit',
                    border: '1px solid rgba(255,255,255,0.2)',
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
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: i < events.length - 1 ? '0.5rem' : 0,
              }}
            >
              {/* Title */}
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

              {/* Event Type Picklist */}
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
                  Event Type
                </label>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEditValues(v => ({ ...v, event_type: type.value }))}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '0.375rem',
                        border: editValues.event_type === type.value
                          ? '1px solid var(--primary)'
                          : '1px solid rgba(255,255,255,0.15)',
                        background: editValues.event_type === type.value
                          ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                          : 'transparent',
                        color: editValues.event_type === type.value
                          ? 'var(--primary)'
                          : 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '0.5rem' }}>
                <textarea
                  value={editValues.description}
                  onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Date inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Start</label>
                  <input type="datetime-local" value={editValues.start_time} onChange={(e) => setEditValues(v => ({ ...v, start_time: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>End</label>
                  <input type="datetime-local" value={editValues.end_time} onChange={(e) => setEditValues(v => ({ ...v, end_time: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>

              {/* Location */}
              <div style={{ marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={editValues.location}
                  onChange={(e) => setEditValues(v => ({ ...v, location: e.target.value }))}
                  placeholder="Location"
                  style={inputStyle}
                />
              </div>

              {/* Music & Entry in a row */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={editValues.music_genre}
                    onChange={(e) => setEditValues(v => ({ ...v, music_genre: e.target.value }))}
                    placeholder="Music (e.g. Live DJ)"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={editValues.price}
                    onChange={(e) => setEditValues(v => ({ ...v, price: e.target.value }))}
                    placeholder="Entry $ (e.g. 15)"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Dress Code */}
              <div style={{ marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={editValues.dress_code}
                  onChange={(e) => setEditValues(v => ({ ...v, dress_code: e.target.value }))}
                  placeholder="Dress code (e.g. Dress to Impress)"
                  style={inputStyle}
                />
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {COMMON_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        border: editValues.tags.includes(tag)
                          ? '1px solid var(--primary)'
                          : '1px solid rgba(255,255,255,0.15)',
                        background: editValues.tags.includes(tag)
                          ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                          : 'transparent',
                        color: editValues.tags.includes(tag)
                          ? 'var(--primary)'
                          : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purchase Tickets Toggle */}
              <div
                onClick={() => setEditValues(v => ({ ...v, purchase_enabled: !v.purchase_enabled }))}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: editValues.purchase_enabled ? '1px solid color-mix(in srgb, var(--primary) 40%, transparent)' : '1px solid rgba(255,255,255,0.1)',
                  background: editValues.purchase_enabled ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                  cursor: 'pointer',
                  marginBottom: editValues.purchase_enabled ? '0.5rem' : '0.75rem',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Include Purchase Tickets</span>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '3px',
                  border: editValues.purchase_enabled ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.2)',
                  background: editValues.purchase_enabled ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}>
                  {editValues.purchase_enabled && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Purchase URL — only when purchase_enabled */}
              {editValues.purchase_enabled && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="url"
                    value={editValues.purchase_url}
                    onChange={(e) => setEditValues(v => ({ ...v, purchase_url: e.target.value }))}
                    placeholder="Purchase URL (e.g. https://square.link/...)"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.8rem',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || !editValues.title.trim()}
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.8rem',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: saving || !editValues.title.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: saving || !editValues.title.trim() ? 0.5 : 1,
                  }}
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
            onClick={() => isStaff ? startEditing(event) : undefined}
          >
            <Link
              href={`/events/${event.id}`}
              onClick={(e) => { if (isStaff) e.preventDefault() }}
              style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{event.title}</span>
                {event.event_type && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '1px 8px',
                    borderRadius: '9999px',
                    background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                    color: 'var(--primary)',
                    border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                  }}>
                    {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                  </span>
                )}
              </div>
              {event.description && (
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {event.description}
                </div>
              )}
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {formatEventTime(event.start_time, event.end_time)}
              </div>
            </Link>
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
