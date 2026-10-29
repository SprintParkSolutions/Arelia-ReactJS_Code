import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ProjectDetailsPanel } from './ProjectDetailsPanel'
import { requestProjectDetails, type ProjectDetailsResult } from '../../services/projectDetailsApi'
vi.mock('../../services/projectDetailsApi', () => ({ requestProjectDetails: vi.fn() }))
const details = { siteSpace: '1200', typeOfProject: 'Home', projectScope: 'Kitchen', planLevel: 'Standard', customerBudget: '50000', siteLocation: 'First site', projectDescription: 'First brief' }
const result: ProjectDetailsResult = { success: true, message: '', projectSubmitted: true, details,
  projects: [
    { success: true, message: '', leadId: '00Q123', projectSubmitted: true, details },
    { success: true, message: '', leadId: '00Q456', projectSubmitted: true, details: { ...details, siteLocation: 'Second site' } },
  ],
}
const onSaved = vi.fn()
const onCancel = vi.fn()
const reload = vi.fn()
beforeEach(() => vi.clearAllMocks())
it('navigates saved briefs with the shared project tabs and arrows', () => {
  render(<ProjectDetailsPanel leadId="00Q123" result={result} addingProject={false} onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  expect(screen.getByText('First site')).toBeInTheDocument()
  expect(screen.queryByText('Second site')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Previous project' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByText('Second site')).toBeInTheDocument()
  expect(screen.queryByText('First site')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Next project' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Project 2' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Project 1' }))
  expect(screen.getByText('First site')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  fireEvent.click(screen.getByRole('button', { name: 'Previous project' }))
  expect(screen.getByText('First site')).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
it('opens a blank form and creates a new project only on submission', async () => {
  vi.mocked(requestProjectDetails).mockResolvedValue({ success: true, message: '', leadId: '00Q789', projectSubmitted: true, details })
  render(<ProjectDetailsPanel leadId="00Q123" result={result} addingProject onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  expect(requestProjectDetails).not.toHaveBeenCalled()
  const labels = ['Site Space', 'Type of Project', 'Project Scope', 'Plan Level', 'Customer Budget', 'Site Location', 'Project Description']
  labels.forEach((label, index) => {
    expect(screen.getByLabelText(label)).toHaveValue('')
    fireEvent.change(screen.getByLabelText(label), { target: { value: Object.values(details)[index] } })
  })
  fireEvent.click(screen.getByRole('button', { name: 'Submit Project Details' }))
  await act(async () => {})
  expect(requestProjectDetails).toHaveBeenCalledWith('00Q123', details, true)
  expect(onSaved).toHaveBeenCalledOnce()
})
it('can return to existing projects without creating a lead', () => {
  render(<ProjectDetailsPanel leadId="00Q123" result={result} addingProject onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  fireEvent.click(screen.getByRole('button', { name: 'Back to projects' }))
  expect(onCancel).toHaveBeenCalledOnce()
  expect(requestProjectDetails).not.toHaveBeenCalled()
})

it('updates the existing lead when its first project is incomplete even if add mode was requested', async () => {
  const incomplete = { ...result, projectSubmitted: false, projects: undefined }
  vi.mocked(requestProjectDetails).mockResolvedValue({ ...incomplete, projectSubmitted: true })
  render(<ProjectDetailsPanel leadId="00Q123" result={incomplete} addingProject onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  expect(screen.getByLabelText('Site Location')).toHaveValue('First site')
  expect(screen.queryByRole('button', { name: 'Back to projects' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Submit Project Details' }))
  await act(async () => {})
  expect(requestProjectDetails).toHaveBeenCalledWith('00Q123', details)
  expect(onSaved).toHaveBeenCalledOnce()
})

it('hides project navigation for a single project', () => {
  render(<ProjectDetailsPanel leadId="00Q123" result={{ ...result, projects: undefined }} addingProject={false} onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  expect(screen.getByText('First site')).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Choose a project' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Next project' })).not.toBeInTheDocument()
})


it('opens the project targeted by a notification and responds to another target while mounted', () => {
  const onSelectProject = vi.fn()
  const props = { leadId: '00Q123', result, addingProject: false, onSaved, onCancel, reload, onSelectProject }
  const view = render(<ProjectDetailsPanel {...props} selectedLeadId="00Q456" />)
  expect(screen.getByText('Second site')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Project 2' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Previous project' }))
  expect(onSelectProject).toHaveBeenCalledWith('00Q123')
  view.rerender(<ProjectDetailsPanel {...props} selectedLeadId="00Q123" />)
  expect(screen.getByText('First site')).toBeInTheDocument()
  view.rerender(<ProjectDetailsPanel {...props} selectedLeadId="00Q456" />)
  expect(screen.getByText('Second site')).toBeInTheDocument()
})