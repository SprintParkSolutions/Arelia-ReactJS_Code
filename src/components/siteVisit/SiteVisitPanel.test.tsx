import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SiteVisitPanel } from './SiteVisitPanel'
import { useSiteVisitNotifications } from './useSiteVisitNotifications'
const pending = { success: true, message: '', appointmentAvailable: true, actionRequired: true, appointmentStatus: 'Pending', appointmentSentDate: '2030-10-01', appointmentDate: '2030-10-10', appointmentTimeSlot: '9AM-10AM', availableTimeSlots: ['9AM-10AM', '2PM-3PM'] }
function visit() { return { appointment: pending, report: { success: true, message: 'Awaiting management approval', reportAvailable: false }, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
describe('site visit controls', () => {
  it('approves the displayed appointment', async () => {
    const data = visit()
    render(<SiteVisitPanel leadId="lead1" visit={data} />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith('Approved', '', ''))
    expect(await screen.findByRole('status')).toHaveTextContent('Saved')
  })
  it('submits a new date and allowed time slot', async () => {
    const data = visit()
    render(<SiteVisitPanel leadId="lead1" visit={data} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }))
    fireEvent.change(screen.getByLabelText('Preferred date'), { target: { value: '2030-10-11' } })
    fireEvent.change(screen.getByLabelText('Preferred time slot'), { target: { value: '2PM-3PM' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit reschedule request' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith('Rescheduled', '2030-10-11', '2PM-3PM'))
  })
  it('shows requested details read-only after rescheduling', () => {
    const data = visit()
    render(<SiteVisitPanel leadId="lead1" visit={{ ...data, appointment: { ...pending, actionRequired: false, appointmentStatus: 'Rescheduled', requestedDate: '2030-10-11', requestedTimeSlot: '2PM-3PM' } }} />)
    expect(screen.getByText('11 October 2030')).toBeInTheDocument()
    expect(screen.getByText('2PM-3PM')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })
  it('disables response buttons during submission and shows errors without claiming success', async () => {
    const data = visit()
    const view = render(<SiteVisitPanel leadId="lead1" visit={{ ...data, busy: true }} />)
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    data.submit.mockResolvedValue({ success: false, message: 'Please retry' })
    view.rerender(<SiteVisitPanel leadId="lead1" visit={data} />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Please retry')
  })
  it('retains read notifications, adds a new appointment, and isolates leads', () => {
    const hook = renderHook(({ appointment, leadId }) => useSiteVisitNotifications(leadId, appointment), { initialProps: { appointment: pending, leadId: 'history-site-lead' } })
    expect(hook.result.current.notifications).toHaveLength(1)
    const first = hook.result.current.notifications[0].id
    act(() => hook.result.current.markRead(first))
    hook.rerender({ appointment: { ...pending, actionRequired: false }, leadId: 'history-site-lead' })
    expect(hook.result.current.notifications[0].read).toBe(true)
    hook.rerender({ appointment: { ...pending, appointmentDate: '2030-10-12' }, leadId: 'history-site-lead' })
    expect(hook.result.current.notifications).toHaveLength(2)
    act(() => hook.result.current.dismiss(first))
    expect(hook.result.current.notifications).toHaveLength(1)
    hook.rerender({ appointment: { ...pending, actionRequired: false }, leadId: 'other-site-lead' })
    expect(hook.result.current.notifications).toHaveLength(0)
  })
})

it.each([
  { appointmentSentDate: undefined },
  { appointmentDate: undefined },
  { appointmentTimeSlot: ' ' },
  { actionRequired: false },
  { appointmentStatus: 'Approved' },
  { appointmentStatus: 'Rescheduled' },
])('hides response controls and creates no request notification for %j', overrides => {
  const data = visit()
  const appointment = { ...pending, ...overrides }
  render(<SiteVisitPanel leadId="unsent-visit" visit={{ ...data, appointment }} />)
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument()
  const history = renderHook(() => useSiteVisitNotifications('unsent-visit', appointment))
  expect(history.result.current.notifications).toHaveLength(0)
})
it('shows controls when a complete request arrives and hides them after response', () => {
  const data = visit()
  const view = render(<SiteVisitPanel leadId="request-arrives" visit={{ ...data, appointment: { ...pending, appointmentSentDate: undefined } }} />)
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  view.rerender(<SiteVisitPanel leadId="request-arrives" visit={{ ...data, appointment: { ...pending, appointmentStatus: 'Appointment Rescheduled' } }} />)
  expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Reschedule' })).toBeEnabled()
  view.rerender(<SiteVisitPanel leadId="request-arrives" visit={{ ...data, appointment: { ...pending, appointmentStatus: 'Approved', actionRequired: false } }} />)
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument()
})
