import { createServiceRoleClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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

export default async function TenantMessagesPage({
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

  // Fetch recent messages with sender and channel info
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      channel_id,
      sender_id,
      channels(name),
      members!messages_sender_id_fkey(display_name, email)
    `)
    .eq('tenant_id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/tenants/${id}`}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {tenant.name}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-sm text-slate-400">{tenant.name} - Recent messages</p>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Channel</TableHead>
                <TableHead className="text-slate-400">Sender</TableHead>
                <TableHead className="text-slate-400">Preview</TableHead>
                <TableHead className="text-slate-400">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!messages || messages.length === 0) ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                    No messages found.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => {
                  const channel = (Array.isArray(message.channels) ? message.channels[0] : message.channels) as { name: string } | null
                  const sender = (Array.isArray(message.members) ? message.members[0] : message.members) as { display_name: string | null; email: string } | null
                  const preview = message.content
                    ? message.content.length > 80
                      ? message.content.slice(0, 80) + '...'
                      : message.content
                    : '—'

                  return (
                    <TableRow key={message.id} className="border-slate-800">
                      <TableCell className="text-slate-300 text-sm">
                        {channel?.name || '—'}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {sender?.display_name || sender?.email || '—'}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                        {preview}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(message.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
