'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Tenant, ThemeConfig } from './types'

interface TenantContextValue {
  tenant: Tenant | null
  theme: ThemeConfig | null
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  theme: null,
})

export function TenantProvider({
  tenant,
  theme,
  children,
}: {
  tenant: Tenant | null
  theme: ThemeConfig | null
  children: ReactNode
}) {
  return (
    <TenantContext.Provider value={{ tenant, theme }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  return useContext(TenantContext)
}
