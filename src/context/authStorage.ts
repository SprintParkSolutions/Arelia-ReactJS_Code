import { dashboardTabs, type DashboardTabId } from '../constants/dashboardTabs'

export const AUTH_STORAGE_KEYS = {
  token: 'clientToken',
  data: 'clientData',
  contactId: 'contactId',
  leadId: 'leadId',
  name: 'name',
  activeTab: 'dashboardActiveTab',
  selectedProjectId: 'dashboardSelectedProjectId',
  loginAt: 'clientLoginAt',
  lastActivityAt: 'clientLastActivityAt',
} as const

export type StoredAuthClient = {
  contactId?: string
  leadId?: string
  name?: string
  email?: string
}

const defaultActiveTab = dashboardTabs[0].id

export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000
export const INACTIVITY_LIMIT_MS = 60 * 60 * 1000

export function getDefaultDashboardTab(): DashboardTabId {
  return defaultActiveTab
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
}

export function readLastActivityAt(): number | null {
  if (typeof window === 'undefined') return null

  const value = Number(window.localStorage.getItem(AUTH_STORAGE_KEYS.lastActivityAt))
  return Number.isFinite(value) && value > 0 ? value : null
}

export function writeLastActivityAt(timestamp = Date.now()): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEYS.lastActivityAt, String(timestamp))
}

// 12 hours after login, the session is force-expired regardless of activity.
// Sessions created before this check existed have no timestamp yet, so the
// first time we see one we just start its clock from now.
export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return false

  const token = window.localStorage.getItem(AUTH_STORAGE_KEYS.token)
  if (!token) return false

  const rawLoginAt = window.localStorage.getItem(AUTH_STORAGE_KEYS.loginAt)
  if (!rawLoginAt) {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.loginAt, String(Date.now()))
    return false
  }

  const loginAt = Number(rawLoginAt)
  const validLoginAt = Number.isFinite(loginAt) && loginAt > 0 ? loginAt : Date.now()
  const storedLastActivityAt = readLastActivityAt()
  const lastActivityAt = storedLastActivityAt ?? validLoginAt

  if (!storedLastActivityAt) {
    writeLastActivityAt(lastActivityAt)
  }

  return (
    Date.now() - validLoginAt >= SESSION_DURATION_MS ||
    Date.now() - lastActivityAt >= INACTIVITY_LIMIT_MS
  )
}

export function readStoredClient(): StoredAuthClient | null {
  if (typeof window === 'undefined') return null

  if (isSessionExpired()) {
    clearStoredAuth()
    return null
  }

  const rawClient = window.localStorage.getItem(AUTH_STORAGE_KEYS.data)
  if (rawClient) {
    try {
      const parsed = JSON.parse(rawClient) as StoredAuthClient
      if (parsed && typeof parsed === 'object') return parsed
    } catch {
      // Ignore malformed stored data and fall back to legacy keys.
    }
  }

  const contactId = window.localStorage.getItem(AUTH_STORAGE_KEYS.contactId) || undefined
  const leadId = window.localStorage.getItem(AUTH_STORAGE_KEYS.leadId) || undefined
  const name = window.localStorage.getItem(AUTH_STORAGE_KEYS.name) || undefined

  if (!contactId && !leadId && !name) return null
  return { contactId, leadId, name }
}

export function readStoredTab(): DashboardTabId {
  if (typeof window === 'undefined') return defaultActiveTab
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEYS.activeTab)
  const matched = dashboardTabs.find((tab) => tab.id === stored)
  return matched?.id ?? defaultActiveTab
}
