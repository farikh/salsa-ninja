'use client'

import type { ThemeConfig } from '@/lib/tenant/types'

export function ThemeStyleInjector({ config }: { config: ThemeConfig | null }) {
  if (!config) return null

  const cssVars = Object.entries(config.colors)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n  ')

  const fontVars = config.fonts
    ? `--font-heading: '${config.fonts.heading}', sans-serif;\n  --font-body: '${config.fonts.body}', sans-serif;`
    : ''

  const radiusVar = config.radius ? `--radius: ${config.radius};` : ''

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {\n  ${cssVars}\n  ${fontVars}\n  ${radiusVar}\n}`,
      }}
    />
  )
}
