import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { ProjectSiteVisitCarousel } from './ProjectSiteVisitCarousel'
import { useProjectSiteVisits } from './useProjectSiteVisits'
import { useProjectSiteVisitNotifications } from './useSiteVisitNotifications'
import { getSiteVisit, getSiteVisitReport, respondToSiteVisit } from '../../services/siteVisitApi'
vi.mock('../../services/siteVisitApi', () => ({ getSiteVisit: vi.fn(), getSiteVisitReport: vi.fn(), respondToSiteVisit: vi.fn() }))
const projectIds = ['carousel-one', 'carousel-two', 'carousel-three']
const projects = { success: true, message: '', projects: projectIds.map(leadId => ({ success: true, message: '', leadId })) }
const appointment = (leadId: string) => ({ success: true, message: '', leadId, appointmentAvailable: true, actionRequired: true,
  appointmentSentDate: '2030-10-01', appointmentDate: '2030-10-10', appointmentTimeSlot: '9AM-10AM', appointmentStatus: 'Pending', availableTimeSlots: ['9AM-10AM', '2PM-3PM'], siteLocation: `Site ${leadId}` })
const report = (leadId: string) => ({ success: true, message: '', reportAvailable: true, report: { leadId, reportId: `report-${leadId}`, reportName: `Report ${leadId}`, finalSubmitted: true, managementApproval: true } })
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSiteVisit).mockImplementation(async id => appointment(id))
  vi.mocked(getSiteVisitReport).mockImplementation(async id => report(id))
  vi.mocked(respondToSiteVisit).mockImplementation(async (id, response) => ({ ...appointment(id), actionRequired: false, appointmentStatus: response }))
})
afterEach(() => vi.useRealTimers())
function Harness() {
  const visits = useProjectSiteVisits(projectIds[0], projects)
  const [selected, select] = useState<string>()
  const history = useProjectSiteVisitNotifications(visits)
  return <><ProjectSiteVisitCarousel visits={visits} selectedLeadId={selected} onSelect={select} loading={false} retry={() => {}} />
    {history.notifications.map(item => <button key={item.id} onClick={() => { history.markRead(item.id); select(item.siteVisitLeadId) }}>{item.message}</button>)}
  </>
}
it('shows three projects and submits responses using the selected project Lead ID', async () => {
  render(<Harness />)
  expect(await screen.findByText('Site carousel-one')).toBeInTheDocument()
  expect(screen.getByText('Report carousel-one')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Previous project' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(await screen.findByText('Site carousel-two')).toBeInTheDocument()
  expect(screen.getByText('Report carousel-two')).toBeInTheDocument()
  expect(screen.queryByText('Report carousel-one')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
  await waitFor(() => expect(respondToSiteVisit).toHaveBeenCalledWith('carousel-two', 'Approved', '', ''))
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByRole('button', { name: 'Next project' })).toBeDisabled()
  expect(await screen.findByText('Site carousel-three')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }))
  fireEvent.change(screen.getByLabelText('Preferred date'), { target: { value: '2030-10-11' } })
  fireEvent.change(screen.getByLabelText('Preferred time slot'), { target: { value: '2PM-3PM' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit reschedule request' }))
  await waitFor(() => expect(respondToSiteVisit).toHaveBeenCalledWith('carousel-three', 'Rescheduled', '2030-10-11', '2PM-3PM'))
  fireEvent.click(screen.getByRole('button', { name: 'Project 1', exact: true }))
  expect(screen.getByText('Report carousel-one')).toBeInTheDocument()
})
it('opens the second slide from its report notification', async () => {
  render(<Harness />)
  fireEvent.click(await screen.findByRole('button', { name: 'Project 2: Your site visit report has been approved by the Arelia Team and is ready to view.' }))
  expect(screen.getByText('Report carousel-two')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Project 2' })).toBeInTheDocument()
})
it('keeps identical appointment notifications separate and preserves per-project dismissal', () => {
  const visits = ['history-carousel-one', 'history-carousel-two', 'history-carousel-three'].map(leadId => ({ leadId, appointment: appointment(leadId), report: report(leadId) }))
  const view = renderHook(() => useProjectSiteVisitNotifications(visits))
  expect(view.result.current.notifications).toHaveLength(6)
  expect(new Set(view.result.current.notifications.map(item => item.id)).size).toBe(6)
  const second = view.result.current.notifications.find(item => item.siteVisitLeadId === 'history-carousel-two' && item.message.includes('requested'))!
  act(() => view.result.current.dismiss(second.id))
  expect(view.result.current.notifications).toHaveLength(5)
  expect(view.result.current.notifications.filter(item => item.siteVisitLeadId !== 'history-carousel-two').every(item => !item.read)).toBe(true)
  view.unmount()
  const restored = renderHook(() => useProjectSiteVisitNotifications(visits))
  expect(restored.result.current.notifications).toHaveLength(5)
  act(() => restored.result.current.markAllRead())
  expect(restored.result.current.notifications.every(item => item.read)).toBe(true)
})
it('polls all projects outside the carousel, discovers new projects and cleans up', async () => {
  vi.useFakeTimers()
  const view = renderHook(({ count }) => useProjectSiteVisits(projectIds[0], { ...projects, projects: projects.projects.slice(0, count) }), { initialProps: { count: 2 } })
  await act(async () => {})
  expect(getSiteVisit).toHaveBeenCalledTimes(2)
  await act(async () => vi.advanceTimersByTime(30_000))
  expect(getSiteVisit).toHaveBeenCalledTimes(4)
  view.rerender({ count: 3 })
  await act(async () => {})
  expect(view.result.current).toHaveLength(3)
  expect(view.result.current[2].appointment?.leadId).toBe('carousel-three')
  await act(async () => window.dispatchEvent(new Event('focus')))
  expect(getSiteVisit).toHaveBeenCalledTimes(10)
  view.unmount()
  await act(async () => vi.advanceTimersByTime(60_000))
  expect(getSiteVisit).toHaveBeenCalledTimes(10)
})
it('isolates an appointment failure from other projects and still loads its report', async () => {
  vi.mocked(getSiteVisit).mockImplementation(async id => id === 'carousel-two' ? { success: false, message: 'Unavailable' } : appointment(id))
  const { result } = renderHook(() => useProjectSiteVisits(projectIds[0], projects))
  await waitFor(() => expect(result.current[1].appointment?.success).toBe(false))
  expect(result.current[0].appointment?.success).toBe(true)
  expect(result.current[2].appointment?.success).toBe(true)
  expect(result.current[1].report?.reportAvailable).toBe(true)
})

it('blocks duplicate responses and discards a poll started before approval', async () => {
  vi.useFakeTimers()
  const view = renderHook(() => useProjectSiteVisits('race-visit'))
  await act(async () => {})
  let finishPoll!: (value: Awaited<ReturnType<typeof getSiteVisit>>) => void
  vi.mocked(getSiteVisit).mockImplementationOnce(() => new Promise(resolve => { finishPoll = resolve }))
  await act(async () => vi.advanceTimersByTime(30_000))
  let finishSave!: (value: Awaited<ReturnType<typeof respondToSiteVisit>>) => void
  vi.mocked(respondToSiteVisit).mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve }))
  let save!: Promise<Awaited<ReturnType<typeof respondToSiteVisit>>>
  act(() => { save = view.result.current[0].submit('Approved') })
  await act(async () => { await view.result.current[0].submit('Approved') })
  expect(respondToSiteVisit).toHaveBeenCalledTimes(1)
  const approved = { ...appointment('race-visit'), appointmentStatus: 'Approved', actionRequired: false }
  vi.mocked(getSiteVisit).mockResolvedValue(approved)
  await act(async () => { finishSave(approved); await save })
  expect(view.result.current[0].appointment?.appointmentStatus).toBe('Approved')
  await act(async () => finishPoll(appointment('race-visit')))
  expect(view.result.current[0].appointment?.appointmentStatus).toBe('Approved')
  expect(view.result.current[0].busy).toBe(false)
})
