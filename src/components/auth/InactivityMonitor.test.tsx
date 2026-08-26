import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_STORAGE_KEYS, INACTIVITY_LIMIT_MS } from '../../context/authStorage'
import { InactivityMonitor } from './InactivityMonitor'

const auth = vi.hoisted(() => ({
  isAuthenticated: true,
  logout: vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => auth,
}))

function CurrentPath() {
  return <span>{useLocation().pathname}</span>
}

function renderMonitor() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <InactivityMonitor />
      <Routes>
        <Route path="*" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InactivityMonitor', () => {
  const now = new Date('2026-08-26T10:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    window.localStorage.clear()
    window.localStorage.setItem(AUTH_STORAGE_KEYS.token, 'client-id')
    window.localStorage.setItem(AUTH_STORAGE_KEYS.lastActivityAt, String(now.getTime()))
    auth.isAuthenticated = true
    auth.logout.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('logs out and redirects after one hour of inactivity', () => {
    renderMonitor()

    act(() => {
      vi.advanceTimersByTime(INACTIVITY_LIMIT_MS)
    })

    expect(auth.logout).toHaveBeenCalledTimes(1)
    expect(screen.getByText('/login')).toBeInTheDocument()
  })

  it('resets the inactivity deadline after user activity', () => {
    renderMonitor()

    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000)
      fireEvent.pointerDown(window)
      vi.advanceTimersByTime(30 * 60 * 1000)
    })

    expect(auth.logout).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000)
    })

    expect(auth.logout).toHaveBeenCalledTimes(1)
  })

  it('uses only the remaining time from persisted activity after reload', () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.lastActivityAt,
      String(now.getTime() - 45 * 60 * 1000),
    )
    renderMonitor()

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(auth.logout).toHaveBeenCalledTimes(1)
  })

  it('responds to logout from another tab without calling logout again', () => {
    renderMonitor()

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: AUTH_STORAGE_KEYS.token,
        oldValue: 'client-id',
        newValue: null,
      }))
    })

    expect(auth.logout).not.toHaveBeenCalled()
    expect(screen.getByText('/login')).toBeInTheDocument()
  })

  it('uses activity from another tab to extend the shared deadline', () => {
    renderMonitor()

    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000)
      window.dispatchEvent(new StorageEvent('storage', {
        key: AUTH_STORAGE_KEYS.lastActivityAt,
        oldValue: String(now.getTime()),
        newValue: String(Date.now()),
      }))
      vi.advanceTimersByTime(31 * 60 * 1000)
    })

    expect(auth.logout).not.toHaveBeenCalled()
  })

  it('does not let focus revive an already inactive session', () => {
    renderMonitor()

    act(() => {
      vi.setSystemTime(now.getTime() + INACTIVITY_LIMIT_MS)
      window.dispatchEvent(new Event('focus'))
    })

    expect(auth.logout).toHaveBeenCalledTimes(1)
    expect(screen.getByText('/login')).toBeInTheDocument()
  })

  it('removes its timeout when unmounted', () => {
    const view = renderMonitor()
    view.unmount()

    act(() => {
      vi.advanceTimersByTime(INACTIVITY_LIMIT_MS)
    })

    expect(auth.logout).not.toHaveBeenCalled()
  })
})
