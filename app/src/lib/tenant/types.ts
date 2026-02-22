export interface Tenant {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  theme_id: string | null
  status: string
  settings: Record<string, unknown>
}

export interface ThemeConfig {
  colors: Record<string, string>
  fonts: { heading: string; body: string }
  radius: string
  style: Record<string, string>
  custom?: Record<string, string>
}
