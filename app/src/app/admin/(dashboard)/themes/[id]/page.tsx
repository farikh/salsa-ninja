import { createServiceRoleClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ThemeEditor } from './_components/theme-editor'

export default async function ThemeEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceRoleClient()

  const { data: theme } = await supabase
    .from('themes')
    .select('*')
    .eq('id', id)
    .single()

  if (!theme) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/themes"
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Themes
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Edit Theme: {theme.name}</h1>
        <p className="text-sm text-slate-400">Customize colors, fonts, and visual style</p>
      </div>

      <ThemeEditor theme={theme} />
    </div>
  )
}
