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

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, event_type, start_time, end_time, location, music_genre, price, tags, dress_code, flyer_url, purchase_enabled, purchase_url')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(20)

  const featured = events?.[0] ?? null
  const additional = events?.slice(1) ?? []

  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: '#111111',
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
            background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
            <span className="badge"><span>Upcoming Events</span></span>
            <h1 className="heading-xl" style={{ marginTop: '1.5rem', color: '#ffffff' }}>
              Special <span className="gradient-text">Events</span>
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginTop: '1rem' }}>
              Join us for socials, workshops, and special dance events!
            </p>
          </div>
        </div>
      </section>

      {/* Featured Event */}
      {featured ? (
        <section className="section diagonal-stripes">
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
              {featured.flyer_url && isSafeUrl(featured.flyer_url) && (
                <div style={{ width: '100%', maxHeight: '400px', overflow: 'hidden' }}>
                  <img
                    src={featured.flyer_url}
                    alt={`${featured.title} flyer`}
                    style={{ width: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Event Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                  padding: '2.5rem 2rem',
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
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'rgba(255,255,255,0.2)',
                      padding: '0.375rem 1.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '1rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {EVENT_TYPE_LABELS[featured.event_type] || 'Event'}
                  </span>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {featured.title}
                  </h2>
                  <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                    {new Date(featured.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div style={{ padding: '2.5rem' }}>
                {featured.description && (
                  <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-light)', marginBottom: '2rem' }}>
                    {featured.description}
                  </p>
                )}

                {/* Info Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                  }}
                >
                  {[
                    { label: 'Date', value: new Date(featured.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) },
                    { label: 'Time', value: `${new Date(featured.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${new Date(featured.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` },
                    featured.music_genre ? { label: 'Music', value: featured.music_genre } : null,
                    featured.price != null && featured.price > 0 ? { label: 'Entry', value: `$${featured.price}` } : null,
                  ].filter(Boolean).map((item, idx) => (
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
                        {item!.label}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#ffffff', whiteSpace: 'pre-line' }}>
                        {item!.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {(featured.tags as string[] | null)?.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
                    {(featured.tags as string[]).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '0.5rem 1.25rem',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: '9999px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Dress Code */}
                {featured.dress_code && (
                  <div
                    style={{
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
                      borderRadius: '1rem',
                      marginBottom: '2rem',
                      textAlign: 'center',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.5rem', letterSpacing: '0.08em', fontWeight: 600 }}>
                      Dresscode
                    </div>
                    <div className="gradient-text" style={{ fontWeight: 800, fontSize: '1.75rem' }}>
                      {featured.dress_code}
                    </div>
                  </div>
                )}

                {/* Location */}
                {featured.location && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
                      Location
                    </div>
                    <p style={{ fontWeight: 600, color: '#ffffff', whiteSpace: 'pre-line' }}>
                      {featured.location}
                    </p>
                  </div>
                )}

                {/* CTA row */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {featured.purchase_enabled && featured.purchase_url && isSafeUrl(featured.purchase_url) && (
                    <a
                      href={featured.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ minWidth: '200px' }}
                    >
                      <span>Purchase Tickets</span>
                    </a>
                  )}
                  <Link href={`/events/${featured.id}`} className="btn btn-outline">
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="container" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
              No upcoming events right now — check back soon!
            </p>
          </div>
        </section>
      )}

      {/* Additional Events */}
      {additional.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: '2rem', color: '#ffffff' }}>
              More <span className="gradient-text">Upcoming Events</span>
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
                maxWidth: '1000px',
                margin: '0 auto',
              }}
            >
              {additional.map((ev) => {
                const startTime = new Date(ev.start_time)
                const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    style={{
                      display: 'block',
                      background: 'var(--dark-2)',
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.06)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 0.2s, transform 0.2s',
                    }}
                  >
                    {ev.flyer_url && isSafeUrl(ev.flyer_url) && (
                      <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                        <img
                          src={ev.flyer_url}
                          alt={`${ev.title} flyer`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>
                          {ev.title}
                        </h3>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {EVENT_TYPE_LABELS[ev.event_type] || 'Event'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        {dateStr} &middot; {timeStr}
                      </p>
                      {ev.location && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                          {ev.location}
                        </p>
                      )}
                      {ev.price != null && ev.price > 0 && (
                        <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                          ${ev.price}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Stay Updated */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="heading-md" style={{ marginBottom: '1rem', color: '#ffffff' }}>
              Don&apos;t <span className="gradient-text">Miss Out!</span>
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
              Follow us on social media to stay updated on upcoming events, socials, and
              special workshops.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://instagram.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <span>Follow on Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/salsaninjadanceacademy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <span>Follow on Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
