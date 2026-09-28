import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAgreementNotifications } from './useAgreementNotifications'
import { getAgreementNotice } from '../../services/clientAgreementApi'
vi.mock('../../services/clientAgreementApi', () => ({ getAgreementNotice: vi.fn() }))
afterEach(() => { vi.clearAllMocks(); vi.useRealTimers() })
it('notifies when sent and retains read/deleted history without duplicates', async () => {
  vi.mocked(getAgreementNotice).mockResolvedValue(null)
  const hook = renderHook(() => useAgreementNotifications('agreement-test'))
  await waitFor(() => expect(getAgreementNotice).toHaveBeenCalled())
  expect(hook.result.current.notifications).toHaveLength(0)
  vi.mocked(getAgreementNotice).mockResolvedValue({ opportunityId: 'opp1', message: 'Your Client Agreement has been sent to client@example.com. Please review and sign the agreement.' })
  act(() => window.dispatchEvent(new Event('focus')))
  await waitFor(() => expect(hook.result.current.notifications).toHaveLength(1))
  const id = hook.result.current.notifications[0].id
  act(() => hook.result.current.markRead(id))
  expect(hook.result.current.notifications[0].read).toBe(true)
  act(() => window.dispatchEvent(new Event('focus')))
  await waitFor(() => expect(getAgreementNotice).toHaveBeenCalledTimes(3))
  expect(hook.result.current.notifications).toHaveLength(1)
  act(() => hook.result.current.dismiss(id))
  hook.unmount()
  const next = renderHook(() => useAgreementNotifications('agreement-test'))
  await waitFor(() => expect(getAgreementNotice).toHaveBeenCalledTimes(4))
  expect(next.result.current.notifications).toHaveLength(0)
})

it('notifies for three projects independently and retains read and dismissed history', async () => {
  const ids = ['agreement-multi-one', 'agreement-multi-two', 'agreement-multi-three']
  vi.mocked(getAgreementNotice).mockImplementation(async id => ({ opportunityId: 'opp-' + id, message: 'Please review and sign your agreement.' }))
  const view = renderHook(() => useAgreementNotifications(ids[0], ids))
  await waitFor(() => expect(view.result.current.notifications).toHaveLength(3))
  const second = view.result.current.notifications.find(item => item.leadId === ids[1])!
  expect(second.message).toBe('Project 2: Please review and sign your agreement.')
  act(() => view.result.current.markRead(second.id))
  const first = view.result.current.notifications.find(item => item.leadId === ids[0])!
  act(() => view.result.current.dismiss(first.id))
  expect(view.result.current.notifications.find(item => item.leadId === ids[2])?.read).toBe(false)
  view.unmount()
  const restored = renderHook(() => useAgreementNotifications(ids[0], ids))
  await waitFor(() => expect(getAgreementNotice).toHaveBeenCalledTimes(6))
  expect(restored.result.current.notifications).toHaveLength(2)
  expect(restored.result.current.notifications.find(item => item.id === second.id)?.read).toBe(true)
  act(() => restored.result.current.markAllRead())
  expect(restored.result.current.notifications.every(item => item.read)).toBe(true)
})
it('discovers additional projects, polls on focus and interval, and stops on unmount', async () => {
  vi.useFakeTimers()
  vi.mocked(getAgreementNotice).mockResolvedValue(null)
  const ids = ['agreement-poll-one', 'agreement-poll-two', 'agreement-poll-three']
  const view = renderHook(({ count }) => useAgreementNotifications(ids[0], ids.slice(0, count)), { initialProps: { count: 2 } })
  await act(async () => {})
  expect(getAgreementNotice).toHaveBeenCalledTimes(2)
  await act(async () => vi.advanceTimersByTime(30000))
  expect(getAgreementNotice).toHaveBeenCalledTimes(4)
  view.rerender({ count: 3 })
  await act(async () => {})
  expect(getAgreementNotice).toHaveBeenCalledWith(ids[2])
  await act(async () => window.dispatchEvent(new Event('focus')))
  expect(getAgreementNotice).toHaveBeenCalledTimes(10)
  view.unmount()
  await act(async () => vi.advanceTimersByTime(60000))
  expect(getAgreementNotice).toHaveBeenCalledTimes(10)
})
it('does not let a slow project block another project and ignores late responses after account changes', async () => {
  let resolve!: (value: Awaited<ReturnType<typeof getAgreementNotice>>) => void
  vi.mocked(getAgreementNotice).mockImplementation(id => id === 'agreement-slow' ? new Promise(done => { resolve = done }) : Promise.resolve({ opportunityId: 'opp-' + id, message: 'Agreement sent.' }))
  const view = renderHook(({ id, ids }) => useAgreementNotifications(id, ids), { initialProps: { id: 'agreement-slow', ids: ['agreement-slow', 'agreement-fast'] } })
  await waitFor(() => expect(view.result.current.notifications).toHaveLength(1))
  expect(view.result.current.notifications[0].leadId).toBe('agreement-fast')
  vi.mocked(getAgreementNotice).mockResolvedValue(null)
  view.rerender({ id: 'agreement-other-account', ids: ['agreement-other-account'] })
  await act(async () => resolve({ opportunityId: 'late-opportunity', message: 'Late notice' }))
  expect(view.result.current.notifications).toHaveLength(0)
})
