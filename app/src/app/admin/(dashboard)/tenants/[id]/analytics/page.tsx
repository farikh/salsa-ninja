import { createServiceRoleClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, CalendarDays, Activity, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function TenantAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceRoleClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, created_at')
    .eq('id', id)
    .single()

  if (!tenant) {
    notFound()
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Fetch analytics data in parallel
  const [
    totalMembersResult,
    recentSignupsResult,
    activeUsersResult,
    totalEventsResult,
    recentEventsResult,
    signupsByWeekResult,
  ] = await Promise.all([
    // Total members
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id),
    // Signups last 30 days
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString()),
    // Active users (logged in last 7 days)
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .gte('last_login_at', sevenDaysAgo.toISOString()),
    // Total events
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id),
    // Events this month
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .gte('start_time', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    // Signups by week (last 8 weeks)
    supabase
      .from('members')
      .select('created_at')
      .eq('tenant_id', id)
      .gte('created_at', new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),
  ])

  const totalMembers = totalMembersResult.count || 0
  const recentSignups = recentSignupsResult.count || 0
  const activeUsers = activeUsersResult.count || 0
  const totalEvents = totalEventsResult.count || 0
  const recentEvents = recentEventsResult.count || 0

  // Build weekly signup data
  const weeklySignups: { week: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    const count = (signupsByWeekResult.data || []).filter((m) => {
      const d = new Date(m.created_at)
      return d >= weekStart && d < weekEnd
    }).length
    weeklySignups.push({
      week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    })
  }

  const maxSignup = Math.max(...weeklySignups.map((w) => w.count), 1)

  // Fetch popular events (most RSVPs)
  const { data: events } = await supabase
    .from('events')
    .select('id, title, start_time, event_type')
    .eq('tenant_id', id)
    .gte('start_time', thirtyDaysAgo.toISOString())
    .order('start_time', { ascending: false })
    .limit(10)

  let eventRsvpCounts: Record<string, number> = {}
  if (events && events.length > 0) {
    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .in('event_id', events.map((e) => e.id))
      .eq('status', 'confirmed')

    if (rsvps) {
      eventRsvpCounts = rsvps.reduce((acc: Record<string, number>, row) => {
        acc[row.event_id] = (acc[row.event_id] || 0) + 1
        return acc
      }, {})
    }
  }

  const popularEvents = (events || [])
    .map((e) => ({ ...e, rsvps: eventRsvpCounts[e.id] || 0 }))
    .sort((a, b) => b.rsvps - a.rsvps)
    .slice(0, 5)

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
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-400">{tenant.name}</p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Members</CardTitle>
            <Users className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalMembers}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">New Signups (30d)</CardTitle>
            <TrendingUp className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{recentSignups}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Users (7d)</CardTitle>
            <Activity className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeUsers}</div>
            <p className="text-xs text-slate-500">
              {totalMembers > 0
                ? `${Math.round((activeUsers / totalMembers) * 100)}% of total`
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Events This Month</CardTitle>
            <CalendarDays className="size-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{recentEvents}</div>
            <p className="text-xs text-slate-500">{totalEvents} total events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signups over time (simple bar chart) */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white text-sm">Signups Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {weeklySignups.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500">{week.count}</span>
                  <div
                    className="w-full bg-blue-600 rounded-t"
                    style={{
                      height: `${(week.count / maxSignup) * 100}%`,
                      minHeight: week.count > 0 ? '4px' : '1px',
                    }}
                  />
                  <span className="text-[10px] text-slate-600 truncate w-full text-center">
                    {week.week}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular events */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white text-sm">Popular Events (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {popularEvents.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No events in the last 30 days.</p>
            ) : (
              <div className="space-y-3">
                {popularEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{event.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(event.start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' - '}
                        {event.event_type}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-blue-400">
                      {event.rsvps} RSVPs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
