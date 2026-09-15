import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  AUTH_STORAGE_KEYS,
  INACTIVITY_LIMIT_MS,
  readLastActivityAt,
  writeLastActivityAt,
} from '../../context/authStorage'

const ACTIVITY_THROTTLE_MS = 1_000

export function InactivityMonitor() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) return

    let timeoutId: number | undefined
    let lastActivityAt = readLastActivityAt() ?? Date.now()
    let lastHandledAt = 0
    let hasLoggedOut = false

    const clearExpiryTimeout = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
        timeoutId = undefined
      }
    }

    const expireIfInactive = () => {
      const storedActivityAt = readLastActivityAt() ?? 0
      lastActivityAt = Math.max(lastActivityAt, storedActivityAt)
      const remaining = INACTIVITY_LIMIT_MS - (Date.now() - lastActivityAt)

      if (remaining > 0) {
        clearExpiryTimeout()
        timeoutId = window.setTimeout(expireIfInactive, remaining)
        return
      }

      if (hasLoggedOut) return
      hasLoggedOut = true
      clearExpiryTimeout()
      logout()
      navigate('/login', { replace: true })
    }

    const scheduleExpiry = () => {
      clearExpiryTimeout()
      const remaining = Math.max(
        0,
        INACTIVITY_LIMIT_MS - (Date.now() - lastActivityAt),
      )
      timeoutId = window.setTimeout(expireIfInactive, remaining)
    }

    const recordActivity = () => {
      if (hasLoggedOut) return

      const now = Date.now()
      const storedActivityAt = readLastActivityAt() ?? 0
      lastActivityAt = Math.max(lastActivityAt, storedActivityAt)

      if (now - lastActivityAt >= INACTIVITY_LIMIT_MS) {
        expireIfInactive()
        return
      }

      lastActivityAt = now

      if (now - lastHandledAt < ACTIVITY_THROTTLE_MS) return
      lastHandledAt = now
      writeLastActivityAt(now)
      scheduleExpiry()
    }

    const persistLatestActivity = () => {
      if (!hasLoggedOut) writeLastActivityAt(lastActivityAt)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordActivity()
      } else {
        persistLatestActivity()
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEYS.lastActivityAt && event.newValue) {
        const nextActivityAt = Number(event.newValue)
        if (Number.isFinite(nextActivityAt) && nextActivityAt > lastActivityAt) {
          lastActivityAt = nextActivityAt
          scheduleExpiry()
        }
      }

      if (event.key === AUTH_STORAGE_KEYS.token && event.newValue === null) {
        hasLoggedOut = true
        clearExpiryTimeout()
        navigate('/login', { replace: true })
      }
    }

    const passiveOptions: AddEventListenerOptions = { passive: true }
    const capturedPassiveOptions: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener('pointerdown', recordActivity, passiveOptions)
    window.addEventListener('keydown', recordActivity)
    window.addEventListener('touchstart', recordActivity, passiveOptions)
    document.addEventListener('scroll', recordActivity, capturedPassiveOptions)
    window.addEventListener('focus', recordActivity)
    window.addEventListener('beforeunload', persistLatestActivity)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    scheduleExpiry()

    return () => {
      clearExpiryTimeout()
      window.removeEventListener('pointerdown', recordActivity, passiveOptions)
      window.removeEventListener('keydown', recordActivity)
      window.removeEventListener('touchstart', recordActivity, passiveOptions)
      document.removeEventListener('scroll', recordActivity, capturedPassiveOptions)
      window.removeEventListener('focus', recordActivity)
      window.removeEventListener('beforeunload', persistLatestActivity)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, logout, navigate])

  return null
}
