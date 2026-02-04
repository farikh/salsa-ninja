import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron via CRON_SECRET
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // Expire pending bookings older than 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('private_lesson_bookings')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'pending')
    .lt('created_at', fourHoursAgo)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message, expired: 0 }, { status: 500 })
  }

  return NextResponse.json({ expired: data?.length ?? 0 })
}
