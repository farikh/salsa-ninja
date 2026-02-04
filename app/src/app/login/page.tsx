'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'not_found' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    // Check if email exists in members table
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!member) {
      // Email not found — ask if they want to join
      setStatus('not_found')
      return
    }

    // Existing member — send magic link
    await sendMagicLink(false)
  }

  async function sendMagicLink(newUser: boolean) {
    setStatus('loading')
    setIsNewUser(newUser)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="heading-lg">
            {status === 'not_found' ? 'Join Salsa Ninja' : 'Welcome'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            {status === 'not_found'
              ? "We don't have an account for that email yet"
              : 'Enter your email to get started'}
          </p>
        </div>

        {status === 'sent' ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h2 className="heading-md">Check Your Email</h2>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.75rem', lineHeight: 1.7 }}>
              {isNewUser
                ? <>We sent a link to <strong>{email}</strong>. Click it to set up your profile and join!</>
                : <>We sent a login link to <strong>{email}</strong>. Click the link in the email to sign in.</>
              }
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail(''); setIsNewUser(false) }}
              className="btn btn-outline"
              style={{ marginTop: '1.5rem' }}
            >
              Use a different email
            </button>
          </div>
        ) : status === 'not_found' ? (
          <div className="card" style={{ padding: '2.5rem' }}>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem', textAlign: 'center' }}>
              <strong>{email}</strong> isn&apos;t registered yet. Would you like to join?
            </p>
            <button
              onClick={() => sendMagicLink(true)}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '0.75rem' }}
            >
              Yes, send me a link to join
            </button>
            <button
              onClick={() => { setStatus('idle'); setEmail('') }}
              className="btn btn-outline"
              style={{ width: '100%' }}
            >
              Try a different email
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: '2.5rem' }}>
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="email"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                  marginBottom: '1rem',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />

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
                {status === 'loading' ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
