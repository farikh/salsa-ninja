'use client'

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'Available' },
  { color: 'var(--primary-light)', label: 'Pending' },
  { color: '#3b82f6', label: 'Confirmed' },
  { color: 'var(--primary)', label: 'Unavailable' },
]

interface CalendarLegendProps {
  items?: typeof LEGEND_ITEMS
}

export function CalendarLegend({ items = LEGEND_ITEMS }: CalendarLegendProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        fontSize: '0.8rem',
        color: 'var(--muted-foreground)',
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: item.color,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {item.label}
        </div>
      ))}
    </div>
  )
}
