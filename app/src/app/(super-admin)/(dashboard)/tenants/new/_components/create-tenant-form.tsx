'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenant } from '../../../../_actions/tenant-actions'

interface Theme {
  id: string
  name: string
  slug: string
  config: Record<string, unknown> | null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {pending ? 'Creating...' : 'Create Tenant'}
    </Button>
  )
}

export function CreateTenantForm({ themes }: { themes: Theme[] }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) {
      setSlug(slugify(value))
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createTenant(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-300">Studio Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          placeholder="e.g. Salsa Ninja Dance Academy"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug" className="text-slate-300">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setSlugEdited(true)
          }}
          required
          placeholder="salsa-ninja"
          className="bg-slate-800 border-slate-700 text-white font-mono text-sm placeholder:text-slate-500"
        />
        <p className="text-xs text-slate-500">
          Used for subdomain: {slug || 'studio'}.yourdomain.com
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme_id" className="text-slate-300">Theme</Label>
        <select
          id="theme_id"
          name="theme_id"
          className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <option value="">No theme (default)</option>
          {themes.map((theme) => {
            const config = theme.config as Record<string, string> | null
            const primaryColor = config?.colors_primary || '#3b82f6'
            return (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            )
          })}
        </select>
        {/* Color swatches below dropdown */}
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {themes.map((theme) => {
              const config = theme.config as Record<string, string> | null
              const primary = config?.colors_primary || '#3b82f6'
              const secondary = config?.colors_secondary || '#64748b'
              return (
                <div key={theme.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div
                    className="size-3 rounded-full border border-slate-600"
                    style={{ backgroundColor: primary }}
                  />
                  <div
                    className="size-3 rounded-full border border-slate-600"
                    style={{ backgroundColor: secondary }}
                  />
                  <span>{theme.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_email" className="text-slate-300">Owner Email</Label>
        <Input
          id="owner_email"
          name="owner_email"
          type="email"
          required
          placeholder="owner@example.com"
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
        <p className="text-xs text-slate-500">
          If this email doesn&apos;t have an account, they&apos;ll receive an invite.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <SubmitButton />
      </div>
    </form>
  )
}
