import { create } from 'zustand'
import type { User } from '@/types/auth'
import { login as apiLogin, register, refreshAccessToken, logout, getCurrentUser } from '@/services/api/auth'
import type { UserProfileResponse, TokenResponse } from '@/services/api/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean

  accessToken: string | null
  refreshToken: string | null
  tokenExpiry: number | null
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  register: (email: string, username: string, first_name: string, last_name: string, password: string) => Promise<import('@/services/api/auth').RegisterResponse>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>

  setSessionFromProfile: (profile: UserProfileResponse) => void

  clearTokens: () => void
  initializeFromStorage: () => void

  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasAdminAccess: () => boolean
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,

  initializeFromStorage: () => {
    const { isInitialized } = get()
    if (isInitialized) return

    const accessToken = sessionStorage.getItem('craftcrew_access_token')
    const refreshToken = sessionStorage.getItem('craftcrew_refresh_token')
    const userStr = sessionStorage.getItem('craftcrew_user')
    const tokenExpiryStr = sessionStorage.getItem('token_expiry')

    const tokenExpiry = tokenExpiryStr ? Number(tokenExpiryStr) : null

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        const isAuthenticated = tokenExpiry === null || tokenExpiry > Date.now()

        set({
          accessToken,
          refreshToken,
          tokenExpiry,
          user,
          isAuthenticated,
          isInitialized: true,
        })
      } catch (error) {
        console.error('[AuthStore] Failed to parse user from storage', error)
        set({ isInitialized: true })
      }
    } else {
      set({ isInitialized: true })
    }
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true })

    try {
      const tokenResponse = await apiLogin({ username, password })

      const expiresAt = tokenResponse.expires_in ? Date.now() + tokenResponse.expires_in * 1000 : null

      const user: User = {
        principal_id: tokenResponse.principal_id,
        email: tokenResponse.email,
        email_verified: tokenResponse.email_verified,
        name: tokenResponse.name,
        given_name: tokenResponse.given_name,
        family_name: tokenResponse.family_name,
        preferred_username: tokenResponse.preferred_username,
        tenant_id: tokenResponse.tenant_id,
        roles: tokenResponse.roles,
        permissions: tokenResponse.permissions,
        authenticated_at: tokenResponse.authenticated_at,
      }

      sessionStorage.setItem('craftcrew_access_token', tokenResponse.access_token || '')
      if (tokenResponse.refresh_token) {
        sessionStorage.setItem('craftcrew_refresh_token', tokenResponse.refresh_token)
      }
      sessionStorage.setItem('craftcrew_user', JSON.stringify(user))
      if (expiresAt) {
        sessionStorage.setItem('token_expiry', expiresAt.toString())
      }

      set({
        accessToken: tokenResponse.access_token || null,
        refreshToken: tokenResponse.refresh_token || null,
        tokenExpiry: expiresAt,
        user,
        isAuthenticated: true,
        isInitialized: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  setSessionFromProfile: (profile: UserProfileResponse) => {
    const expiresAt = profile.expires_in ? Date.now() + profile.expires_in * 1000 : null

    const user: User = {
      principal_id: profile.principal_id,
      email: profile.email || '',
      email_verified: profile.email_verified || false,
      name: profile.name || '',
      given_name: profile.given_name || '',
      family_name: profile.family_name || '',
      preferred_username: profile.preferred_username || '',
      tenant_id: profile.tenant_id || null,
      roles: profile.roles || [],
      permissions: profile.permissions || [],
      authenticated_at: profile.authenticated_at,
    }

    if (profile.access_token) {
      sessionStorage.setItem('craftcrew_access_token', profile.access_token)
    }
    if (profile.refresh_token) {
      sessionStorage.setItem('craftcrew_refresh_token', profile.refresh_token)
    }
    sessionStorage.setItem('craftcrew_user', JSON.stringify(user))
    if (expiresAt) {
      sessionStorage.setItem('token_expiry', expiresAt.toString())
    }

    set({
      accessToken: profile.access_token || null,
      refreshToken: profile.refresh_token || null,
      tokenExpiry: expiresAt,
      user,
      isAuthenticated: true,
      isInitialized: true,
    })
  },

  register: async (email: string, username: string, first_name: string, last_name: string, password: string) => {
    set({ isLoading: true })

    try {
      const registerResponse = await register({ email, username, password, first_name, last_name })

      set({ isLoading: false })
      return registerResponse
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })

    try {
      const { refreshToken } = get()

      if (refreshToken) {
        await logout(refreshToken)
      }
    } catch (error) {
      console.warn('[AuthStore] Backend logout failed, continuing with local cleanup', error)
    } finally {
      sessionStorage.removeItem('craftcrew_access_token')
      sessionStorage.removeItem('craftcrew_refresh_token')
      sessionStorage.removeItem('craftcrew_user')
      sessionStorage.removeItem('token_expiry')

      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        isLoading: false,
      })
    }
  },

  refreshSession: async () => {
    const { refreshToken, user: currentUser } = get()

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    set({ isLoading: true })

    try {
      // Step 1: Refresh the tokens
      const tokenResponse: TokenResponse = await refreshAccessToken({
        refresh_token: refreshToken,
      })

      const expiresAt = tokenResponse.expires_in ? Date.now() + tokenResponse.expires_in * 1000 : null

      // Update tokens in storage immediately
      sessionStorage.setItem('craftcrew_access_token', tokenResponse.access_token || '')
      if (tokenResponse.refresh_token) {
        sessionStorage.setItem('craftcrew_refresh_token', tokenResponse.refresh_token)
      }
      if (expiresAt) {
        sessionStorage.setItem('token_expiry', expiresAt.toString())
      }

      // Update token state
      set({
        accessToken: tokenResponse.access_token || null,
        refreshToken: tokenResponse.refresh_token || refreshToken,
        tokenExpiry: expiresAt,
      })

      // Step 2: Fetch updated user profile (optional - use cached if fails)
      try {
        const userProfile = await getCurrentUser()
        
        const user: User = {
          principal_id: userProfile.principal_id,
          email: userProfile.email || '',
          email_verified: userProfile.email_verified || false,
          name: userProfile.name || '',
          given_name: userProfile.given_name || '',
          family_name: userProfile.family_name || '',
          preferred_username: userProfile.preferred_username || '',
          tenant_id: userProfile.tenant_id || null,
          roles: userProfile.roles || [],
          permissions: userProfile.permissions || [],
          authenticated_at: userProfile.authenticated_at,
        }

        sessionStorage.setItem('craftcrew_user', JSON.stringify(user))
        set({ user })
      } catch {
        // If /me fails, keep the current user data
        console.warn('[AuthStore] Failed to refresh user profile, using cached data')
        if (currentUser) {
          set({ user: currentUser })
        }
      }
    } catch (error) {
      await get().logout()
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  clearTokens: () => {
    sessionStorage.removeItem('craftcrew_access_token')
    sessionStorage.removeItem('craftcrew_refresh_token')
    sessionStorage.removeItem('craftcrew_user')
    sessionStorage.removeItem('token_expiry')

    set({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
    })
  },

  hasRole: (role: string) => {
    const { user } = get()

    if (!user) {
      return false
    }
    return user.roles.includes(role)
  },

  hasAnyRole: (roles: string[]) => {
    const { user } = get()

    if (!user) {
      return false
    }
    return roles.some(role => user.roles.includes(role))
  },

  hasAdminAccess: () => {
    const { user } = get()

    if (!user) {
      return false
    }
    return user.roles.some(role =>
      ['super_admin', 'admin', 'administrator'].includes(role.toLowerCase())
    )
  },
}))
