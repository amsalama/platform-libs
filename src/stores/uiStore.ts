import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export interface ConfirmDialog {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void | Promise<void>
  variant?: 'destructive' | 'default'
}

interface UIState {
  // Modals
  confirmDialog: ConfirmDialog | null

  // Toasts
  toasts: Toast[]

  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>

  // Sidebar
  sidebarCollapsed: boolean
}

interface UIActions {
  // Modals
  setConfirmDialog: (dialog: ConfirmDialog | null) => void
  clearConfirmDialog: () => void

  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Loading
  setGlobalLoading: (loading: boolean) => void
  setLoading: (key: string, loading: boolean) => void

  // Sidebar
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  confirmDialog: null,
  toasts: [],
  globalLoading: false,
  loadingStates: {},

  sidebarCollapsed: false,

  setConfirmDialog: (dialog) => set({ confirmDialog: dialog }),
  clearConfirmDialog: () => set({ confirmDialog: null }),

  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
  })),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),

  clearToasts: () => set({ toasts: [] }),

  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  setLoading: (key, loading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading },
  })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
