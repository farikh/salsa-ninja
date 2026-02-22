'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTenant } from '../../../../_actions/tenant-actions'

interface Theme {
  id: string
  name: string
  slug: string
  config: Record<string, unknown> | null
}

interface TenantData {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  theme_id: string | null
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  )
}

export function TenantEditForm({
  tenant,
  themes,
}: {
  tenant: TenantData
  themes: Theme[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    const result = await updateTenant(tenant.id, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-300">
          Tenant updated successfully.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-name" className="text-slate-300">Studio Name</Label>
          <Input
            id="edit-name"
            name="name"
            defaultValue={tenant.name}
            required
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-slug" className="text-slate-300">Slug</Label>
          <Input
            id="edit-slug"
            name="slug"
            defaultValue={tenant.slug}
            required
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-domain" className="text-slate-300">Custom Domain</Label>
          <Input
            id="edit-domain"
            name="custom_domain"
            defaultValue={tenant.custom_domain || ''}
            placeholder="studio.example.com"
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-theme" className="text-slate-300">Theme</Label>
          <select
            id="edit-theme"
            name="theme_id"
            defaultValue={tenant.theme_id || ''}
            className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="">No theme</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton />
      </div>
    </form>
  )
}
