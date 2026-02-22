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
import { Ban, Archive } from 'lucide-react'
import { updateTenantStatus } from '../../../../_actions/tenant-actions'

export function TenantStatusActions({
  tenantId,
  currentStatus,
}: {
  tenantId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateTenantStatus(tenantId, newStatus)
      setDialogOpen(null)
    })
  }

  if (currentStatus === 'archived') {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => handleStatusChange('active')}
        className="border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        Reactivate
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      {currentStatus === 'active' && (
        <Dialog open={dialogOpen === 'suspend'} onOpenChange={(open) => setDialogOpen(open ? 'suspend' : null)}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-slate-700 text-yellow-400 hover:bg-slate-800">
              <Ban className="size-4" />
              Suspend
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Suspend Tenant</DialogTitle>
              <DialogDescription className="text-slate-400">
                This will prevent all users from accessing this tenant. The data will be preserved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(null)}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => handleStatusChange('suspended')}
              >
                {isPending ? 'Suspending...' : 'Suspend'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {currentStatus === 'suspended' && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleStatusChange('active')}
          className="border-slate-700 text-green-400 hover:bg-slate-800"
        >
          Reactivate
        </Button>
      )}

      <Dialog open={dialogOpen === 'archive'} onOpenChange={(open) => setDialogOpen(open ? 'archive' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-slate-700 text-red-400 hover:bg-slate-800">
            <Archive className="size-4" />
            Archive
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Archive Tenant</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will archive the tenant. It can be reactivated later, but users will not have access until then.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(null)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => handleStatusChange('archived')}
            >
              {isPending ? 'Archiving...' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
