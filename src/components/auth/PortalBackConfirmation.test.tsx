import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { useAuth } from '../../context/AuthContext'
import { dashboardTabs } from '../../constants/dashboardTabs'
import { dashboardSectionPath, readDashboardSection } from '../../utils/dashboardSection'
import { PortalBackConfirmation } from './PortalBackConfirmation'

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

// jsdom does not implement the native dialog methods.
Object.assign(HTMLDialogElement.prototype, {
  showModal(this: HTMLDialogElement) {
    this.open = true
  },
  close(this: HTMLDialogElement) {
    this.open = false
  },
})

function TestPage() {
  const { pathname, search } = useLocation()
  const { tab, approval } = readDashboardSection(search)
  const section = tab === 'approvals' ? approval : dashboardTabs.find(({ id }) => id === tab)?.label
  return <><h1>{pathname === '/dashboard' ? section : pathname}</h1><PortalBackConfirmation /></>
}

it('confirms leaving the portal while allowing Back between portal pages', async () => {
  const logout = vi.fn()
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: true,
    client: null,
    activeDashboardTab: 'profile',
    login: vi.fn(),
    logout,
    setActiveDashboardTab: vi.fn(),
  })
  const router = createMemoryRouter([{ path: '*', element: <TestPage /> }], {
    initialEntries: ['/login', '/dashboard'],
  })
  const user = userEvent.setup()
  render(<RouterProvider router={router} />)

  const visitedSections = [
    [dashboardSectionPath('projectDetails'), 'Customer Requirements'],
    [dashboardSectionPath('supervisor'), 'Supervisor Information'],
    [dashboardSectionPath('approvals', '3D Design Approvals'), '3D Design Approvals'],
    [dashboardSectionPath('approvals', 'Payment Terms Approvals'), 'Payment Terms Approvals'],
    [dashboardSectionPath('approvals', 'Proforma Invoice Approvals'), 'Proforma Invoice Approvals'],
  ]
  expect(screen.getByRole('heading', { name: 'Profile & Overview' })).toBeVisible()
  for (const [path, name] of visitedSections) {
    await act(() => router.navigate(path))
    expect(screen.getByRole('heading', { name })).toBeVisible()
  }
  await act(() => router.navigate('/payment/history'))

  const backOrder = [...visitedSections.map(([, name]) => name).reverse(), 'Profile & Overview']
  for (const name of backOrder) {
    await act(() => router.navigate(-1))
    expect(screen.getByRole('heading', { name })).toBeVisible()
    expect(screen.queryByRole('dialog')).toBeNull()
  }

  await act(() => router.navigate(-1))
  expect(await screen.findByRole('dialog', { name: 'Do you want to log out?' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Profile & Overview' })).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'No' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Profile & Overview' })).toBeVisible()
  expect(logout).not.toHaveBeenCalled()

  await act(() => router.navigate(-1))
  await user.click(await screen.findByRole('button', { name: 'Yes' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(logout).toHaveBeenCalledTimes(1)
})
