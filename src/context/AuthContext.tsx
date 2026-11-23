/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { requestProjectDetails } from '../services/projectDetailsApi'
import type { DashboardTabId } from '../constants/dashboardTabs'
import {
  AUTH_STORAGE_KEYS,
  clearStoredAuth,
  getDefaultDashboardTab,
  isSessionExpired,
  readStoredClient,
  readStoredTab,
  type StoredAuthClient,
} from './authStorage'

const SESSION_EXPIRY_CHECK_INTERVAL_MS = 60_000

type AuthClient = StoredAuthClient

type AuthContextValue = {
  isAuthenticated: boolean
  client: AuthClient | null
  activeDashboardTab: DashboardTabId
  login: (client: AuthClient) => void
  logout: () => void
  setActiveDashboardTab: (tab: DashboardTabId) => void
}

const defaultActiveTab = getDefaultDashboardTab()

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [client, setClient] = useState<AuthClient | null>(() => readStoredClient())
  const [activeDashboardTab, setActiveDashboardTabState] = useState<DashboardTabId>(() =>
    readStoredTab(),
  )

  const isAuthenticated = Boolean(client?.contactId || client?.leadId)

  useEffect(() => {
    const syncFromStorage = () => {
      setClient(readStoredClient())
      setActiveDashboardTabState(readStoredTab())
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener('client-auth-change', syncFromStorage as EventListener)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener('client-auth-change', syncFromStorage as EventListener)
    }
  }, [])

  // Covers the case where a tab is left open for the full 12 hours without
  // a refresh or storage event ever firing to re-check the session.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isSessionExpired()) return

      clearStoredAuth()
      setClient(null)
      setActiveDashboardTabState(defaultActiveTab)
      window.dispatchEvent(new Event('client-auth-change'))
    }, SESSION_EXPIRY_CHECK_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [])

  // Resolve conversion without restarting the session or changing navigation.
  useEffect(() => {
    if (!client?.leadId || client.contactId) return
    const leadId = client.leadId
    const sessionStartedAt = window.localStorage.getItem(AUTH_STORAGE_KEYS.loginAt)
    let active = true
    let pending = false

    const refreshIdentity = async () => {
      if (!active || pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const result = await requestProjectDetails(leadId)
        if (!active || !result.success || !result.isConverted || !result.convertedContactId) return
        const current = readStoredClient()
        // Ignore responses from a session that logged out, expired, or changed.
        if (!current || current.leadId !== leadId || current.contactId ||
          window.localStorage.getItem(AUTH_STORAGE_KEYS.loginAt) !== sessionStartedAt) return
        const next = { ...current, contactId: result.convertedContactId }
        window.localStorage.setItem(AUTH_STORAGE_KEYS.data, JSON.stringify(next))
        window.localStorage.setItem(AUTH_STORAGE_KEYS.contactId, next.contactId)
        window.localStorage.setItem(AUTH_STORAGE_KEYS.token, next.contactId)
        active = false
        setClient(next)
        window.dispatchEvent(new Event('client-auth-change'))
      } catch {
        // Keep the existing session usable and retry on the next check.
      } finally {
        pending = false
      }
    }

    const refresh = () => { void refreshIdentity() }
    refresh()
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [client])

  const login = (nextClient: AuthClient) => {
    const normalizedClient = {
      contactId: nextClient.contactId || undefined,
      leadId: nextClient.leadId || undefined,
      name: nextClient.name || undefined,
      email: nextClient.email || undefined,
      phone: nextClient.phone || undefined,
    }

    // contactId/leadId are the identifiers every downstream API call relies
    // on - without one of them there is nothing to authenticate against, so
    // refuse to fabricate a session rather than falling back to a fixed
    // 'authenticated' token that would mark the user as logged in anyway.
    if (!normalizedClient.contactId && !normalizedClient.leadId) {
      console.error('login() called without a contactId or leadId; refusing to start a session.')
      return
    }

    const token = normalizedClient.contactId || normalizedClient.leadId || ''

    window.localStorage.setItem(AUTH_STORAGE_KEYS.token, token)
    window.localStorage.setItem(AUTH_STORAGE_KEYS.data, JSON.stringify(normalizedClient))
    window.localStorage.setItem(AUTH_STORAGE_KEYS.contactId, normalizedClient.contactId || '')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.leadId, normalizedClient.leadId || '')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.name, normalizedClient.name || '')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.activeTab, defaultActiveTab)
    window.localStorage.setItem(AUTH_STORAGE_KEYS.loginAt, String(Date.now()))
    window.localStorage.setItem(AUTH_STORAGE_KEYS.lastActivityAt, String(Date.now()))

    setClient(normalizedClient)
    setActiveDashboardTabState(defaultActiveTab)
    window.dispatchEvent(new Event('client-auth-change'))
  }

  const logout = useCallback(() => {
    clearStoredAuth()

    setClient(null)
    setActiveDashboardTabState(defaultActiveTab)
    window.dispatchEvent(new Event('client-auth-change'))
  }, [])

  const setActiveDashboardTab = (tab: DashboardTabId) => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.activeTab, tab)
    setActiveDashboardTabState(tab)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      client,
      activeDashboardTab,
      login,
      logout,
      setActiveDashboardTab,
    }),
    [activeDashboardTab, client, isAuthenticated, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
