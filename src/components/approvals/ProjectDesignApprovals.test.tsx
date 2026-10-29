import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ProjectDesignApprovals } from './ProjectDesignApprovals'
import { useDesignNotifications } from './useDesignNotifications'
import type { Design } from '../../services/designApprovalsApi'
const designs: Design[] = [1, 2, 3].map(index => ({ designId: `multi-design-${index}`, opportunityId: `opp-${index}`, opportunityName: `Home ${index}`, designName: `Design ${index}`, status: 'Sent', comments: '', createdDate: '', canApprove: true, canRequestChanges: true, files: [] }))
const result = { success: true, message: '', designs, projects: designs.map(design => ({ id: design.opportunityId, name: design.opportunityName })) }
function state() { return { result, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
it('navigates three projects and submits the selected design only', async () => {
  const data = state()
  render(<ProjectDesignApprovals contactId="contact1" state={data} highlightId={null} />)
  expect(screen.getByRole('heading', { name: 'Design 1' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.queryByRole('heading', { name: 'Design 1' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Approve design' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(designs[1], 'Approved', ''))
  fireEvent.click(screen.getByRole('button', { name: 'Project 3', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
  fireEvent.change(screen.getByLabelText('Comments (required)'), { target: { value: 'Change layout' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(designs[2], 'Changes Requested', 'Change layout'))
})
it('selects the notification project and allows navigation afterward', () => {
  const data = state()
  const view = render(<ProjectDesignApprovals contactId="contact1" state={data} highlightId={null} />)
  view.rerender(<ProjectDesignApprovals contactId="contact1" state={data} highlightId={designs[1].designId} />)
  expect(screen.getByRole('heading', { name: 'Design 2' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Project 1', exact: true }))
  expect(screen.getByRole('heading', { name: 'Design 1' })).toBeInTheDocument()
})
it('shows empty projects and hides navigation for a single project', () => {
  const data = state()
  const view = render(<ProjectDesignApprovals contactId="contact1" state={{ ...data, result: { ...result, designs: [designs[0]] } }} highlightId={null} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project 2', exact: true }))
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  view.rerender(<ProjectDesignApprovals contactId="contact1" state={{ ...data, result: { ...result, designs: [designs[0]], projects: result.projects.slice(0, 1) } }} highlightId={null} />)
  expect(screen.queryByRole('heading', { name: 'Project 1' })).not.toBeInTheDocument()
})
it('notifies for every project independently, including later manager approval', () => {
  const view = renderHook(({ data }) => useDesignNotifications('multi-design-history', data), { initialProps: { data: result } })
  expect(view.result.current.notifications).toHaveLength(3)
  act(() => view.result.current.dismiss('design-approval:' + designs[0].designId))
  act(() => view.result.current.markRead('design-approval:' + designs[1].designId))
  view.rerender({ data: { ...result, designs: designs.map(design => ({ ...design, managerApproval: true })) } })
  expect(view.result.current.notifications).toHaveLength(5)
  expect(view.result.current.notifications.find(entry => entry.id === 'design-approval:' + designs[1].designId)?.read).toBe(true)
  expect(view.result.current.notifications.find(entry => entry.id === 'design-approval:' + designs[2].designId)?.read).toBe(false)
})

it('shows shared navigation for every account project when the design API has no projects or designs', () => {
  const data = { ...state(), result: { success: true, message: '', designs: [] } }
  render(<ProjectDesignApprovals contactId="contact1" projectLeadIds={['lead1', 'lead2', 'lead3']} state={data} highlightId={null} />)
  expect(screen.getByRole('heading', { name: 'Project 1' })).toBeInTheDocument()
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Project 2', exact: true }))
  expect(screen.getByRole('heading', { name: 'Project 2' })).toBeInTheDocument()
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByRole('heading', { name: 'Project 3' })).toBeInTheDocument()
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
})
it('uses every account project for an empty view even when the API returns only one converted project', () => {
  const data = { ...state(), result: { success: true, message: '', designs: [], projects: [{ id: 'opp-1', name: 'Home 1' }] } }
  render(<ProjectDesignApprovals contactId="contact1" projectLeadIds={['lead1', 'lead2']} state={data} highlightId={null} />)
  expect(screen.getByRole('heading', { name: 'Project 1' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Project 2', exact: true })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByRole('heading', { name: 'Project 2' })).toBeInTheDocument()
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Next project' })).toBeDisabled()
})
it('shows all three unconverted projects without a Contact or design API result', () => {
  const data = { ...state(), result: null }
  render(<ProjectDesignApprovals contactId="" projectLeadIds={['lead1', 'lead2', 'lead3']} state={data} highlightId={null} />)
  expect(screen.getByRole('heading', { name: 'Project 1' })).toBeInTheDocument()
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Project 3', exact: true }))
  expect(screen.getByRole('heading', { name: 'Project 3' })).toBeInTheDocument()
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('keeps all Lead tabs when only the second project has converted and received a design', () => {
  const data = { ...state(), result: { ...result, designs: [designs[1]], projects: [result.projects[1]] } }
  const accountProjects = [1, 2, 3].map(index => ({
    success: true, message: '', leadId: 'lead' + index,
    convertedOpportunityId: index === 2 ? designs[1].opportunityId : undefined,
  }))
  const view = render(<ProjectDesignApprovals contactId="contact1" state={data}
    accountProjects={accountProjects} highlightId={null} />)
  expect(screen.getByRole('heading', { name: 'Project 1' })).toBeInTheDocument()
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Project 2', exact: true }))
  expect(screen.getByRole('heading', { name: 'Design 2' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Project 3', exact: true }))
  expect(screen.getByText(/No designs have been sent/)).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Design 2' })).not.toBeInTheDocument()
  view.rerender(<ProjectDesignApprovals contactId="contact1" state={data}
    accountProjects={accountProjects} highlightId={designs[1].designId} />)
  expect(screen.getByRole('heading', { name: 'Project 2' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Design 2' })).toBeInTheDocument()
})
