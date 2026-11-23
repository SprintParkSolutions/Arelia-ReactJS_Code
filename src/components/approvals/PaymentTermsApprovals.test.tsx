import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PaymentTermsApprovals } from './PaymentTermsApprovals'
import { usePaymentNotifications } from './usePaymentNotifications'
import type { PaymentReview } from '../../services/paymentTermsApi'
const payment: PaymentReview = { opportunityId: 'opp1', opportunityName: 'Home', status: 'Sent for Client Approval', clientRemarks: '', canRespond: true, terms: [{ id: 'term1', label: 'Booking', percentage: 25, dueDate: '2026-10-01' }] }
const result = { success: true, message: '', payment }
function state() { return { result, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
describe('Payment Terms approval', () => {
  it('displays a schedule and confirms approval', async () => {
    const data = state()
    render(<PaymentTermsApprovals leadId="lead1" state={data} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Booking')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('1 October 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve payment terms' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(payment, 'Client Approved', ''))
  })
  it('requires change comments and keeps recorded decisions read-only', async () => {
    const data = state()
    const view = render(<PaymentTermsApprovals leadId="lead1" state={data} />)
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
    fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: ' ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    expect(data.submit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: 'Change due date' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(payment, 'Client Requested Changes', 'Change due date'))
    view.rerender(<PaymentTermsApprovals leadId="lead1" state={{ ...data, result: { ...result, payment: { ...payment, status: 'Client Requested Changes', clientRemarks: 'Change due date', canRespond: false } } }} />)
    expect(screen.getByText('Change due date')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve payment terms' })).not.toBeInTheDocument()
  })
  it('retains history and creates a fresh notification after an observed resend', () => {
    const hook = renderHook(({ value }) => usePaymentNotifications('payment-history-test', value), { initialProps: { value: result } })
    const notice = hook.result.current.notifications[0]
    expect(notice.message).toBe('Payment Terms for Home are ready for your review and approval.')
    act(() => hook.result.current.markRead(notice.id))
    hook.rerender({ value: { ...result, payment: { ...payment, status: 'Client Requested Changes' } } })
    hook.rerender({ value: result })
    expect(hook.result.current.notifications).toHaveLength(2)
    expect(hook.result.current.notifications[0].read).toBe(false)
    expect(hook.result.current.notifications[1].read).toBe(true)
    const second = hook.result.current.notifications[0].id
    act(() => hook.result.current.dismiss(second))
    hook.rerender({ value: { ...result } })
    expect(hook.result.current.notifications).toHaveLength(1)
  })
})
