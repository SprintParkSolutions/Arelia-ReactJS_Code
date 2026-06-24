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
  getDefaultDashboardTab,
  readStoredClient,
  readStoredTab,
  type StoredAuthClient,
} from './authStorage'

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

  const isAuthenticated = Boolean(
    client?.contactId ||
      client?.leadId ||
      (typeof window !== 'undefined' && window.localStorage.getItem(AUTH_STORAGE_KEYS.token)),
  )

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

  const login = (nextClient: AuthClient) => {
    const normalizedClient = {
      contactId: nextClient.contactId || undefined,
      leadId: nextClient.leadId || undefined,
      name: nextClient.name || undefined,
      email: nextClient.email || undefined,
    }
    const token = normalizedClient.contactId || normalizedClient.leadId || normalizedClient.email || 'authenticated'

    window.localStorage.setItem(AUTH_STORAGE_KEYS.token, token)
    window.localStorage.setItem(AUTH_STORAGE_KEYS.data, JSON.stringify(normalizedClient))
    window.localStorage.setItem(AUTH_STORAGE_KEYS.contactId, normalizedClient.contactId || '')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.leadId, normalizedClient.leadId || '')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.name, normalizedClient.name || '')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.activeTab, defaultActiveTab)

    setClient(normalizedClient)
    setActiveDashboardTabState(defaultActiveTab)
    window.dispatchEvent(new Event('client-auth-change'))
  }

  const logout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.token)
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.data)
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.contactId)
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.leadId)
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.name)
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.activeTab)

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
