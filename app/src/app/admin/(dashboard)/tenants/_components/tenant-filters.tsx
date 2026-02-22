'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useCallback, useTransition } from 'react'

const statuses = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
]

export function TenantFilters({
  currentStatus,
  currentQuery,
}: {
  currentStatus: string
  currentQuery: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      startTransition(() => {
        router.push(`/admin/tenants?${params.toString()}`)
      })
    },
    [router, searchParams, startTransition]
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Status tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => updateParams('status', s.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              currentStatus === s.value
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search by name or slug..."
          defaultValue={currentQuery}
          onChange={(e) => updateParams('q', e.target.value)}
          className="pl-9 bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500"
        />
      </div>
    </div>
  )
}
