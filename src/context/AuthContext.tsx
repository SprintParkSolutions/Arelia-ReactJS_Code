/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
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

  const login = (nextClient: AuthClient) => {
    const normalizedClient = {
      contactId: nextClient.contactId || undefined,
      leadId: nextClient.leadId || undefined,
      name: nextClient.name || undefined,
      email: nextClient.email || undefined,
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

    setClient(normalizedClient)
    setActiveDashboardTabState(defaultActiveTab)
    window.dispatchEvent(new Event('client-auth-change'))
  }

  const logout = () => {
    clearStoredAuth()

    setClient(null)
    setActiveDashboardTabState(defaultActiveTab)
    window.dispatchEvent(new Event('client-auth-change'))
  }

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
    [activeDashboardTab, client, isAuthenticated],
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
