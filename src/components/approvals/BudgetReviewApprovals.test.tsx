import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BudgetReviewApprovals } from './BudgetReviewApprovals'
import { useBudgetNotifications } from './useBudgetNotifications'
import type { BudgetReview } from '../../services/budgetReviewApi'
const budget: BudgetReview = { opportunityId: 'opp1', opportunityName: 'Home', status: 'Sent for Client Approval', customerBudget: 100000, supervisorBudget: 120000, estimatedDuration: '3', clientRemarks: '', canRespond: true }
const result = { success: true, message: '', budget }
function state() { return { result, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
describe('Budget Review UI', () => {
  it('adds final manager approval once and preserves read and dismissed history', () => {
    const hook = renderHook(({ value }) => useBudgetNotifications('budget-manager-test', value), { initialProps: { value: result } })
    const approved = { ...result, budget: { ...budget, status: 'Manager Approved', canRespond: false } }
    hook.rerender({ value: approved })
    expect(hook.result.current.notifications).toHaveLength(2)
    const notice = hook.result.current.notifications[0]
    expect(notice.message).toBe('Budget Review for Home has received final internal approval and is ready to proceed to the next stage.')
    expect(notice.read).toBe(false)
    expect(notice.budgetOpportunityId).toBe('opp1')
    act(() => hook.result.current.markRead(notice.id))
    hook.rerender({ value: { ...approved } })
    expect(hook.result.current.notifications).toHaveLength(2)
    expect(hook.result.current.notifications[0].read).toBe(true)
    act(() => hook.result.current.dismiss(notice.id))
    hook.rerender({ value: { ...approved } })
    expect(hook.result.current.notifications).toHaveLength(1)
  })
  it('notifies again after a recorded response and persists tracking across remounts', () => {
    const first = result
    const hook = renderHook(({ value }) => useBudgetNotifications('budget-resend-test', value), { initialProps: { value: first } })
    const original = hook.result.current.notifications[0]
    act(() => hook.result.current.markRead(original.id))
    hook.rerender({ value: { ...first, budget: { ...budget, status: 'Client Requested Changes' } } })
    hook.rerender({ value: first })
    expect(hook.result.current.notifications).toHaveLength(2)
    expect(hook.result.current.notifications[0].read).toBe(false)
    expect(hook.result.current.notifications[1].read).toBe(true)
    const secondId = hook.result.current.notifications[0].id
    act(() => hook.result.current.dismiss(secondId))
    hook.rerender({ value: first })
    expect(hook.result.current.notifications).toHaveLength(1)
    hook.rerender({ value: { ...first, budget: { ...budget, status: 'Client Requested Changes' } } })
    hook.unmount()
    const resumed = renderHook(() => useBudgetNotifications('budget-resend-test', first))
    expect(resumed.result.current.notifications).toHaveLength(2)
    expect(resumed.result.current.notifications[0].id).not.toBe(secondId)
  })
  it('displays budgets and duration and submits approval', async () => {
    const data = state()
    render(<BudgetReviewApprovals leadId="lead1" state={data} />)
    expect(screen.getByText('1,00,000')).toBeInTheDocument()
    expect(screen.getByText('1,20,000')).toBeInTheDocument()
    expect(screen.getByText('3 months')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve budget' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(budget, 'Client Approved', ''))
  })
  it('requires change comments and displays recorded responses read-only', async () => {
    const data = state()
    const view = render(<BudgetReviewApprovals leadId="lead1" state={data} />)
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
    fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    expect(data.submit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: 'Reduce estimate' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(budget, 'Client Requested Changes', 'Reduce estimate'))
    view.rerender(<BudgetReviewApprovals leadId="lead1" state={{ ...data, result: { ...result, budget: { ...budget, status: 'Client Requested Changes', clientRemarks: 'Reduce estimate', canRespond: false } } }} />)
    expect(screen.queryByRole('button', { name: 'Approve budget' })).not.toBeInTheDocument()
    expect(screen.getByText('Reduce estimate')).toBeInTheDocument()
  })
  it('keeps read notifications and avoids duplicate or dismissed notifications', () => {
    const hook = renderHook(({ value }) => useBudgetNotifications('budget-history-test', value), { initialProps: { value: result } })
    expect(hook.result.current.notifications).toHaveLength(1)
    const notification = hook.result.current.notifications[0]
    expect(notification.message).toBe('Budget Review for Home is ready for your review and approval.')
    act(() => hook.result.current.markRead(notification.id))
    hook.rerender({ value: { ...result } })
    expect(hook.result.current.notifications[0].read).toBe(true)
    hook.rerender({ value: result })
    expect(hook.result.current.notifications).toHaveLength(1)
    act(() => hook.result.current.dismiss(notification.id))
    hook.rerender({ value: { ...result } })
    expect(hook.result.current.notifications).toHaveLength(0)
  })
})
