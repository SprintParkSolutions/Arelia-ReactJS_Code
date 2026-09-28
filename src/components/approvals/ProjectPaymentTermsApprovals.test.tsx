import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProjectPaymentTermsApprovals } from './ProjectPaymentTermsApprovals'
import { usePaymentReview } from './usePaymentReview'
import { usePaymentNotifications } from './usePaymentNotifications'
import { getPaymentReview, type PaymentReview, type PaymentResult } from '../../services/paymentTermsApi'
vi.mock('../../services/paymentTermsApi', async original => ({ ...await original<typeof import('../../services/paymentTermsApi')>(), getPaymentReview: vi.fn() }))
const ids = ['payment-first', 'payment-second', 'payment-third']
const payments: PaymentReview[] = ids.map((leadId, index) => ({ leadId, opportunityId: `multi-payment-${index}`, opportunityName: `Home ${index + 1}`, status: 'Sent for Client Approval', terms: [{ id: `term-${index}`, label: `Stage ${index + 1}`, percentage: 25, dueDate: '2030-10-01' }], clientRemarks: '', canRespond: true }))
const result: PaymentResult = { success: true, message: '', payment: null, projects: ids.map((id, index) => ({ id, result: { success: true, message: '', payment: payments[index] } })) }
function state() { return { result, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getPaymentReview).mockImplementation(async id => ({ success: true, message: '', payment: payments.find(payment => payment.leadId === id) || null })) })
afterEach(() => vi.useRealTimers())
it('navigates three projects and responds to the selected payment', async () => {
  const data = state()
  render(<ProjectPaymentTermsApprovals leadId={ids[0]} state={data} highlightId={null} onProjectChange={() => {}} />)
  expect(screen.getByText('Home 1')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByText('Home 2')).toBeInTheDocument()
  expect(screen.queryByText('Home 1')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Approve payment terms' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(payments[1], 'Client Approved', ''))
  fireEvent.click(screen.getByRole('button', { name: 'Project 3', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
  fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: 'Revise estimate' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(payments[2], 'Client Requested Changes', 'Revise estimate'))
})
it('opens the project targeted by a notification and retains project-specific error states', () => {
  const data = state()
  const view = render(<ProjectPaymentTermsApprovals leadId={ids[0]} state={data} highlightId={payments[1].opportunityId} onProjectChange={() => {}} />)
  expect(screen.getByText('Home 2')).toBeInTheDocument()
  view.rerender(<ProjectPaymentTermsApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects!.map(project => project.id === ids[1] ? { ...project, result: { ...project.result, success: false, message: 'Payment unavailable' } } : project) } }} highlightId={payments[1].opportunityId} onProjectChange={() => {}} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Payment unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(data.retry).toHaveBeenCalledOnce()
})
it('hides navigation for one project and shows an empty payment for unsent projects', () => {
  const data = state()
  const view = render(<ProjectPaymentTermsApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects!.slice(0, 1) } }} highlightId={null} onProjectChange={() => {}} />)
  expect(screen.queryByRole('heading', { name: 'Project 1' })).not.toBeInTheDocument()
  view.rerender(<ProjectPaymentTermsApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects!.map(project => ({ ...project, result: { success: true, message: '', payment: null } })) } }} highlightId={null} onProjectChange={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project 2', exact: true }))
  expect(screen.getByText(/No Payment Terms have been sent/)).toBeInTheDocument()
})
it('polls all projects, discovers additional projects and stops on unmount', async () => {
  vi.useFakeTimers()
  const view = renderHook(({ count }) => usePaymentReview(ids[0], ids.slice(0, count)), { initialProps: { count: 2 } })
  await act(async () => {})
  expect(view.result.current.result?.projects).toHaveLength(2)
  await act(async () => vi.advanceTimersByTime(30000))
  expect(getPaymentReview).toHaveBeenCalledTimes(4)
  view.rerender({ count: 3 })
  await act(async () => {})
  expect(view.result.current.result?.projects).toHaveLength(3)
  view.unmount()
  await act(async () => vi.advanceTimersByTime(60000))
  expect(getPaymentReview).toHaveBeenCalledTimes(7)
})
it('tracks notifications independently and creates a new notification for resent terms', () => {
  const view = renderHook(({ value }) => usePaymentNotifications('multi-payment-history', value), { initialProps: { value: result } })
  expect(view.result.current.notifications).toHaveLength(3)
  const first = view.result.current.notifications.find(item => item.paymentOpportunityId === payments[0].opportunityId)!
  act(() => view.result.current.dismiss(first.id))
  const second = view.result.current.notifications.find(item => item.paymentOpportunityId === payments[1].opportunityId)!
  act(() => view.result.current.markRead(second.id))
  const changed = { ...result, projects: result.projects!.map((project, index) => ({ ...project, result: { ...project.result, payment: { ...payments[index], status: index === 1 ? 'Client Requested Changes' : payments[index].status } } })) }
  view.rerender({ value: changed })
  view.rerender({ value: result })
  expect(view.result.current.notifications.filter(item => item.paymentOpportunityId === payments[1].opportunityId)).toHaveLength(2)
  expect(view.result.current.notifications.find(item => item.id === second.id)?.read).toBe(true)
  expect(view.result.current.notifications.some(item => item.id === first.id)).toBe(false)
  act(() => view.result.current.markAllRead())
  expect(view.result.current.notifications.every(item => item.read)).toBe(true)
  view.unmount()
  const restored = renderHook(() => usePaymentNotifications('multi-payment-history', result))
  expect(restored.result.current.notifications).toHaveLength(3)
  expect(restored.result.current.notifications.every(item => item.read)).toBe(true)
})
