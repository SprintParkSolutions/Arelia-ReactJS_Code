import { Blob as NodeBlob } from 'node:buffer'
import { utils, write } from 'xlsx'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProformaApprovals } from './ProformaApprovals'
import { useProformaNotifications } from './useProformaNotifications'
import { getProformaInvoice, type Invoice } from '../../services/proformaApi'
vi.mock('../../services/proformaApi', async importOriginal => ({ ...await importOriginal<typeof import('../../services/proformaApi')>(), getProformaInvoice: vi.fn() }))
afterEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
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
  it("shows What's next only after the manager approves a client-approved invoice", async () => {
    const approved = { ...invoice, status: 'Approved', managerApproval: false }
    const data = state()
    vi.mocked(getProformaInvoice).mockImplementation(async (_, item) => ({ success: true, message: '', invoice: item }))
    const approvals = (managerApproval: boolean) => ({
      ...data, result: { ...data.result, invoices: [{ ...approved, managerApproval }] },
    })
    const view = render(<ProformaApprovals leadId="lead1" state={approvals(false)} highlightId={null} />)
    expect(screen.getByText('Invoice approved')).toBeInTheDocument()
    expect(screen.queryByText("What's next?")).not.toBeInTheDocument()
    expect(screen.getByText('Current stage').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()

    view.rerender(<ProformaApprovals leadId="lead1" state={approvals(true)} highlightId={null} />)
    expect(screen.getByText("What's next?")).toBeInTheDocument()
    expect(screen.getByText('Completed').closest('li')).toHaveTextContent('Proforma Invoice')
    expect(screen.getByText('Completed').closest('li')).not.toHaveAttribute('aria-current')
    await screen.findByText('No invoice files have been attached yet.')
  })

  it('switches invoice references and opens the invoice selected by a notification', async () => {
    const approved = { ...invoice, name: 'PI-0007', status: 'Approved' }
    const changed = { ...invoice, invoiceId: 'invoice2', name: 'PI-0004', status: 'Changes Requested' }
    const data = { ...state(), result: { success: true, message: '', invoices: [approved, changed] } }
    vi.mocked(getProformaInvoice).mockImplementation(async (_, item) => ({ success: true, message: '', invoice: item }))

    const view = render(<ProformaApprovals leadId="lead1" state={data} highlightId={null} />)
    expect(screen.getByRole('button', { name: 'PI-0007 Approved' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'PI-0004 Changes Requested' }))
    expect(screen.queryByRole('heading', { name: 'PI-0007' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'PI-0004' })).toBeInTheDocument()

    view.rerender(<ProformaApprovals leadId="lead1" state={data} highlightId={approved.invoiceId} />)
    expect(screen.getByRole('button', { name: 'PI-0007 Approved' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('No invoice files have been attached yet.')).toBeInTheDocument()
    expect(vi.mocked(getProformaInvoice)).toHaveBeenLastCalledWith('lead1', approved)
  })

  it('shows document rows with collapsed previews and can switch from PDF to image', async () => {
    const files = [
      { title: 'Invoice PDF', fileType: 'PDF', fileVersionId: 'pdf' },
      { title: 'Invoice image', fileType: 'JPEG', fileVersionId: 'image' },
    ]
    vi.mocked(getProformaInvoice).mockResolvedValue({ success: true, message: '', invoice: { ...invoice, files } })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new NodeBlob(['%PDF-1.7']) })))
    const NativeURL = URL
    vi.stubGlobal('URL', class extends NativeURL {
      static createObjectURL = vi.fn().mockReturnValueOnce('blob:invoice-pdf').mockReturnValueOnce('blob:invoice-image')
      static revokeObjectURL = vi.fn()
    })
    vi.spyOn(window, 'navigator', 'get').mockReturnValue({ pdfViewerEnabled: true } as Navigator)

    render(<ProformaApprovals leadId="lead1" state={state()} highlightId={null} />)
    expect(await screen.findByRole('heading', { name: 'Documents (2)' })).toBeInTheDocument()
    expect(screen.queryByTitle('Invoice PDF PDF preview')).not.toBeInTheDocument()
    const pdfPreview = screen.getByRole('button', { name: 'Preview PDF Invoice PDF' })
    expect(pdfPreview).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(pdfPreview)
    expect(await screen.findByTitle('Invoice PDF PDF preview')).toHaveAttribute('src', 'blob:invoice-pdf')
    expect(screen.getByRole('button', { name: 'Download Invoice PDF' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Preview image Invoice image' }))
    expect(await screen.findByRole('img', { name: 'Invoice image' })).toHaveAttribute('src', 'blob:invoice-image')
    expect(screen.queryByTitle('Invoice PDF PDF preview')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Invoice image' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Hide preview Invoice image' }))
    expect(screen.queryByRole('img', { name: 'Invoice image' })).not.toBeInTheDocument()
  })

  it.each([['EXCEL_X', 'xlsx'], ['EXCEL', 'xls']] as const)('previews %s workbooks and switches worksheets', async (fileType, bookType) => {
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([['Invoice line', 1000]]), 'Summary')
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([['Material', 'Oak']]), 'Details')
    const buffer = write(workbook, { type: 'array', bookType }) as ArrayBuffer
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => buffer })))
    vi.mocked(getProformaInvoice).mockResolvedValue({ success: true, message: '', invoice: { ...invoice,
      files: [{ title: 'Invoice workbook', fileType, fileVersionId: 'workbook' }],
    } })

    render(<ProformaApprovals leadId="lead1" state={state()} highlightId={null} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Preview Excel Invoice workbook' }))
    expect(await screen.findByRole('cell', { name: 'Invoice line' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Worksheet'), { target: { value: 'Details' } })
    expect(screen.getByRole('cell', { name: 'Oak' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Invoice workbook' })).toBeEnabled()
  })
  it('offers a preview for CSV and preserves quoted values and leading zeroes', async () => {
    const csv = new TextEncoder().encode('Code,Description\r\n001,"Materials, delivery"\r\n')
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => csv.buffer })))
    vi.mocked(getProformaInvoice).mockResolvedValue({ success: true, message: '', invoice: { ...invoice,
      files: [{ title: 'Invoice CSV', fileType: 'CSV', fileVersionId: 'csv' }],
    } })
    render(<ProformaApprovals leadId="lead1" state={state()} highlightId={null} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Preview CSV Invoice CSV' }))
    expect(await screen.findByRole('cell', { name: '001' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Materials, delivery' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Invoice CSV' })).toBeEnabled()
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
