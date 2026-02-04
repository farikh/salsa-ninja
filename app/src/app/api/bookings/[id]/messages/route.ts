import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { BookingMessage, MessagesResponse } from '@/types/booking'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch messages (RLS ensures only booking participants or staff can read)
  const { data: messages, error: messagesError } = await supabase
    .from('booking_messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  // Get the current member's ID for read tracking
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let hasUnread = false

  if (member) {
    // Check if there are unread messages
    const { data: readMarker } = await supabase
      .from('booking_message_reads')
      .select('last_read_at')
      .eq('booking_id', bookingId)
      .eq('member_id', member.id)
      .single()

    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      hasUnread = !readMarker || lastMessage.created_at > readMarker.last_read_at
    }

    // Upsert read marker to mark all messages as read
    await supabase
      .from('booking_message_reads')
      .upsert(
        {
          booking_id: bookingId,
          member_id: member.id,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'booking_id,member_id' }
      )
  }

  return NextResponse.json({
    messages: (messages ?? []) as BookingMessage[],
    hasUnread,
  } satisfies MessagesResponse)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { content: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json(
      { error: 'Missing required field: content' },
      { status: 400 }
    )
  }

  if (body.content.length > 2000) {
    return NextResponse.json(
      { error: 'Message content must be 2000 characters or less' },
      { status: 400 }
    )
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

  // RLS ensures only booking participants can insert messages
  const { data, error } = await supabase
    .from('booking_messages')
    .insert({
      booking_id: bookingId,
      sender_id: member.id,
      content: body.content,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Not authorized to send messages on this booking' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data as BookingMessage }, { status: 201 })
}
