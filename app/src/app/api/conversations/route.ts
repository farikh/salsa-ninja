import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 400 })
  }

  // Get all bookings user is part of
  const { data: bookings, error: bookingsError } = await supabase
    .from('private_lesson_bookings')
    .select('id, instructor_id, member_id, start_time, end_time, status, notes')
    .or(`member_id.eq.${member.id},instructor_id.eq.${member.id}`)
    .in('status', ['pending', 'confirmed', 'completed'])
    .order('start_time', { ascending: false })
    .limit(50)

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ conversations: [], participants: {} })
  }

  const bookingIds = bookings.map(b => b.id)

  // Get latest message per booking + message count
  const { data: allMessages } = await supabase
    .from('booking_messages')
    .select('booking_id, content, created_at, sender_id, members!inner(display_name)')
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: false })

  // Get read markers
  const { data: readMarkers } = await supabase
    .from('booking_message_reads')
    .select('booking_id, last_read_at')
    .eq('member_id', member.id)
    .in('booking_id', bookingIds)

  const readMap = new Map<string, string>()
  readMarkers?.forEach(r => readMap.set(r.booking_id, r.last_read_at))

  // Build latest message + count per booking
  const latestPerBooking = new Map<string, { content: string; created_at: string; sender_name: string; sender_id: string }>()
  const messageCountPerBooking = new Map<string, number>()

  for (const msg of allMessages ?? []) {
    messageCountPerBooking.set(msg.booking_id, (messageCountPerBooking.get(msg.booking_id) ?? 0) + 1)
    if (!latestPerBooking.has(msg.booking_id)) {
      const senderData = msg.members as unknown as { display_name: string }
      latestPerBooking.set(msg.booking_id, {
        content: msg.content,
        created_at: msg.created_at,
        sender_name: senderData?.display_name ?? 'Unknown',
        sender_id: msg.sender_id,
      })
    }
  }

  // Gather participant IDs
  const participantIds = new Set<string>()
  bookings.forEach(b => {
    participantIds.add(b.instructor_id)
    participantIds.add(b.member_id)
  })

  // Fetch participant profiles
  const { data: profiles } = await supabase
    .from('member_profiles')
    .select('id, display_name, full_name, avatar_url')
    .in('id', Array.from(participantIds))

  const participants: Record<string, { display_name: string; full_name: string; avatar_url: string | null }> = {}
  profiles?.forEach(p => {
    participants[p.id] = { display_name: p.display_name, full_name: p.full_name, avatar_url: p.avatar_url }
  })

  // Build conversation objects
  const conversations = bookings.map(b => {
    const latest = latestPerBooking.get(b.id)
    const lastReadAt = readMap.get(b.id)
    const hasUnread = latest
      ? latest.sender_id !== member.id && (!lastReadAt || latest.created_at > lastReadAt)
      : false

    return {
      booking_id: b.id,
      instructor_id: b.instructor_id,
      member_id: b.member_id,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      notes: b.notes,
      message_count: messageCountPerBooking.get(b.id) ?? 0,
      latest_message: latest?.content ?? null,
      latest_message_at: latest?.created_at ?? null,
      latest_sender_name: latest?.sender_name ?? null,
      has_unread: hasUnread,
    }
  })

  // Sort: unread first, then by latest message time (most recent first), then by booking start_time
  conversations.sort((a, b) => {
    if (a.has_unread !== b.has_unread) return a.has_unread ? -1 : 1
    const aTime = a.latest_message_at ?? a.start_time
    const bTime = b.latest_message_at ?? b.start_time
    return bTime.localeCompare(aTime)
  })

  return NextResponse.json({ conversations, participants, currentMemberId: member.id })
}
