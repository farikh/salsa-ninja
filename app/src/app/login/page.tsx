'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
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
          <h1 className="heading-lg">Welcome Back</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            Enter your email to receive a login link
          </p>
        </div>

        {status === 'sent' ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h2 className="heading-md">Check Your Email</h2>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.75rem', lineHeight: 1.7 }}>
              We sent a login link to <strong>{email}</strong>. Click the link in the email to sign in.
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail('') }}
              className="btn btn-outline"
              style={{ marginTop: '1.5rem' }}
            >
              Use a different email
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
                {status === 'loading' ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>

            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
            }}>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                Don&apos;t have an account?{' '}
                <Link href="/join" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Join now
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
