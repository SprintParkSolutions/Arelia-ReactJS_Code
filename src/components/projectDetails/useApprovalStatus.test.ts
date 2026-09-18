import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestProjectDetails } from '../../services/projectDetailsApi'
import { useApprovalStatus } from './useApprovalStatus'
import { useProjectReminder } from './useProjectReminder'
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