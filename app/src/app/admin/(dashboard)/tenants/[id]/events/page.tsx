import { createServiceRoleClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TenantEventsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceRoleClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!tenant) {
    notFound()
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title, start_time, end_time, event_type, location, max_capacity, created_at')
    .eq('tenant_id', id)
    .order('start_time', { ascending: false })
    .limit(100)

  // Get RSVP counts per event
  const eventIds = (events || []).map((e) => e.id)
  let rsvpCounts: Record<string, number> = {}

  if (eventIds.length > 0) {
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'confirmed')

    if (rsvps) {
      rsvpCounts = rsvps.reduce((acc: Record<string, number>, row) => {
        acc[row.event_id] = (acc[row.event_id] || 0) + 1
        return acc
      }, {})
    }
  }

  const typeColors: Record<string, string> = {
    class: 'bg-red-600',
    workshop: 'bg-amber-600',
    bootcamp: 'bg-orange-600',
    social: 'bg-purple-600',
    community: 'bg-green-600',
    private: 'bg-blue-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/tenants/${id}`}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {tenant.name}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="text-sm text-slate-400">{tenant.name} - {events?.length || 0} events</p>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Title</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">RSVP Count</TableHead>
                <TableHead className="text-slate-400">Capacity</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!events || events.length === 0) ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No events found.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="border-slate-800">
                    <TableCell className="text-white font-medium">{event.title}</TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {new Date(event.start_time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs text-white ${typeColors[event.event_type] || 'bg-slate-600'}`}
                      >
                        {event.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {rsvpCounts[event.id] || 0}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {event.max_capacity || 'Unlimited'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {event.location || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
