import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Login } from './Login'
import { loginClient } from '../api'
import { loginProspect } from '../services/salesforceApi'

vi.mock('../api', () => ({
  loginClient: vi.fn(),
  confirmPasswordReset: vi.fn(),
  requestPasswordResetOtp: vi.fn(),
  verifyPasswordResetOtp: vi.fn(),
}))
vi.mock('../services/salesforceApi', () => ({ loginProspect: vi.fn() }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), isAuthenticated: false }),
}))
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.mocked(loginProspect).mockResolvedValue({ success: false, message: 'Invalid credentials.' })
  vi.mocked(loginClient).mockResolvedValue({ success: false, message: 'Invalid credentials.' })
})
function setup(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Login /></MemoryRouter>)
}
function submit() {
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'hello@example.com' } })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'Example1!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enter Portal' }))
}
describe('login entry points', () => {
  it.each(['/login', '/login?account=prospect'])('uses Lead authentication from %s', async path => {
    setup(path); submit()
    await waitFor(() => expect(loginProspect).toHaveBeenCalledWith('hello@example.com', 'Example1!'))
    expect(loginClient).not.toHaveBeenCalled()
  })
  it('preserves explicit client portal authentication', async () => {
    setup('/login?account=client'); submit()
    await waitFor(() => expect(loginClient).toHaveBeenCalledWith('hello@example.com', 'Example1!'))
    expect(loginProspect).not.toHaveBeenCalled()
  })
  it('lets users switch to client portal authentication', async () => {
    setup('/login')
    fireEvent.click(screen.getByRole('button', { name: 'Client portal sign in' }))
    submit()
    await waitFor(() => expect(loginClient).toHaveBeenCalledOnce())
    expect(loginProspect).not.toHaveBeenCalled()
  })
})