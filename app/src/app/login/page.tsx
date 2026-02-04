'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'not_found' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    // Check if email exists (uses SECURITY DEFINER function to bypass RLS)
    const { data: exists } = await supabase
      .rpc('check_member_exists', { check_email: email.trim().toLowerCase() })

    if (!exists) {
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
            <button
              onClick={signInWithGoogle}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                background: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              margin: '1.5rem 0',
              color: 'var(--muted-foreground)',
              fontSize: '0.85rem',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              or
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

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
                {status === 'loading' ? 'Checking...' : 'Continue with Email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
