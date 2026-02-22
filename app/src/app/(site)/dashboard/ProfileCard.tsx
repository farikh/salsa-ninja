'use client'

import { useState, useCallback, useRef } from 'react'

interface ProfileCardProps {
  member: {
    email: string
    full_name: string
    display_name: string | null
    dance_experience: string | null
    created_at: string
  }
}

export function ProfileCard({ member }: ProfileCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState(member.full_name)
  const [displayName, setDisplayName] = useState(member.display_name ?? '')
  const [danceExperience, setDanceExperience] = useState(member.dance_experience ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  // Track last-saved values so cancel reverts to saved state, not stale props
  const savedValues = useRef({
    fullName: member.full_name,
    displayName: member.display_name ?? '',
    danceExperience: member.dance_experience ?? '',
  })

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/member/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          display_name: displayName.trim() || null,
          dance_experience: danceExperience.trim() || null,
        }),
      })
      if (res.ok) {
        savedValues.current = {
          fullName: fullName.trim(),
          displayName: displayName.trim(),
          danceExperience: danceExperience.trim(),
        }
        setFullName(savedValues.current.fullName)
        setDisplayName(savedValues.current.displayName)
        setDanceExperience(savedValues.current.danceExperience)
        setEditing(false)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Failed to save')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }, [fullName, displayName, danceExperience])

  const handleCancel = () => {
    setFullName(savedValues.current.fullName)
    setDisplayName(savedValues.current.displayName)
    setDanceExperience(savedValues.current.danceExperience)
    setEditing(false)
    setError(null)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.4rem 0.6rem',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    background: 'var(--background)',
    color: 'inherit',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, margin: 0 }}>Your Profile</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            Edit
          </button>
        )}
      </div>

      {success && (
        <div style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e',
          fontSize: '0.85rem',
          marginBottom: '0.75rem',
        }}>
          Profile updated successfully
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
          color: 'var(--primary)',
          fontSize: '0.85rem',
          marginBottom: '0.75rem',
        }}>
          {error}
        </div>
      )}

      {editing ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={inputStyle}
              maxLength={100}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={inputStyle}
              maxLength={50}
              placeholder="How you appear to others"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
              Dance Experience
            </label>
            <input
              type="text"
              value={danceExperience}
              onChange={e => setDanceExperience(e.target.value)}
              style={inputStyle}
              maxLength={100}
              placeholder="e.g. Beginner, 2 years salsa"
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Email:</span> {member.email}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                background: 'transparent',
                color: 'inherit',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
          <div><span style={{ color: 'var(--muted-foreground)' }}>Email:</span> {member.email}</div>
          <div><span style={{ color: 'var(--muted-foreground)' }}>Name:</span> {fullName}</div>
          {displayName && (
            <div><span style={{ color: 'var(--muted-foreground)' }}>Display Name:</span> {displayName}</div>
          )}
          {danceExperience && (
            <div><span style={{ color: 'var(--muted-foreground)' }}>Experience:</span> {danceExperience}</div>
          )}
          <div><span style={{ color: 'var(--muted-foreground)' }}>Member since:</span> {new Date(member.created_at).toLocaleDateString()}</div>
        </div>
      )}
    </div>
  )
}
