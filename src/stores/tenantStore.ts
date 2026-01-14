import { create } from 'zustand'
import type { TenantResponse } from '@/types/tenant'

interface TenantStore {
  currentTenantId: string | null
  currentTenant: TenantResponse | null
  setCurrentTenant: (tenant: TenantResponse | null) => void
  clearCurrentTenant: () => void
}

export const useTenantStore = create<TenantStore>((set) => ({
  currentTenantId: null,
  currentTenant: null,
  setCurrentTenant: (tenant) =>
    set({
      currentTenantId: tenant?.id || null,
      currentTenant: tenant,
    }),
  clearCurrentTenant: () =>
    set({
      currentTenantId: null,
      currentTenant: null,
    }),
}))
