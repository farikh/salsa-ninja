'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateTheme } from '../../../../_actions/theme-actions'

interface ThemeData {
  id: string
  name: string
  slug: string
  description: string | null
  config: Record<string, unknown> | null
}

const COLOR_FIELDS = [
  { key: 'colors_primary', label: 'Primary', default: '#3b82f6' },
  { key: 'colors_secondary', label: 'Secondary', default: '#64748b' },
  { key: 'colors_accent', label: 'Accent', default: '#1e293b' },
  { key: 'colors_background', label: 'Background', default: '#0f172a' },
  { key: 'colors_foreground', label: 'Foreground', default: '#f8fafc' },
  { key: 'colors_muted', label: 'Muted', default: '#334155' },
  { key: 'colors_card', label: 'Card', default: '#1e293b' },
  { key: 'colors_border', label: 'Border', default: '#334155' },
  { key: 'colors_destructive', label: 'Destructive', default: '#ef4444' },
]

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Nunito',
  'Georgia', 'Arial', 'Helvetica', 'system-ui',
]

const RADIUS_OPTIONS = [
  { value: '0', label: 'None' },
  { value: '0.25rem', label: 'Small' },
  { value: '0.5rem', label: 'Medium' },
  { value: '0.75rem', label: 'Large' },
  { value: '1rem', label: 'XL' },
  { value: '1.5rem', label: '2XL' },
]

export function ThemeEditor({ theme }: { theme: ThemeData }) {
  const config = (theme.config || {}) as Record<string, string>
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live preview state
  const [colors, setColors] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const field of COLOR_FIELDS) {
      initial[field.key] = config[field.key] || field.default
    }
    return initial
  })
  const [fontFamily, setFontFamily] = useState(config.font_family || 'Inter')
  const [borderRadius, setBorderRadius] = useState(config.border_radius || '0.5rem')

  function handleColorChange(key: string, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateTheme(theme.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Editor panel */}
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {saved && (
            <div className="rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-300">
              Theme saved successfully.
            </div>
          )}

          {/* Name & Description */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white text-sm">General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-name" className="text-slate-300">Name</Label>
                <Input
                  id="theme-name"
                  name="name"
                  defaultValue={theme.name}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme-desc" className="text-slate-300">Description</Label>
                <Input
                  id="theme-desc"
                  name="description"
                  defaultValue={theme.description || ''}
                  placeholder="Brief description of this theme"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white text-sm">Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COLOR_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-slate-300 text-xs">{field.label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        name={`config_${field.key}`}
                        value={colors[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-slate-700 bg-transparent p-0.5"
                      />
                      <Input
                        value={colors[field.key]}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white font-mono text-xs flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Typography & Shape */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white text-sm">Typography & Shape</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs">Font Family</Label>
                <select
                  name="config_font_family"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs">
                  Border Radius: {borderRadius}
                </Label>
                <input
                  type="range"
                  name="config_border_radius"
                  min="0"
                  max="5"
                  value={RADIUS_OPTIONS.findIndex((r) => r.value === borderRadius)}
                  onChange={(e) => setBorderRadius(RADIUS_OPTIONS[Number(e.target.value)]?.value || '0.5rem')}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  {RADIUS_OPTIONS.map((r) => (
                    <span key={r.value}>{r.label}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? 'Saving...' : 'Save Theme'}
            </Button>
          </div>
        </div>

        {/* Live preview panel */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white text-sm">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border p-5 space-y-4"
                style={{
                  backgroundColor: colors.colors_background,
                  borderColor: colors.colors_border,
                  fontFamily: fontFamily,
                  color: colors.colors_foreground,
                }}
              >
                {/* Preview heading */}
                <h3
                  className="text-lg font-bold"
                  style={{ color: colors.colors_foreground }}
                >
                  Studio Dashboard
                </h3>
                <p
                  className="text-sm"
                  style={{ color: colors.colors_muted }}
                >
                  This is how your tenant&apos;s site will look.
                </p>

                {/* Preview card */}
                <div
                  className="p-4 space-y-3"
                  style={{
                    backgroundColor: colors.colors_card,
                    borderRadius: borderRadius,
                    border: `1px solid ${colors.colors_border}`,
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: colors.colors_foreground }}
                  >
                    Upcoming Class
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.colors_muted }}
                  >
                    Saturday Salsa Fundamentals
                  </p>
                  {/* Preview buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium text-white"
                      style={{
                        backgroundColor: colors.colors_primary,
                        borderRadius: borderRadius,
                      }}
                    >
                      RSVP
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium border"
                      style={{
                        color: colors.colors_foreground,
                        borderColor: colors.colors_border,
                        backgroundColor: 'transparent',
                        borderRadius: borderRadius,
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Preview badge/accent */}
                <div className="flex gap-2">
                  <span
                    className="px-2 py-0.5 text-xs font-medium text-white"
                    style={{
                      backgroundColor: colors.colors_primary,
                      borderRadius: borderRadius,
                    }}
                  >
                    Active
                  </span>
                  <span
                    className="px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: colors.colors_accent,
                      color: colors.colors_foreground,
                      borderRadius: borderRadius,
                    }}
                  >
                    Beginner
                  </span>
                  <span
                    className="px-2 py-0.5 text-xs font-medium text-white"
                    style={{
                      backgroundColor: colors.colors_destructive,
                      borderRadius: borderRadius,
                    }}
                  >
                    Full
                  </span>
                </div>

                {/* Preview input */}
                <input
                  type="text"
                  readOnly
                  placeholder="Search classes..."
                  className="w-full px-3 py-2 text-xs outline-none"
                  style={{
                    backgroundColor: colors.colors_card,
                    border: `1px solid ${colors.colors_border}`,
                    borderRadius: borderRadius,
                    color: colors.colors_foreground,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
