import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ProjectSupervisorsPanel } from './ProjectSupervisorsPanel'
import { getSupervisor } from '../../services/supervisorApi'
vi.mock('../../services/supervisorApi', () => ({ getSupervisor: vi.fn() }))
const projects = { success: true, message: '', projects: [
  { success: true, message: '', leadId: '00Q1' },
  { success: true, message: '', leadId: '00Q2' },
] }
const supervisor = { result: { success: true, message: '', assigned: true, supervisorUser: 'First Supervisor' }, retry: vi.fn() }
const reload = vi.fn()
beforeEach(() => vi.clearAllMocks())
it('navigates to the correct supervisor using project arrows and tabs', async () => {
  vi.mocked(getSupervisor).mockResolvedValue({ success: true, message: '', assigned: true, supervisorUser: 'Second Supervisor' })
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={projects} loading={false} reload={reload} supervisor={supervisor} />)
  expect(screen.getByText('First Supervisor')).toBeInTheDocument()
  expect(getSupervisor).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Previous project' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(await screen.findByText('Second Supervisor')).toBeInTheDocument()
  expect(screen.queryByText('First Supervisor')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Next project' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Project 2' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Project 1' }))
  expect(screen.getByText('First Supervisor')).toBeInTheDocument()
  expect(screen.queryByText('Second Supervisor')).not.toBeInTheDocument()
  expect(getSupervisor).toHaveBeenCalledWith('00Q2')
  expect(getSupervisor).not.toHaveBeenCalledWith('00Q1')
})
it('can return to the first supervisor when the second is unassigned', async () => {
  vi.mocked(getSupervisor).mockResolvedValue({ success: true, message: '', assigned: false })
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={projects} loading={false} reload={reload} supervisor={supervisor} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project 2' }))
  expect(await screen.findByText(/A supervisor has not been assigned yet/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Previous project' }))
  expect(screen.getByText('First Supervisor')).toBeInTheDocument()
})
it('retries a failed second project independently', async () => {
  vi.mocked(getSupervisor).mockResolvedValueOnce({ success: false, message: 'Second project unavailable' })
    .mockResolvedValueOnce({ success: true, message: '', assigned: true, supervisorUser: 'Second Supervisor' })
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={projects} loading={false} reload={reload} supervisor={supervisor} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project 2' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Second project unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Second Supervisor')).toBeInTheDocument()
  expect(screen.queryByText('First Supervisor')).not.toBeInTheDocument()
  expect(supervisor.retry).not.toHaveBeenCalled()
})
it('shows project-list failures instead of silently omitting projects', () => {
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={{ success: false, message: 'Cannot load projects' }} loading={false} reload={reload} supervisor={supervisor} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Cannot load projects')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(reload).toHaveBeenCalledOnce()
  expect(getSupervisor).not.toHaveBeenCalled()
})

it('hides project navigation for a single project', () => {
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={{ success: true, message: '' }} loading={false} reload={reload} supervisor={supervisor} />)
  expect(screen.getByText('First Supervisor')).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Choose a project' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Next project' })).not.toBeInTheDocument()
})

it('opens a notification-targeted supervisor and changes targets while already mounted', async () => {
  vi.mocked(getSupervisor).mockResolvedValue({ success: true, message: '', assigned: true, supervisorUser: 'Second Supervisor' })
  const onSelectProject = vi.fn()
  const props = { leadId: '00Q1', projects, loading: false, reload, supervisor, onSelectProject }
  const view = render(<ProjectSupervisorsPanel {...props} selectedLeadId="00Q2" />)
  expect(await screen.findByText('Second Supervisor')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Project 2' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Previous project' }))
  expect(onSelectProject).toHaveBeenCalledWith('00Q1')
  view.rerender(<ProjectSupervisorsPanel {...props} selectedLeadId="00Q1" />)
  expect(screen.getByText('First Supervisor')).toBeInTheDocument()
  view.rerender(<ProjectSupervisorsPanel {...props} selectedLeadId="00Q2" />)
  expect(await screen.findByText('Second Supervisor')).toBeInTheDocument()
})
