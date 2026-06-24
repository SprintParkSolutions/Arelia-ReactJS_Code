import { dashboardTabs, type DashboardTabId } from '../constants/dashboardTabs'

export const AUTH_STORAGE_KEYS = {
  token: 'clientToken',
  data: 'clientData',
  contactId: 'contactId',
  leadId: 'leadId',
  name: 'name',
  activeTab: 'dashboardActiveTab',
} as const

export type StoredAuthClient = {
  contactId?: string
  leadId?: string
  name?: string
  email?: string
}

const defaultActiveTab = dashboardTabs[0].id

export function getDefaultDashboardTab(): DashboardTabId {
  return defaultActiveTab
}

export function readStoredClient(): StoredAuthClient | null {
  if (typeof window === 'undefined') return null

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
