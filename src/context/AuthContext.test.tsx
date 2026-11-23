import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { AUTH_STORAGE_KEYS as keys } from './authStorage'
import { requestProjectDetails } from '../services/projectDetailsApi'

vi.mock('../services/projectDetailsApi', () => ({ requestProjectDetails: vi.fn() }))
const request = vi.mocked(requestProjectDetails)

beforeEach(() => {
  localStorage.clear()
  request.mockReset()
  localStorage.setItem(keys.data, JSON.stringify({ leadId: 'lead1', name: 'Client' }))
  localStorage.setItem(keys.token, 'lead1')
  localStorage.setItem(keys.leadId, 'lead1')
  localStorage.setItem(keys.loginAt, String(Date.now()))
  localStorage.setItem(keys.lastActivityAt, String(Date.now()))
})
afterEach(() => { vi.useRealTimers(); localStorage.clear() })

it('refreshes identity while preserving navigation and session timestamps, then stops polling', async () => {
  request.mockResolvedValue({ success: true, message: '', isConverted: true, convertedContactId: 'contact1' })
  localStorage.setItem(keys.activeTab, 'approvals')
  localStorage.setItem(keys.selectedProjectId, 'project2')
  const { result, unmount } = renderHook(() => useAuth(), { wrapper: AuthProvider })
  const loginAt = localStorage.getItem(keys.loginAt)
  const activityAt = localStorage.getItem(keys.lastActivityAt)
  await waitFor(() => expect(result.current.client?.contactId).toBe('contact1'))
  expect(result.current.client).toMatchObject({ leadId: 'lead1', name: 'Client' })
  expect(result.current.activeDashboardTab).toBe('approvals')
  expect(localStorage.getItem(keys.activeTab)).toBe('approvals')
  expect(localStorage.getItem(keys.selectedProjectId)).toBe('project2')
  expect(localStorage.getItem(keys.contactId)).toBe('contact1')
  expect(JSON.parse(localStorage.getItem(keys.data)!)).toEqual(result.current.client)
  expect(localStorage.getItem(keys.loginAt)).toBe(loginAt)
  expect(localStorage.getItem(keys.lastActivityAt)).toBe(activityAt)
  act(() => window.dispatchEvent(new Event('focus')))
  expect(request).toHaveBeenCalledTimes(1)
  unmount()
})

it('ignores a conversion response after logout', async () => {
  let resolve!: (value: Awaited<ReturnType<typeof requestProjectDetails>>) => void
  request.mockImplementation(() => new Promise(done => { resolve = done }))
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
  act(() => result.current.logout())
  await act(async () => resolve({ success: true, message: '', isConverted: true, convertedContactId: 'contact1' }))
  expect(result.current.isAuthenticated).toBe(false)
  expect(localStorage.getItem(keys.data)).toBeNull()
})

it('retries failed checks without disrupting the session', async () => {
  request.mockResolvedValueOnce({ success: false, message: 'Offline' })
    .mockResolvedValue({ success: true, message: '', isConverted: true, convertedContactId: 'contact1' })
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
  expect(result.current.isAuthenticated).toBe(true)
  expect(result.current.client?.contactId).toBeUndefined()
  act(() => window.dispatchEvent(new Event('focus')))
  await waitFor(() => expect(result.current.client?.contactId).toBe('contact1'))
})

it('does not check conversion for an existing Contact session', () => {
  localStorage.setItem(keys.data, JSON.stringify({ leadId: 'lead1', contactId: 'contact1' }))
  renderHook(() => useAuth(), { wrapper: AuthProvider })
  expect(request).not.toHaveBeenCalled()
})
