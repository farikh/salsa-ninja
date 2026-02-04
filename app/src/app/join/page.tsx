'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const [step, setStep] = useState<'code' | 'email' | 'sent'>('code')
  const [inviteCode, setInviteCode] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    // Validate invite code
    const { data: invite, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode.trim())
      .eq('is_active', true)
      .single()

    if (error || !invite) {
      setStatus('error')
      setErrorMsg('Invalid or expired invite code.')
      return
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      setStatus('error')
      setErrorMsg('This invite code has reached its maximum uses.')
      return
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      setStatus('error')
      setErrorMsg('This invite code has expired.')
      return
    }

    setStatus('idle')
    setStep('email')
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          invite_code: inviteCode.trim(),
        },
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStep('sent')
    }
  }

  return (
    <section className="section" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="badge" style={{ marginBottom: '1rem' }}>Invite Only</span>
          <h1 className="heading-lg">Join Salsa Ninja</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            {step === 'code' && 'Enter your invite code to get started'}
            {step === 'email' && 'Enter your email to create your account'}
            {step === 'sent' && 'Almost there!'}
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
        }}>
          {['code', 'email', 'sent'].map((s, i) => (
            <div
              key={s}
              style={{
                width: '3rem',
                height: '4px',
                borderRadius: '2px',
                background: i <= ['code', 'email', 'sent'].indexOf(step)
                  ? 'var(--primary)'
                  : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {step === 'code' && (
          <div className="card" style={{ padding: '2.5rem' }}>
            <form onSubmit={handleCodeSubmit}>
              <label
                htmlFor="invite-code"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}
              >
                Invite Code
              </label>
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter your code"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  fontSize: '1.125rem',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  marginBottom: '1rem',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />

              {status === 'error' && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
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

            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
            }}>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                Already a member?{' '}
                <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}

        {step === 'email' && (
          <div className="card" style={{ padding: '2.5rem' }}>
            <form onSubmit={handleEmailSubmit}>
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
                {status === 'loading' ? 'Sending...' : 'Send Verification Link'}
              </button>
            </form>

            <button
              onClick={() => { setStep('code'); setStatus('idle'); setErrorMsg('') }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                marginTop: '1rem',
                color: 'var(--muted-foreground)',
                fontSize: '0.9rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {step === 'sent' && (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h2 className="heading-md">Check Your Email</h2>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.75rem', lineHeight: 1.7 }}>
              We sent a verification link to <strong>{email}</strong>. Click the link to complete your registration.
            </p>
            <button
              onClick={() => { setStep('code'); setStatus('idle'); setEmail(''); setInviteCode('') }}
              className="btn btn-outline"
              style={{ marginTop: '1.5rem' }}
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
