'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProfileSetupPage() {
  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [danceExperience, setDanceExperience] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStatus('error')
      setErrorMsg('You must be logged in to set up your profile.')
      return
    }

    // Check if member already exists
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      router.push('/dashboard')
      return
    }

    // Create member profile — role assigned by auto_assign_role trigger
    const { error } = await supabase
      .from('members')
      .insert({
        user_id: user.id,
        email: user.email!,
        full_name: fullName.trim(),
        display_name: displayName.trim() || null,
        dance_experience: danceExperience || null,
      })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="badge" style={{ marginBottom: '1rem' }}>Almost Done</span>
          <h1 className="heading-lg">Set Up Your Profile</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            Tell us a bit about yourself
          </p>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="full-name"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}
              >
                Full Name *
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="display-name"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}
              >
                Display Name
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you (optional)"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="experience"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}
              >
                Dance Experience
              </label>
              <select
                id="experience"
                value={danceExperience}
                onChange={(e) => setDanceExperience(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white',
                  color: '#111111',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              >
                <option value="">Select your level</option>
                <option value="none">Complete Beginner</option>
                <option value="beginner">Some Experience</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {status === 'error' && (
              <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'loading'}
              style={{ width: '100%' }}
            >
              {status === 'loading' ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
