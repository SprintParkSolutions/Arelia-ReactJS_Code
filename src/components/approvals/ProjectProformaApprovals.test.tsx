import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProjectProformaApprovals } from './ProjectProformaApprovals'
import { useProformaApprovals } from './useProformaApprovals'
import { useProformaNotifications } from './useProformaNotifications'
import { getProformaInvoices, getProformaInvoice, submitProformaDecision, type Invoice } from '../../services/proformaApi'
vi.mock('../../services/proformaApi', async original => ({ ...await original<typeof import('../../services/proformaApi')>(), getProformaInvoices: vi.fn(), getProformaInvoice: vi.fn(), submitProformaDecision: vi.fn() }))
const ids = ['proforma-first', 'proforma-second', 'proforma-third']
const invoices: Invoice[] = ids.map((leadId, index) => ({ leadId, invoiceId: `multi-invoice-${index}`, name: `PI-${index + 1}`, opportunityId: `opp-${index}`, opportunityName: `Home ${index + 1}`, status: 'Sent', comments: '', secureToken: `token-${index}`, createdDate: '', canApprove: true, canRequestChanges: true, files: [] }))
const result = { success: true, message: '', invoices, projects: ids.map(id => ({ id, success: true, message: '' })) }
function state() { return { result, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getProformaInvoices).mockImplementation(async id => ({ success: true, message: '', invoices: invoices.filter(invoice => invoice.leadId === id) }))
  vi.mocked(getProformaInvoice).mockImplementation(async (_, invoice) => ({ success: true, message: '', invoice }))
  vi.mocked(submitProformaDecision).mockResolvedValue({ success: true, message: 'Saved', conflict: false })
})
afterEach(() => vi.useRealTimers())
it('navigates three projects and approves or requests changes for the selected invoice', async () => {
  const data = state()
  render(<ProjectProformaApprovals leadId={ids[0]} state={data} highlightId={null} onProjectChange={() => {}} />)
  await screen.findByRole('heading', { name: 'PI-1' })
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(await screen.findByRole('heading', { name: 'PI-2' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'PI-1' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Approve invoice' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(invoices[1], 'Approved', ''))
  fireEvent.click(screen.getByRole('button', { name: 'Project 3', exact: true }))
  await screen.findByRole('heading', { name: 'PI-3' })
  fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
  fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: 'Revise amount' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(invoices[2], 'Changes Requested', 'Revise amount'))
})
it('opens the notification project and shows project-specific failures', async () => {
  const data = state()
  const view = render(<ProjectProformaApprovals leadId={ids[0]} state={data} highlightId={invoices[1].invoiceId} onProjectChange={() => {}} />)
  expect(await screen.findByRole('heading', { name: 'PI-2' })).toBeInTheDocument()
  view.rerender(<ProjectProformaApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects.map(project => project.id === ids[1] ? { ...project, success: false, message: 'Second project unavailable' } : project) } }} highlightId={invoices[1].invoiceId} onProjectChange={() => {}} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Second project unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(data.retry).toHaveBeenCalledOnce()
})
it('hides navigation for a single project and keeps empty projects selectable', async () => {
  const data = state()
  const view = render(<ProjectProformaApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects.slice(0, 1), invoices: invoices.slice(0, 1) } }} highlightId={null} onProjectChange={() => {}} />)
  expect(screen.queryByRole('heading', { name: 'Project 1' })).not.toBeInTheDocument()
  view.rerender(<ProjectProformaApprovals leadId={ids[0]} state={{ ...data, result: { ...result, invoices: invoices.slice(0, 1) } }} highlightId={null} onProjectChange={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project 2', exact: true }))
  expect(screen.getByText(/No Proforma Invoices have been sent/)).toBeInTheDocument()
})
it('polls all projects, discovers new ones, and keeps notification histories separate', async () => {
  vi.useFakeTimers()
  const view = renderHook(({ count }) => {
    const approvals = useProformaApprovals(ids[0], ids.slice(0, count))
    return { approvals, history: useProformaNotifications('multi-proforma-history', approvals.result) }
  }, { initialProps: { count: 2 } })
  await act(async () => {})
  expect(view.result.current.history.notifications).toHaveLength(2)
  act(() => view.result.current.history.dismiss('proforma-approval:' + invoices[0].invoiceId))
  await act(async () => vi.advanceTimersByTime(30000))
  expect(getProformaInvoices).toHaveBeenCalledTimes(4)
  expect(view.result.current.history.notifications[0].invoiceId).toBe(invoices[1].invoiceId)
  view.rerender({ count: 3 })
  await act(async () => {})
  expect(view.result.current.history.notifications).toHaveLength(2)
  expect(view.result.current.approvals.result?.projects).toHaveLength(3)
  view.unmount()
  const calls = vi.mocked(getProformaInvoices).mock.calls.length
  await act(async () => vi.advanceTimersByTime(60000))
  expect(getProformaInvoices).toHaveBeenCalledTimes(calls)
})
