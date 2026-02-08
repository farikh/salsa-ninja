import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConversationsList } from './ConversationsList'

export default async function ConversationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('member_profiles')
    .select('id, all_roles, role_name')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    redirect('/join/profile')
  }

  // Fetch all bookings the user is part of that could have messages
  const { data: bookings } = await supabase
    .from('private_lesson_bookings')
    .select('*')
    .or(`member_id.eq.${member.id},instructor_id.eq.${member.id}`)
    .in('status', ['pending', 'confirmed', 'completed'])
    .order('start_time', { ascending: false })
    .limit(50)

  // Fetch participant profiles for display — only those involved in user's bookings
  const participantIds = new Set<string>()
  bookings?.forEach(b => {
    participantIds.add(b.instructor_id)
    participantIds.add(b.member_id)
  })

  let participants: Record<string, { display_name: string; full_name: string }> = {}
  let instructors: { id: string; display_name: string; full_name: string; avatar_url: string | null }[] = []

  if (participantIds.size > 0) {
    const { data: profiles } = await supabase
      .from('member_profiles')
      .select('id, display_name, full_name, avatar_url, all_roles, role_name')
      .in('id', Array.from(participantIds))

    profiles?.forEach(p => {
      participants[p.id] = { display_name: p.display_name, full_name: p.full_name }
    })

    // Build instructor list from participants who have instructor/owner roles
    const instructorIds = new Set(bookings?.map(b => b.instructor_id) ?? [])
    instructors = (profiles ?? [])
      .filter(p => instructorIds.has(p.id))
      .map(p => ({
        id: p.id,
        display_name: p.display_name,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      }))
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '700px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">Conversations</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
            Message threads from your private lesson bookings
          </p>
        </div>

        <ConversationsList
          bookings={bookings ?? []}
          participants={participants}
          currentMemberId={member.id}
          instructors={instructors}
        />
      </div>
    </section>
  )
}
