'use client'

import type { ThemeConfig } from '@/lib/tenant/types'

/** Sanitize a CSS color value: allow alphanumeric, spaces, #, %, (, ), commas, periods, hyphens */
function sanitizeColor(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s#%(),.\-]/g, '')
}

/** Sanitize a font name: allow alphanumeric, spaces, and hyphens */
function sanitizeFont(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s\-]/g, '')
}

/** Sanitize a radius value: allow digits, periods, and CSS units (rem, px, em) */
function sanitizeRadius(value: string): string {
  return value.replace(/[^a-zA-Z0-9.\s]/g, '')
}

/**
 * Detect HSL space-separated values like "0 84% 60%" and wrap in hsl().
 * If the value already contains hsl( or is a hex/keyword, return as-is.
 */
function wrapHslIfNeeded(value: string): string {
  const trimmed = value.trim()
  // Already wrapped
  if (trimmed.startsWith('hsl(') || trimmed.startsWith('hsla(')) {
    return trimmed
  }
  // Hex values or CSS keywords -- return as-is
  if (trimmed.startsWith('#') || trimmed.startsWith('rgb')) {
    return trimmed
  }
  // Match HSL space-separated pattern: "H S% L%" with optional alpha
  if (/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%/.test(trimmed)) {
    return `hsl(${trimmed})`
  }
  return trimmed
}

export function ThemeStyleInjector({ config }: { config: ThemeConfig | null }) {
  if (!config) return null

  const cssVars = Object.entries(config.colors)
    .map(([key, value]) => {
      const sanitized = sanitizeColor(value)
      const wrapped = wrapHslIfNeeded(sanitized)
      return `--${sanitizeColor(key)}: ${wrapped};`
    })
    .join('\n  ')

  const fontVars = config.fonts
    ? `--font-heading: '${sanitizeFont(config.fonts.heading)}', sans-serif;\n  --font-body: '${sanitizeFont(config.fonts.body)}', sans-serif;`
    : ''

  const radiusVar = config.radius ? `--radius: ${sanitizeRadius(config.radius)};` : ''

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {\n  ${cssVars}\n  ${fontVars}\n  ${radiusVar}\n}`,
      }}
    />
  )
}
