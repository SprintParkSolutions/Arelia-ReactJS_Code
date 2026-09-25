import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestProjectDetails } from '../../services/projectDetailsApi'
import { useApprovalStatus, useApprovalProjects } from './useApprovalStatus'
import { useProjectReminder, useProjectApprovalNotifications } from './useProjectReminder'
vi.mock('../../services/projectDetailsApi', () => ({ requestProjectDetails: vi.fn() }))
const request = vi.mocked(requestProjectDetails)
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks() })
afterEach(() => vi.useRealTimers())
describe('approval notifications', () => {
  it('detects approval during polling and retains a single read notification', async () => {
    request.mockResolvedValue({ success: true, message: '', approvalStatus: 'Pending' })
    const { result } = renderHook(() => {
      const status = useApprovalStatus('approval-poll-test')
      return useProjectReminder('approval-poll-test', status === 'Approved', 'projectApprovalNotification')
    })
    await act(async () => {})
    expect(result.current.reminder).toBeNull()
    request.mockResolvedValue({ success: true, message: '', approvalStatus: 'Approved' })
    await act(async () => vi.advanceTimersByTime(30_000))
    const timestamp = result.current.reminder!.timestamp
    act(() => result.current.markRead())
    await act(async () => vi.advanceTimersByTime(60_000))
    expect(result.current.reminder).toEqual({ timestamp, read: true, dismissed: false })
  })
  it('never creates an approval for rejected, missing, or failed responses', async () => {
    request.mockResolvedValueOnce({ success: true, message: '', approvalStatus: 'Rejected' })
      .mockResolvedValueOnce({ success: false, message: 'Offline' })
      .mockResolvedValue({ success: true, message: '' })
    const { result } = renderHook(() => {
      const status = useApprovalStatus('unapproved-test')
      return useProjectReminder('unapproved-test', status === 'Approved', 'projectApprovalNotification')
    })
    await act(async () => {})
    await act(async () => vi.advanceTimersByTime(60_000))
    expect(result.current.reminder).toBeNull()
  })
  it('checks on focus and stops polling on unmount', async () => {
    request.mockResolvedValue({ success: true, message: '', approvalStatus: 'Approved' })
    const { result, unmount } = renderHook(() => useApprovalStatus('focus-test'))
    await act(async () => {})
    expect(result.current).toBe('Approved')
    await act(async () => window.dispatchEvent(new Event('focus')))
    expect(request).toHaveBeenCalledTimes(2)
    unmount()
    await act(async () => vi.advanceTimersByTime(60_000))
    expect(request).toHaveBeenCalledTimes(2)
  })
})
it('detects the second project approval independently and preserves dismissal after remount', async () => {
  const first = { success: true, message: '', leadId: 'multi-first', approvalStatus: 'Approved' as const }
  const second = { success: true, message: '', leadId: 'multi-second', approvalStatus: 'Pending' as const }
  localStorage.setItem('projectApprovalNotification:multi-first', JSON.stringify({ timestamp: 123, read: true, dismissed: true }))
  request.mockResolvedValue({ ...first, projects: [first, second] })
  const useHistory = () => useProjectApprovalNotifications('multi-first', useApprovalProjects('multi-first'))
  const view = renderHook(useHistory)
  await act(async () => {})
  expect(view.result.current.notifications).toHaveLength(0)
  request.mockResolvedValue({ ...first, projects: [first, { ...second, approvalStatus: 'Approved' }] })
  await act(async () => vi.advanceTimersByTime(30_000))
  expect(view.result.current.notifications).toHaveLength(1)
  expect(view.result.current.notifications[0]).toMatchObject({ id: 'project-details-approved:multi-second', read: false })
  expect(view.result.current.notifications[0].message).toContain('Project 2:')
  act(() => view.result.current.markRead('project-details-approved:multi-second'))
  await act(async () => vi.advanceTimersByTime(60_000))
  expect(view.result.current.notifications).toHaveLength(1)
  expect(view.result.current.notifications[0].read).toBe(true)
  act(() => view.result.current.dismiss('project-details-approved:multi-second'))
  view.unmount()
  const restored = renderHook(useHistory)
  await act(async () => {})
  expect(restored.result.current.notifications).toHaveLength(0)
})
it('keeps read state independent and supports mark all read', () => {
  const projects = ['independent-first', 'independent-second'].map(leadId => ({ success: true, message: '', leadId, approvalStatus: 'Approved' as const }))
  const { result } = renderHook(() => useProjectApprovalNotifications('independent-first', { success: true, message: '', projects }))
  expect(result.current.notifications).toHaveLength(2)
  act(() => result.current.markRead('project-details-approved:independent-first'))
  expect(result.current.notifications.map(entry => entry.read)).toEqual([true, false])
  act(() => result.current.markAllRead())
  expect(result.current.notifications.every(entry => entry.read)).toBe(true)
})
