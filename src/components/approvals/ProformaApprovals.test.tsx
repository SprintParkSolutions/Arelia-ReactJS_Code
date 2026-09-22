import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProformaApprovals } from './ProformaApprovals'
import { useProformaNotifications } from './useProformaNotifications'
import { getProformaInvoice, type Invoice } from '../../services/proformaApi'
vi.mock('../../services/proformaApi', async importOriginal => ({ ...await importOriginal<typeof import('../../services/proformaApi')>(), getProformaInvoice: vi.fn() }))
afterEach(() => vi.clearAllMocks())
const invoice: Invoice = { invoiceId: 'invoice1', name: 'PI-001', opportunityId: 'opp1', opportunityName: 'Home', status: 'Sent', comments: '', secureToken: 'test-token', createdDate: '', canApprove: true, canRequestChanges: true, files: [] }
function state() { return { result: { success: true, message: '', invoices: [invoice] }, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
describe('Proforma Approvals', () => {
  it('notifies once for final manager approval and preserves read history', () => {
    const pending = { ...invoice, status: 'Approved', managerApproval: false }
    const hook = renderHook(({ item }) => useProformaNotifications('manager-invoice-test', { success: true, message: '', invoices: [item] }), { initialProps: { item: pending } })
    expect(hook.result.current.notifications).toHaveLength(0)
    hook.rerender({ item: { ...pending, managerApproval: true } })
    expect(hook.result.current.notifications).toHaveLength(1)
    const notification = hook.result.current.notifications[0]
    expect(notification.message).toBe('Proforma Invoice PI-001 for Home has received final internal approval and is ready to proceed to the next stage.')
    expect(notification.invoiceId).toBe(invoice.invoiceId)
    act(() => hook.result.current.markRead(notification.id))
    hook.rerender({ item: { ...pending, managerApproval: true } })
    expect(hook.result.current.notifications).toHaveLength(1)
    expect(hook.result.current.notifications[0].read).toBe(true)
    act(() => hook.result.current.dismiss(notification.id))
    hook.rerender({ item: { ...pending, managerApproval: true } })
    expect(hook.result.current.notifications).toHaveLength(0)
  })
  it('loads invoice files automatically with only download actions', async () => {
    vi.mocked(getProformaInvoice).mockResolvedValue({ success: true, message: '', invoice: { ...invoice, files: [{ title: 'Invoice PDF', fileType: 'PDF', fileVersionId: 'version1' }] } })
    render(<ProformaApprovals leadId="lead1" state={state()} highlightId={null} />)
    expect(screen.queryByRole('button', { name: /View Proforma Invoice|Hide invoice/ })).not.toBeInTheDocument()
    await screen.findByText('Invoice PDF'); expect(screen.queryByRole('link', { name: 'View Invoice PDF' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Invoice PDF' })).toBeInTheDocument()
  })
  it('confirms approval and requires change comments', async () => {
    const data = state()
    render(<ProformaApprovals leadId="lead1" state={data} highlightId={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
    fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    expect(data.submit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: 'Revise total' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(invoice, 'Changes Requested', 'Revise total'))
  })
  it('shows saved comments read-only and blocks duplicate clicks while saving', () => {
    const data = state()
    const view = render(<ProformaApprovals leadId="lead1" state={{ ...data, busy: true }} highlightId={null} />)
    expect(screen.getByRole('button', { name: 'Approve invoice' })).toBeDisabled()
    view.rerender(<ProformaApprovals leadId="lead1" state={{ ...data, result: { success: true, message: '', invoices: [{ ...invoice, status: 'Changes Requested', comments: 'Revise total', canApprove: false, canRequestChanges: false }] } }} highlightId={null} />)
    expect(screen.getByText('Revise total')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve invoice' })).not.toBeInTheDocument()
  })
  it('keeps read invoice notifications without storing tokens', () => {
    const hook = renderHook(({ item }) => useProformaNotifications('invoice-history-lead', { success: true, message: '', invoices: [item] }), { initialProps: { item: invoice } })
    expect(hook.result.current.notifications).toHaveLength(1)
    const id = hook.result.current.notifications[0].id
    act(() => hook.result.current.markRead(id))
    hook.rerender({ item: { ...invoice, status: 'Approved' } })
    expect(hook.result.current.notifications[0].read).toBe(true)
    expect(localStorage.getItem('proformaNotifications:invoice-history-lead')).not.toContain('test-token')
    hook.rerender({ item: invoice })
    expect(hook.result.current.notifications).toHaveLength(1)
    act(() => hook.result.current.dismiss(id))
    hook.rerender({ item: { ...invoice } })
    expect(hook.result.current.notifications).toHaveLength(0)
  })
})
