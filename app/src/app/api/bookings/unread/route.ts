import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UnreadResponse, UnreadBookingMessage } from '@/types/booking'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the current member's ID
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (memberError || !member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 400 })
  }

  // Get all bookings the user is a participant in (as member or instructor)
  // that have messages newer than the user's last read marker
  const { data: bookings, error: bookingsError } = await supabase
    .from('private_lesson_bookings')
    .select('id')
    .or(`member_id.eq.${member.id},instructor_id.eq.${member.id}`)
    .in('status', ['pending', 'confirmed', 'completed'])

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ unread: [] } satisfies UnreadResponse)
  }

  const bookingIds = bookings.map((b) => b.id)

  // Get the latest message for each booking
  const { data: latestMessages, error: messagesError } = await supabase
    .from('booking_messages')
    .select('booking_id, content, created_at, sender_id, members!inner(display_name)')
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: false })

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  if (!latestMessages || latestMessages.length === 0) {
    return NextResponse.json({ unread: [] } satisfies UnreadResponse)
  }

  // Get read markers for all the user's bookings
  const { data: readMarkers } = await supabase
    .from('booking_message_reads')
    .select('booking_id, last_read_at')
    .eq('member_id', member.id)
    .in('booking_id', bookingIds)

  const readMap = new Map<string, string>()
  readMarkers?.forEach((r) => {
    readMap.set(r.booking_id, r.last_read_at)
  })

  // Group messages by booking and find the latest per booking
  const latestPerBooking = new Map<string, (typeof latestMessages)[number]>()
  for (const msg of latestMessages) {
    if (!latestPerBooking.has(msg.booking_id)) {
      latestPerBooking.set(msg.booking_id, msg)
    }
  }

  // Filter to only unread messages (not sent by the current user)
  const unread: UnreadBookingMessage[] = []
  for (const [bookingId, msg] of latestPerBooking) {
    // Skip messages sent by the current user
    if (msg.sender_id === member.id) continue

    const lastReadAt = readMap.get(bookingId)
    if (!lastReadAt || msg.created_at > lastReadAt) {
      const senderData = msg.members as unknown as { display_name: string }
      unread.push({
        booking_id: bookingId,
        latest_message: msg.content,
        latest_message_at: msg.created_at,
        sender_name: senderData?.display_name ?? 'Unknown',
      })
    }
  }

  return NextResponse.json({ unread } satisfies UnreadResponse)
}
