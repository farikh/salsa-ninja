import { createServiceRoleClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateTenantForm } from './_components/create-tenant-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewTenantPage() {
  const supabase = createServiceRoleClient()

  const { data: themes } = await supabase
    .from('themes')
    .select('id, name, slug, config')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/tenants"
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Tenants
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Create Tenant</h1>
        <p className="text-sm text-slate-400">Set up a new studio on the platform</p>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="pt-6">
          <CreateTenantForm themes={themes || []} />
        </CardContent>
      </Card>
    </div>
  )
}
