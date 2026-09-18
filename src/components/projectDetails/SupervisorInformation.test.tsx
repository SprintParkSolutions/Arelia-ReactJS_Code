import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SupervisorInformation } from './SupervisorInformation'
import { useSupervisor } from './useSupervisor'
import { useProjectReminder } from './useProjectReminder'
import { getSupervisor } from '../../services/supervisorApi'
vi.mock('../../services/supervisorApi', () => ({ getSupervisor: vi.fn() }))
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })
describe('supervisor information', () => {
  it('shows the three requested fields read-only', () => {
    render(<SupervisorInformation leadId="00Q123" result={{ success: true, assigned: true, message: '', supervisorUser: 'Alex Smith', supervisorUserEmail: 'alex@example.com', supervisorUserPhone: '+919876543210' }} retry={vi.fn()} />)
    expect(screen.getByText('Alex Smith')).toBeInTheDocument()
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
    expect(screen.getByText('+919876543210')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
  it('distinguishes no assignment from a failed request', () => {
    const retry = vi.fn()
    const view = render(<SupervisorInformation leadId="00Q123" result={{ success: true, assigned: false, message: '' }} retry={retry} />)
    expect(screen.getByText(/has not been assigned yet/)).toBeInTheDocument()
    view.rerender(<SupervisorInformation leadId="00Q123" result={{ success: false, message: 'Offline' }} retry={retry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Offline')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(retry).toHaveBeenCalledOnce()
  })
  it('detects assignment by polling and retains a single read notification', async () => {
    vi.useFakeTimers()
    vi.mocked(getSupervisor).mockResolvedValue({ success: true, assigned: false, message: '' })
    const hook = renderHook(() => {
      const supervisor = useSupervisor('supervisor-test-lead')
      return useProjectReminder('supervisor-test-lead', Boolean(supervisor.result?.success && supervisor.result.assigned), 'supervisorAssignedNotification')
    })
    await act(async () => {})
    expect(hook.result.current.reminder).toBeNull()
    vi.mocked(getSupervisor).mockResolvedValue({ success: true, assigned: true, supervisorUserId: '005123', message: '' })
    await act(async () => vi.advanceTimersByTime(30_000))
    const timestamp = hook.result.current.reminder!.timestamp
    act(() => hook.result.current.markRead())
    await act(async () => vi.advanceTimersByTime(30_000))
    expect(hook.result.current.reminder).toEqual({ timestamp, read: true, dismissed: false })
    hook.unmount()
    const count = vi.mocked(getSupervisor).mock.calls.length
    await act(async () => vi.advanceTimersByTime(30_000))
    expect(getSupervisor).toHaveBeenCalledTimes(count)
  })
})