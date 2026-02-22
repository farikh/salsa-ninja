'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ScheduleSlot {
  id: string
  day: string
  time_slot: string
  class_name: string
  class_level: string | null
  color_key: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
const TIMES = ['6P-7P', '7P-8P', '8P-9P', '9P-10P', '10P-11P']
const COLOR_OPTIONS = [
  { value: 'bootcamp', label: 'Bootcamp / Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'openLevel', label: 'Open Level' },
  { value: 'team', label: 'Team Training' },
]

interface ScheduleGridProps {
  initialSlots: ScheduleSlot[]
}

export default function ScheduleGrid({ initialSlots }: ScheduleGridProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>(initialSlots)
  const [isStaff, setIsStaff] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ class_name: '', class_level: '', color_key: 'intermediate' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeDay, setActiveDay] = useState(DAYS[0])
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('member_profiles')
          .select('role_name')
          .eq('user_id', user.id)
          .single()
        if (data && (data.role_name === 'owner' || data.role_name === 'instructor')) {
          setIsStaff(true)
        }
      }
    })
  }, [supabase])

  function getSlot(day: string, time: string): ScheduleSlot | undefined {
    return slots.find(s => s.day === day && s.time_slot === time)
  }

  function cellKey(day: string, time: string) {
    return `${day}-${time}`
  }

  function startEditing(day: string, time: string) {
    if (!isStaff || saving) return
    const slot = getSlot(day, time)
    setEditingKey(cellKey(day, time))
    setEditValues({
      class_name: slot?.class_name || '',
      class_level: slot?.class_level || '',
      color_key: slot?.color_key || 'intermediate',
    })
    setError('')
  }

  function cancelEditing() {
    setEditingKey(null)
    setError('')
  }

  async function saveSlot(day: string, time: string) {
    if (saving || !editValues.class_name.trim()) return
    setSaving(true)
    setError('')

    const existing = getSlot(day, time)

    if (existing) {
      const { error: err } = await supabase
        .from('schedule_slots')
        .update({
          class_name: editValues.class_name.trim(),
          class_level: editValues.class_level.trim() || null,
          color_key: editValues.color_key,
        })
        .eq('id', existing.id)

      if (err) { setError(err.message); setSaving(false); return }

      setSlots(prev => prev.map(s =>
        s.id === existing.id
          ? { ...s, class_name: editValues.class_name.trim(), class_level: editValues.class_level.trim() || null, color_key: editValues.color_key }
          : s
      ))
    } else {
      const { data, error: err } = await supabase
        .from('schedule_slots')
        .insert({
          day,
          time_slot: time,
          class_name: editValues.class_name.trim(),
          class_level: editValues.class_level.trim() || null,
          color_key: editValues.color_key,
        })
        .select()
        .single()

      if (err || !data) { setError(err?.message || 'Failed to add'); setSaving(false); return }
      setSlots(prev => [...prev, data])
    }

    setEditingKey(null)
    setSaving(false)
  }

  async function deleteSlot(day: string, time: string) {
    const slot = getSlot(day, time)
    if (!slot || saving) return
    setSaving(true)
    setError('')

    const { error: err } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('id', slot.id)

    if (err) { setError(err.message); setSaving(false); return }

    setSlots(prev => prev.filter(s => s.id !== slot.id))
    setEditingKey(null)
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.35rem 0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border)',
    fontSize: '0.8rem',
    outline: 'none',
  }

  function renderEditForm(day: string, time: string, slot: ScheduleSlot | undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <input
          type="text"
          value={editValues.class_name}
          onChange={(e) => setEditValues(v => ({ ...v, class_name: e.target.value }))}
          placeholder="Class name"
          style={inputStyle}
          autoFocus
        />
        <input
          type="text"
          value={editValues.class_level}
          onChange={(e) => setEditValues(v => ({ ...v, class_level: e.target.value }))}
          placeholder="Level"
          style={inputStyle}
        />
        <select
          value={editValues.color_key}
          onChange={(e) => setEditValues(v => ({ ...v, color_key: e.target.value }))}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {COLOR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => saveSlot(day, time)}
            disabled={saving || !editValues.class_name.trim()}
            style={{
              flex: 1, padding: '0.25rem', fontSize: '0.75rem',
              background: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '0.25rem', cursor: 'pointer',
            }}
          >
            {saving ? '...' : 'Save'}
          </button>
          {slot && (
            <button
              onClick={() => deleteSlot(day, time)}
              disabled={saving}
              style={{
                padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                background: 'var(--destructive)', color: 'white',
                border: 'none', borderRadius: '0.25rem', cursor: 'pointer',
              }}
            >
              Del
            </button>
          )}
          <button
            onClick={cancelEditing}
            style={{
              flex: 1, padding: '0.25rem', fontSize: '0.75rem',
              background: 'white', color: 'var(--dark)', border: '1px solid var(--border)',
              borderRadius: '0.25rem', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <p style={{ color: 'var(--destructive)', fontSize: '0.85rem', marginBottom: '0.75rem', textAlign: 'center' }}>{error}</p>
      )}

      {/* Mobile: day tabs + stacked cards */}
      <div className="schedule-mobile">
        <div className="schedule-day-tabs">
          {DAYS.map((day) => (
            <button
              key={day}
              className={`schedule-day-tab ${activeDay === day ? 'active' : ''}`}
              onClick={() => setActiveDay(day)}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="schedule-day-cards">
          {TIMES.map((time) => {
            const slot = getSlot(activeDay, time)
            const key = cellKey(activeDay, time)
            const isEditing = editingKey === key

            return (
              <div
                key={key}
                className={`schedule-mobile-row ${slot ? '' : 'empty'}`}
                onClick={() => isStaff && !isEditing && startEditing(activeDay, time)}
                style={{ cursor: isStaff && !isEditing ? 'pointer' : 'default' }}
              >
                <div className="schedule-mobile-time">{time}</div>
                {isEditing ? (
                  <div className="schedule-mobile-edit">
                    {renderEditForm(activeDay, time, slot)}
                  </div>
                ) : slot ? (
                  <div className={`class-card ${slot.color_key}`}>
                    <div className="class-name">{slot.class_name}</div>
                    <div className="class-level">{slot.class_level}</div>
                  </div>
                ) : (
                  <div className="schedule-mobile-empty">—</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Desktop: full table */}
      <div className="schedule-desktop">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="time-header">Time</th>
              {DAYS.map((day) => (
                <th key={day} className="day-header">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((time, timeIndex) => (
              <tr key={time}>
                <td className="time-cell">{time}</td>
                {DAYS.map((day) => {
                  const slot = getSlot(day, time)
                  const key = cellKey(day, time)
                  const isEditing = editingKey === key

                  if (isEditing) {
                    return (
                      <td key={key} className="class-cell" style={{ padding: '0.5rem', verticalAlign: 'top' }}>
                        {renderEditForm(day, time, slot)}
                      </td>
                    )
                  }

                  return (
                    <td
                      key={key}
                      className={`class-cell ${!slot ? (timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white') : ''}`}
                      onClick={() => isStaff && startEditing(day, time)}
                      style={{ cursor: isStaff ? 'pointer' : 'default' }}
                    >
                      {slot && (
                        <div className={`class-card ${slot.color_key}`}>
                          <div className="class-name">{slot.class_name}</div>
                          <div className="class-level">{slot.class_level}</div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
