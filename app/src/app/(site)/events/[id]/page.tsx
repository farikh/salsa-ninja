import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  class: 'Class',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  studio_social: 'Social',
  community: 'Community Event',
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) {
    notFound()
  }

  const startTime = new Date(event.start_time)
  const endTime = new Date(event.end_time)
  const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const startStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const endStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const tags: string[] = event.tags || []

  const infoItems = [
    { label: 'Date', value: dateStr },
    { label: 'Time', value: `${startStr} – ${endStr}` },
    event.music_genre ? { label: 'Music', value: event.music_genre } : null,
    event.price != null && event.price > 0 ? { label: 'Entry', value: `$${event.price}` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: 'var(--dark)',
          padding: '5rem 0 6rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-15%',
            width: '60%',
            height: '180%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
            <span className="badge">
              <span>{EVENT_TYPE_LABELS[event.event_type] || 'Event'}</span>
            </span>
            <h1 className="heading-xl" style={{ marginTop: '1.5rem', color: 'var(--foreground)' }}>
              {event.title}
            </h1>
            {event.description && (
              <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginTop: '1rem' }}>
                {event.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="section">
        <div className="container">
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              background: 'var(--dark-2)',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'var(--shadow-heavy)',
            }}
          >
            {/* Flyer Image */}
            {event.flyer_url && isSafeUrl(event.flyer_url) && (
              <div style={{ width: '100%', maxHeight: '400px', overflow: 'hidden' }}>
                <img
                  src={event.flyer_url}
                  alt={`${event.title} flyer`}
                  style={{ width: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Event Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                padding: '2rem',
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {event.title}
                </h2>
                <p style={{ opacity: 0.9, fontSize: '1.05rem' }}>
                  {dateStr}
                </p>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '2.5rem' }}>
              {/* Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                {infoItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      background: 'var(--dark-3)',
                      borderRadius: '1rem',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--foreground)', whiteSpace: 'pre-line' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
                        borderRadius: '9999px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Dress Code */}
              {event.dress_code && (
                <div
                  style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-light) 12%, transparent), color-mix(in srgb, var(--primary-light) 6%, transparent))',
                    borderRadius: '1rem',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    border: '1px solid color-mix(in srgb, var(--primary-light) 25%, transparent)',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: '0.5rem', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Dresscode
                  </div>
                  <div className="gradient-text" style={{ fontWeight: 800, fontSize: '1.75rem' }}>
                    {event.dress_code}
                  </div>
                </div>
              )}

              {/* Location */}
              {event.location && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
                    Location
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'pre-line' }}>
                    {event.location}
                  </p>
                </div>
              )}

              {/* Purchase Tickets CTA */}
              {event.purchase_enabled && event.purchase_url && isSafeUrl(event.purchase_url) && (
                <div style={{ textAlign: 'center' }}>
                  <a
                    href={event.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ minWidth: '200px' }}
                  >
                    <span>Purchase Tickets</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <section className="section section-alt">
        <div className="container" style={{ textAlign: 'center' }}>
          <Link href="/events" className="btn btn-outline">
            <span>View All Events</span>
          </Link>
        </div>
      </section>
    </>
  )
}
