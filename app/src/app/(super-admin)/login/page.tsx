'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Shield } from 'lucide-react'

type Status = 'idle' | 'loading' | 'sent' | 'access_denied' | 'error'

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm border-slate-800 bg-slate-900">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20">
              <Shield className="size-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Check Your Email</h2>
              <p className="mt-2 text-sm text-slate-400">
                We sent a login link to <strong className="text-white">{email}</strong>.
                Click the link in the email to sign in.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStatus('idle')
                setEmail('')
              }}
              className="border-slate-700 text-slate-300"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'access_denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm border-slate-800 bg-slate-900">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20">
              <Shield className="size-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Access Denied</h2>
              <p className="mt-2 text-sm text-slate-400">
                This email is not authorized to access the admin panel.
                Contact a super admin for access.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStatus('idle')
                setEmail('')
              }}
              className="border-slate-700 text-slate-300"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-sm border-slate-800 bg-slate-900">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
            P
          </div>
          <CardTitle className="text-white">Platform Admin</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in with your admin email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-slate-300">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
