import { createClient } from '@/lib/supabase/server'

interface ThemeRow {
  id: string
  name: string
  description: string | null
  config: {
    colors: Record<string, string>
    fonts?: { heading: string; body: string }
    radius?: string
    style?: Record<string, string>
  }
  is_default: boolean
}

export const metadata = {
  title: 'Themes | Dance Studio Platform',
  description: 'Browse all available themes for your dance studio.',
}

export default async function ThemesPage() {
  const supabase = await createClient()

  const { data: themes, error } = await supabase
    .from('themes')
    .select('id, name, description, config, is_default')
    .order('name')

  const themeList = (themes ?? []) as ThemeRow[]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: "'Segoe UI', -apple-system, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Header */}
      <section
        style={{
          padding: '4rem 1.5rem 2rem',
          textAlign: 'center',
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
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <span className="badge">
            <span>Themes</span>
          </span>
          <h1
            className="heading-xl"
            style={{ marginTop: '1.5rem', color: 'var(--foreground)' }}
          >
            Studio <span className="gradient-text">Themes</span>
          </h1>
          <p style={{ color: 'var(--text-light)', marginTop: '1rem', fontSize: '1.1rem' }}>
            Each studio gets its own unique look. Browse the built-in themes below.
          </p>
        </div>
      </section>

      {/* Theme Grid */}
      <section style={{ padding: '0 1.5rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <p style={{ color: 'var(--destructive)', textAlign: 'center', marginBottom: '2rem' }}>
            Failed to load themes. Please try again later.
          </p>
        )}

        {themeList.length === 0 && !error && (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>
            No themes available yet.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '1.5rem',
          }}
          className="themes-grid"
        >
          {themeList.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (min-width: 640px) {
              .themes-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
            @media (min-width: 1024px) {
              .themes-grid { grid-template-columns: repeat(3, 1fr) !important; }
            }
          `,
        }}
      />
    </div>
  )
}

function ThemeCard({ theme }: { theme: ThemeRow }) {
  const { config } = theme
  const colors = config.colors ?? {}

  const primary = colors.primary ?? '#888'
  const primaryLight = colors['primary-light'] ?? colors.primary ?? '#aaa'
  const background = colors.background ?? '#0f0f0f'
  const card = colors.card ?? '#1a1a1a'
  const foreground = colors.foreground ?? '#fff'
  const muted = colors.muted ?? '#2a2a2a'
  const accent = colors.accent ?? '#222'

  const fontHeading = config.fonts?.heading ?? 'System'
  const fontBody = config.fonts?.body ?? 'System'
  const radius = config.radius ?? '0.625rem'

  return (
    <div
      style={{
        background: card,
        borderRadius: radius,
        border: `1px solid ${accent}`,
        overflow: 'hidden',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Mini preview header */}
      <div
        style={{
          height: '8px',
          background: `linear-gradient(90deg, ${primary}, ${primaryLight})`,
        }}
      />

      {/* Preview area */}
      <div
        style={{
          padding: '1.25rem',
          background: background,
          borderBottom: `1px solid ${accent}`,
        }}
      >
        {/* Mini nav bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '3px',
                height: '12px',
                background: `linear-gradient(to bottom, ${primary}, ${primaryLight})`,
                borderRadius: '1px',
              }}
            />
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: foreground,
                fontFamily: `'${fontHeading}', sans-serif`,
              }}
            >
              Studio
              <span
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${primaryLight})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Name
              </span>
            </span>
          </div>
          <div
            style={{
              padding: '2px 10px',
              borderRadius: '4px',
              background: `linear-gradient(135deg, ${primary}, ${primaryLight})`,
              fontSize: '0.55rem',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            Login
          </div>
        </div>

        {/* Mini content blocks */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div
            style={{
              flex: 1,
              height: '32px',
              borderRadius: '4px',
              background: card,
              border: `1px solid ${accent}`,
            }}
          />
          <div
            style={{
              flex: 1,
              height: '32px',
              borderRadius: '4px',
              background: muted,
              border: `1px solid ${accent}`,
            }}
          />
        </div>
      </div>

      {/* Theme info */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h3
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: foreground,
              margin: 0,
              fontFamily: `'${fontHeading}', sans-serif`,
            }}
          >
            {theme.name}
          </h3>
          {theme.is_default && (
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '9999px',
                background: `linear-gradient(135deg, ${primary}, ${primaryLight})`,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Default
            </span>
          )}
        </div>

        {theme.description && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 0.75rem',
              lineHeight: 1.5,
              fontFamily: `'${fontBody}', sans-serif`,
            }}
          >
            {theme.description}
          </p>
        )}

        {/* Color swatches */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Primary', value: primary },
            { label: 'Secondary', value: primaryLight },
            { label: 'BG', value: background },
            { label: 'Card', value: card },
            { label: 'Accent', value: accent },
            { label: 'Muted', value: muted },
          ].map((swatch) => (
            <div
              key={swatch.label}
              title={`${swatch.label}: ${swatch.value}`}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: swatch.value,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        {/* Font info */}
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
          <span style={{ fontWeight: 600 }}>Fonts:</span> {fontHeading}
          {fontBody !== fontHeading ? ` / ${fontBody}` : ''}
        </div>
      </div>
    </div>
  )
}
