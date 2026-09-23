import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAgreementNotifications } from './useAgreementNotifications'
import { getAgreementNotice } from '../../services/clientAgreementApi'
vi.mock('../../services/clientAgreementApi', () => ({ getAgreementNotice: vi.fn() }))
afterEach(() => vi.clearAllMocks())
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
