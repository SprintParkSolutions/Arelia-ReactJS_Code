import { fireEvent, render, screen, within } from '@testing-library/react'
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
it('shows the correct supervisor under each project heading', async () => {
  vi.mocked(getSupervisor).mockResolvedValue({ success: true, message: '', assigned: true, supervisorUser: 'Second Supervisor' })
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={projects} loading={false} reload={reload} supervisor={supervisor} />)
  await screen.findByText('Second Supervisor')
  expect(within(screen.getByRole('heading', { name: 'Project 1' }).parentElement!).getByText('First Supervisor')).toBeInTheDocument()
  expect(within(screen.getByRole('heading', { name: 'Project 2' }).parentElement!).getByText('Second Supervisor')).toBeInTheDocument()
  expect(getSupervisor).toHaveBeenCalledWith('00Q2')
  expect(getSupervisor).not.toHaveBeenCalledWith('00Q1')
})
it('keeps the first supervisor visible when the second is unassigned', async () => {
  vi.mocked(getSupervisor).mockResolvedValue({ success: true, message: '', assigned: false })
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={projects} loading={false} reload={reload} supervisor={supervisor} />)
  expect(await screen.findByText(/A supervisor has not been assigned yet/)).toBeInTheDocument()
  expect(screen.getByText('First Supervisor')).toBeInTheDocument()
})
it('retries a failed second project independently', async () => {
  vi.mocked(getSupervisor).mockResolvedValueOnce({ success: false, message: 'Second project unavailable' })
    .mockResolvedValueOnce({ success: true, message: '', assigned: true, supervisorUser: 'Second Supervisor' })
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={projects} loading={false} reload={reload} supervisor={supervisor} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Second project unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Second Supervisor')).toBeInTheDocument()
  expect(screen.getByText('First Supervisor')).toBeInTheDocument()
  expect(supervisor.retry).not.toHaveBeenCalled()
})
it('shows project-list failures instead of silently omitting projects', () => {
  render(<ProjectSupervisorsPanel leadId="00Q1" projects={{ success: false, message: 'Cannot load projects' }} loading={false} reload={reload} supervisor={supervisor} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Cannot load projects')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(reload).toHaveBeenCalledOnce()
  expect(getSupervisor).not.toHaveBeenCalled()
})
