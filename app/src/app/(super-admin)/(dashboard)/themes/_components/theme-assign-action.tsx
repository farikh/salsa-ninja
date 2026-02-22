'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowRight } from 'lucide-react'
import { assignThemeToTenant } from '../../../_actions/theme-actions'

export function ThemeAssignAction({
  themeId,
  tenants,
}: {
  themeId: string
  tenants: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAssign() {
    if (!selectedTenant) return
    startTransition(async () => {
      await assignThemeToTenant(themeId, selectedTenant)
      setOpen(false)
      setSelectedTenant('')
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          <ArrowRight className="size-3.5" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Assign Theme to Tenant</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select a tenant to apply this theme to.
          </DialogDescription>
        </DialogHeader>
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-white shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <option value="">Select a tenant...</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-700 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedTenant || isPending}
            onClick={handleAssign}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
