import { create } from 'zustand'
import { apiFetch, setToken, getToken } from '@/shared/lib/api/client'

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
  emailVerified: boolean
  emailVerifiedAt: string | null
  blocked?: boolean
  createdAt: string
}

interface AuthState {
  user: AuthUser | null
  status: 'bootstrapping' | 'authenticated' | 'anonymous'
  error: string | null
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (input: {
    email: string
    password: string
    displayName?: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateDisplayName: (displayName: string | null) => Promise<void>
  requestPasswordChange: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'bootstrapping',
  error: null,

  clearError: () => set({ error: null }),

  bootstrap: async () => {
    const token = getToken()
    if (!token) {
      set({ user: null, status: 'anonymous' })
      return
    }
    try {
      const data = await apiFetch<{ user: AuthUser }>('/auth/me')
      set({ user: data.user, status: 'authenticated', error: null })
    } catch {
      setToken(null)
      set({ user: null, status: 'anonymous' })
    }
  },

  login: async (email, password) => {
    set({ error: null })
    try {
      const data = await apiFetch<{ user: AuthUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(data.token)
      set({ user: data.user, status: 'authenticated', error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connexion impossible'
      set({ error: message, status: 'anonymous', user: null })
      throw error
    }
  },

  register: async (input) => {
    set({ error: null })
    try {
      const data = await apiFetch<{ user: AuthUser; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setToken(data.token)
      set({ user: data.user, status: 'authenticated', error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Inscription impossible'
      set({ error: message, status: 'anonymous', user: null })
      throw error
    }
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setToken(null)
    set({ user: null, status: 'anonymous', error: null })
  },

  updateDisplayName: async (displayName) => {
    const data = await apiFetch<{ user: AuthUser }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    })
    set({ user: data.user, error: null })
  },

  requestPasswordChange: async () => {
    await apiFetch<{ ok: true; loggedOut: boolean }>('/auth/change-password/request', {
      method: 'POST',
    })
    setToken(null)
    set({ user: null, status: 'anonymous', error: null })
  },
}))
