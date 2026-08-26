import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_STORAGE_KEYS,
  INACTIVITY_LIMIT_MS,
  isSessionExpired,
} from './authStorage'

describe('authStorage inactivity expiry', () => {
  const now = new Date('2026-08-26T10:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    window.localStorage.clear()
    window.localStorage.setItem(AUTH_STORAGE_KEYS.token, 'client-id')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.loginAt, String(now.getTime()))
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('expires a session after exactly one hour without activity', () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.lastActivityAt,
      String(now.getTime() - INACTIVITY_LIMIT_MS),
    )

    expect(isSessionExpired()).toBe(true)
  })

  it('keeps a recently active session valid', () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.lastActivityAt,
      String(now.getTime() - INACTIVITY_LIMIT_MS + 1),
    )

    expect(isSessionExpired()).toBe(false)
  })

  it('does not expire an active session solely because login was over 12 hours ago', () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.loginAt,
      String(now.getTime() - 13 * 60 * 60 * 1000),
    )
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.lastActivityAt,
      String(now.getTime() - 30 * 60 * 1000),
    )

    expect(isSessionExpired()).toBe(false)
  })

  it('migrates an existing session from its login timestamp', () => {
    const loginAt = now.getTime() - 30 * 60 * 1000
    window.localStorage.setItem(AUTH_STORAGE_KEYS.loginAt, String(loginAt))

    expect(isSessionExpired()).toBe(false)
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.lastActivityAt)).toBe(String(loginAt))
  })
})
