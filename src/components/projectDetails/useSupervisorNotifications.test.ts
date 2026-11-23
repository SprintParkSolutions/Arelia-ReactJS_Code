import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getSupervisor } from '../../services/supervisorApi'
import { useSupervisorNotifications } from './useSupervisorNotifications'
vi.mock('../../services/supervisorApi', () => ({ getSupervisor: vi.fn() }))
const request = vi.mocked(getSupervisor)
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks() })
afterEach(() => vi.useRealTimers())
const projects = (first: string, second: string) => ({ success: true, message: '', projects: [
  { success: true, message: '', leadId: first }, { success: true, message: '', leadId: second },
] })
const primary = { success: true, message: '', assigned: true, supervisorUser: 'First Supervisor' }
it('notifies for the second assignment even when the first notification was dismissed', async () => {
  localStorage.setItem('supervisorAssignedNotification:supervisor-first', JSON.stringify({ timestamp: 123, read: true, dismissed: true }))
  request.mockResolvedValue({ success: true, message: '', assigned: false })
  const useHistory = () => useSupervisorNotifications('supervisor-first', projects('supervisor-first', 'supervisor-second'), primary)
  const view = renderHook(useHistory)
  await act(async () => {})
  expect(view.result.current.notifications).toHaveLength(0)
  request.mockResolvedValue({ success: true, message: '', assigned: true, supervisorUser: 'Second Supervisor' })
  await act(async () => vi.advanceTimersByTime(30_000))
  expect(view.result.current.notifications).toHaveLength(1)
  expect(view.result.current.notifications[0]).toMatchObject({ id: 'supervisor-assigned:supervisor-second', read: false,
    message: 'Project 2: Second Supervisor has been assigned as your project supervisor.' })
  act(() => view.result.current.markRead('supervisor-assigned:supervisor-second'))
  await act(async () => vi.advanceTimersByTime(60_000))
  expect(view.result.current.notifications).toHaveLength(1)
  expect(view.result.current.notifications[0].read).toBe(true)
  act(() => view.result.current.dismiss('supervisor-assigned:supervisor-second'))
  view.unmount()
  const restored = renderHook(useHistory)
  await act(async () => {})
  expect(restored.result.current.notifications).toHaveLength(0)
  restored.unmount()
  const calls = request.mock.calls.length
  await act(async () => vi.advanceTimersByTime(60_000))
  expect(request).toHaveBeenCalledTimes(calls)
})
it('checks on focus, ignores failures, and keeps project read states separate', async () => {
  request.mockResolvedValue({ success: false, message: 'Offline' })
  const { result } = renderHook(() => useSupervisorNotifications('focus-supervisor-first', projects('focus-supervisor-first', 'focus-supervisor-second'), primary))
  await act(async () => {})
  expect(result.current.notifications).toHaveLength(1)
  request.mockResolvedValue({ success: true, message: '', assigned: true })
  await act(async () => window.dispatchEvent(new Event('focus')))
  expect(result.current.notifications).toHaveLength(2)
  act(() => result.current.markRead('supervisor-assigned:focus-supervisor-first'))
  expect(result.current.notifications.map(entry => entry.read)).toEqual([true, false])
  act(() => result.current.markAllRead())
  expect(result.current.notifications.every(entry => entry.read)).toBe(true)
})
it('discovers newly added projects and ignores late responses after account changes', async () => {
  let resolve!: (value: Awaited<ReturnType<typeof getSupervisor>>) => void
  request.mockImplementation(() => new Promise(done => { resolve = done }))
  const { result, rerender } = renderHook(({ account, multiple }) => useSupervisorNotifications(account,
    multiple ? projects(account, 'new-supervisor-project') : { success: true, message: '', leadId: account }, null),
    { initialProps: { account: 'dynamic-supervisor', multiple: false } })
  expect(request).not.toHaveBeenCalled()
  rerender({ account: 'dynamic-supervisor', multiple: true })
  expect(request).toHaveBeenCalledWith('new-supervisor-project')
  rerender({ account: 'other-supervisor-account', multiple: false })
  await act(async () => resolve({ success: true, message: '', assigned: true }))
  expect(result.current.notifications).toHaveLength(0)
})
