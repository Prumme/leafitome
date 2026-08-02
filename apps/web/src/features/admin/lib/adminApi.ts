import { ApiError } from '@/shared/lib/api/client'

const ADMIN_TOKEN_KEY = 'leafitome_admin_token'

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAdminToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
    else localStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch {
    // ignore
  }
}

export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getAdminToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`/api/admin${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    let message = 'Erreur admin'
    try {
      const data = (await response.json()) as { error?: string }
      message = data.error ?? message
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export interface AdminUserRow {
  id: string
  email: string
  displayName: string | null
  createdAt: string
  todoCount: number
}

export interface AdminTodoRow {
  id: string
  name: string
  description?: string
  recurrence: string
  priority: string
  enabled: boolean
  archived: boolean
  shared: boolean
  memberCount: number
  createdAt: string
  updatedAt: string
}
