import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProjectBudgetReviewApprovals } from './ProjectBudgetReviewApprovals'
import { useBudgetReview } from './useBudgetReview'
import { useBudgetNotifications } from './useBudgetNotifications'
import { getBudgetReview, type BudgetReview, type BudgetResult } from '../../services/budgetReviewApi'
vi.mock('../../services/budgetReviewApi', async original => ({ ...await original<typeof import('../../services/budgetReviewApi')>(), getBudgetReview: vi.fn() }))
const ids = ['budget-first', 'budget-second', 'budget-third']
const budgets: BudgetReview[] = ids.map((leadId, index) => ({ leadId, opportunityId: `multi-budget-${index}`, opportunityName: `Home ${index + 1}`, status: 'Sent for Client Approval', customerBudget: 100000, supervisorBudget: 120000, estimatedDuration: '3', clientRemarks: '', canRespond: true }))
const result: BudgetResult = { success: true, message: '', budget: null, projects: ids.map((id, index) => ({ id, result: { success: true, message: '', budget: budgets[index] } })) }
function state() { return { result, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getBudgetReview).mockImplementation(async id => ({ success: true, message: '', budget: budgets.find(budget => budget.leadId === id) || null })) })
afterEach(() => vi.useRealTimers())
it('navigates three projects and responds to the selected budget', async () => {
  const data = state()
  render(<ProjectBudgetReviewApprovals leadId={ids[0]} state={data} highlightId={null} onProjectChange={() => {}} />)
  expect(screen.getByText('Home 1')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByText('Home 2')).toBeInTheDocument()
  expect(screen.queryByText('Home 1')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Approve budget' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(budgets[1], 'Client Approved', ''))
  fireEvent.click(screen.getByRole('button', { name: 'Project 3', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
  fireEvent.change(screen.getByLabelText('Client comments (required)'), { target: { value: 'Revise estimate' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
  await waitFor(() => expect(data.submit).toHaveBeenCalledWith(budgets[2], 'Client Requested Changes', 'Revise estimate'))
})
it('opens the project targeted by a notification and retains project-specific error states', () => {
  const data = state()
  const view = render(<ProjectBudgetReviewApprovals leadId={ids[0]} state={data} highlightId={budgets[1].opportunityId} onProjectChange={() => {}} />)
  expect(screen.getByText('Home 2')).toBeInTheDocument()
  view.rerender(<ProjectBudgetReviewApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects!.map(project => project.id === ids[1] ? { ...project, result: { ...project.result, success: false, message: 'Budget unavailable' } } : project) } }} highlightId={budgets[1].opportunityId} onProjectChange={() => {}} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Budget unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(data.retry).toHaveBeenCalledOnce()
})
it('hides navigation for one project and shows an empty budget for unsent projects', () => {
  const data = state()
  const view = render(<ProjectBudgetReviewApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects!.slice(0, 1) } }} highlightId={null} onProjectChange={() => {}} />)
  expect(screen.queryByRole('heading', { name: 'Project 1' })).not.toBeInTheDocument()
  view.rerender(<ProjectBudgetReviewApprovals leadId={ids[0]} state={{ ...data, result: { ...result, projects: result.projects!.map(project => ({ ...project, result: { success: true, message: '', budget: null } })) } }} highlightId={null} onProjectChange={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project 2', exact: true }))
  expect(screen.getByText(/No Budget Review has been sent/)).toBeInTheDocument()
})
it('polls all projects, discovers additional projects and stops on unmount', async () => {
  vi.useFakeTimers()
  const view = renderHook(({ count }) => useBudgetReview(ids[0], ids.slice(0, count)), { initialProps: { count: 2 } })
  await act(async () => {})
  expect(view.result.current.result?.projects).toHaveLength(2)
  await act(async () => vi.advanceTimersByTime(30000))
  expect(getBudgetReview).toHaveBeenCalledTimes(4)
  view.rerender({ count: 3 })
  await act(async () => {})
  expect(view.result.current.result?.projects).toHaveLength(3)
  view.unmount()
  await act(async () => vi.advanceTimersByTime(60000))
  expect(getBudgetReview).toHaveBeenCalledTimes(7)
})
it('keeps read history independent and notifies for resent and manager-approved budgets', () => {
  const view = renderHook(({ value }) => useBudgetNotifications('multi-budget-history', value), { initialProps: { value: result } })
  expect(view.result.current.notifications).toHaveLength(3)
  const first = view.result.current.notifications.find(item => item.budgetOpportunityId === budgets[0].opportunityId)!
  act(() => view.result.current.dismiss(first.id))
  const changed = { ...result, projects: result.projects!.map((project, index) => ({ ...project, result: { ...project.result, budget: { ...budgets[index], status: index === 1 ? 'Client Requested Changes' : 'Manager Approved' } } })) }
  view.rerender({ value: changed })
  expect(view.result.current.notifications.filter(item => item.id.startsWith('budget-approval:manager:'))).toHaveLength(2)
  view.rerender({ value: result })
  expect(view.result.current.notifications.filter(item => item.budgetOpportunityId === budgets[1].opportunityId)).toHaveLength(2)
  expect(view.result.current.notifications.some(item => item.id === first.id)).toBe(false)
})
