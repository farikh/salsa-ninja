import { createServiceRoleClient } from '@/lib/supabase/service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { ThemeAssignAction } from './_components/theme-assign-action'

export default async function ThemesPage() {
  const supabase = createServiceRoleClient()

  const [themesResult, tenantsResult] = await Promise.all([
    supabase
      .from('themes')
      .select('id, name, slug, description, config, is_active, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('tenants')
      .select('id, name, theme_id')
      .eq('status', 'active')
      .order('name', { ascending: true }),
  ])

  const themes = themesResult.data || []
  const tenants = tenantsResult.data || []

  // Count how many tenants use each theme
  const usageCounts: Record<string, number> = {}
  for (const tenant of tenants) {
    if (tenant.theme_id) {
      usageCounts[tenant.theme_id] = (usageCounts[tenant.theme_id] || 0) + 1
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Themes</h1>
        <p className="text-sm text-slate-400">Manage platform themes and assign them to tenants</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const config = theme.config as Record<string, string> | null
          const primary = config?.colors_primary || '#3b82f6'
          const secondary = config?.colors_secondary || '#64748b'
          const accent = config?.colors_accent || '#1e293b'
          const background = config?.colors_background || '#0f172a'
          const usageCount = usageCounts[theme.id] || 0

          return (
            <Card key={theme.id} className="border-slate-800 bg-slate-900">
              <CardContent className="pt-6 space-y-4">
                {/* Color preview bar */}
                <div className="flex h-10 overflow-hidden rounded-lg border border-slate-700">
                  <div className="flex-1" style={{ backgroundColor: primary }} />
                  <div className="flex-1" style={{ backgroundColor: secondary }} />
                  <div className="flex-1" style={{ backgroundColor: accent }} />
                  <div className="flex-1" style={{ backgroundColor: background }} />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{theme.name}</h3>
                    {!theme.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  {theme.description && (
                    <p className="text-xs text-slate-400 mt-1">{theme.description}</p>
                  )}
                </div>

                {/* Color swatches */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="size-4 rounded-full border border-slate-600"
                      style={{ backgroundColor: primary }}
                      title="Primary"
                    />
                    <span className="text-xs text-slate-500">Primary</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="size-4 rounded-full border border-slate-600"
                      style={{ backgroundColor: secondary }}
                      title="Secondary"
                    />
                    <span className="text-xs text-slate-500">Secondary</span>
                  </div>
                </div>

                {/* Usage count */}
                <p className="text-xs text-slate-500">
                  Used by {usageCount} tenant{usageCount !== 1 ? 's' : ''}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <Link href={`/admin/themes/${theme.id}`}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
                  </Button>
                  <ThemeAssignAction
                    themeId={theme.id}
                    tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}

        {themes.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-12">
            No themes found. Run the seed migration to add themes.
          </div>
        )}
      </div>
    </div>
  )
}
