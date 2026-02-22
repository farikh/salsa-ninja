'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/lib/tenant/context'

type LoginMode = 'magic_link' | 'password' | 'google'
type Status = 'idle' | 'loading' | 'sent' | 'not_found' | 'error'

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, maxAge = 31536000) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('magic_link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [cookieLoaded, setCookieLoaded] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { tenant } = useTenant()
  const studioName = tenant?.name || 'Studio'

  // Read saved login method from cookie on mount
  useEffect(() => {
    const saved = readCookie('login_method')
    if (saved === 'magic_link' || saved === 'password' || saved === 'google') {
      setMode(saved)
    }
    setCookieLoaded(true)
  }, [])

  function switchMode(newMode: LoginMode) {
    setMode(newMode)
    setStatus('idle')
    setErrorMsg('')
    setShowSignUp(false)
    setCookie('login_method', newMode)
  }

  // === Magic Link ===
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { data: exists } = await supabase
      .rpc('check_member_exists', { check_email: email.trim().toLowerCase() })

    if (!exists) {
      setStatus('not_found')
      return
    }

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

  // === Password ===
  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setIsNewUser(true)
      setStatus('sent')
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setErrorMsg('Enter your email address first')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback` }
    )

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  // === Google ===
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  // Don't render until cookie is read to avoid flash
  if (!cookieLoaded) return null

  const MODES: { id: LoginMode; label: string }[] = [
    { id: 'magic_link', label: 'Magic Link' },
    { id: 'password', label: 'Password' },
    { id: 'google', label: 'Google' },
  ]

  // === Shared "Check Email" screen ===
  if (status === 'sent') {
    return (
      <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '420px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📧</div>
            <h2 className="heading-md">Check Your Email</h2>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
              {mode === 'password' && !isNewUser
                ? <>We sent a password reset link to <strong>{email}</strong>.</>
                : isNewUser
                  ? <>We sent a link to <strong>{email}</strong>. Click it to set up your profile and join!</>
                  : <>We sent a login link to <strong>{email}</strong>. Click the link in the email to sign in.</>
              }
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail(''); setPassword(''); setIsNewUser(false) }}
              className="btn btn-outline"
              style={{ marginTop: '1rem' }}
            >
              Back to login
            </button>
          </div>
        </div>
      </section>
    )
  }

  // === "Not found" screen (magic link only) ===
  if (status === 'not_found') {
    return (
      <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <h1 className="heading-lg">Join {studioName}</h1>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              We don&apos;t have an account for that email yet
            </p>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem', textAlign: 'center' }}>
              <strong>{email}</strong> isn&apos;t registered yet. Would you like to join?
            </p>
            <button
              onClick={() => sendMagicLink(true)}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '0.5rem' }}
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
        </div>
      </section>
    )
  }

  return (
    <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 className="heading-lg">
            {showSignUp ? 'Create Account' : 'Welcome'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {showSignUp
              ? 'Sign up with email and password'
              : 'Sign in to your account'}
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Mode Selector */}
          <div style={{
            display: 'flex',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  background: mode === m.id ? 'var(--primary)' : 'transparent',
                  color: mode === m.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  borderRight: m.id !== 'google' ? '1px solid var(--border)' : 'none',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* === Google Tab === */}
          {mode === 'google' && (
            <button
              onClick={signInWithGoogle}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                background: 'white',
                color: 'var(--dark)',
                fontSize: '0.95rem',
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
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          )}

          {/* === Magic Link Tab === */}
          {mode === 'magic_link' && (
            <form onSubmit={handleMagicLink}>
              <label
                htmlFor="email"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}
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
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  marginBottom: '0.75rem',
                  background: 'var(--background)',
                  color: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />

              {status === 'error' && (
                <p style={{ color: 'var(--destructive)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'loading'}
                style={{ width: '100%' }}
              >
                {status === 'loading' ? 'Checking...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          {/* === Password Tab === */}
          {mode === 'password' && !showSignUp && (
            <form onSubmit={handlePassword}>
              <label
                htmlFor="email-pw"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}
              >
                Email address
              </label>
              <input
                id="email-pw"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  marginBottom: '0.75rem',
                  background: 'var(--background)',
                  color: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />

              <label
                htmlFor="password"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}
              >
                Password
              </label>
              <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.75rem 0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'var(--background)',
                    color: 'inherit',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    padding: '2px',
                    display: 'flex',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              <div style={{ textAlign: 'right', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {status === 'error' && (
                <p style={{ color: 'var(--destructive)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'loading'}
                style={{ width: '100%', marginBottom: '0.75rem' }}
              >
                {status === 'loading' ? 'Signing in...' : 'Sign In'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowSignUp(true); setStatus('idle'); setErrorMsg('') }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.8rem',
                  }}
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* === Sign Up Form (password mode) === */}
          {mode === 'password' && showSignUp && (
            <form onSubmit={handleSignUp}>
              <label
                htmlFor="email-signup"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}
              >
                Email address
              </label>
              <input
                id="email-signup"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  marginBottom: '0.75rem',
                  background: 'var(--background)',
                  color: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />

              <label
                htmlFor="password-signup"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.85rem' }}
              >
                Create password
              </label>
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <input
                  id="password-signup"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.75rem 0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'var(--background)',
                    color: 'inherit',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    padding: '2px',
                    display: 'flex',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {status === 'error' && (
                <p style={{ color: 'var(--destructive)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'loading'}
                style={{ width: '100%', marginBottom: '0.75rem' }}
              >
                {status === 'loading' ? 'Creating account...' : 'Create Account'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowSignUp(false); setStatus('idle'); setErrorMsg('') }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.8rem',
                  }}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
