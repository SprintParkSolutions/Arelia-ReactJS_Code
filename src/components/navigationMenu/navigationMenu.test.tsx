import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NavigationMenu from './navigationMenu'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, client: null }),
}))

describe('mobile navigation', () => {
  const originalWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
    document.body.style.overflow = 'auto'
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
    document.body.style.overflow = ''
  })

  function openMenu(onOpenConsultation = vi.fn()) {
    render(<MemoryRouter><NavigationMenu onOpenConsultation={onOpenConsultation} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))
  }

  it('locks page scrolling while open and restores scrolling and focus on Escape', async () => {
    openMenu()
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('auto')
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument())
  })

  it('closes the menu and restores scrolling when a page is selected', async () => {
    openMenu()
    fireEvent.click(screen.getByRole('link', { name: 'About Us' }))
    expect(document.body.style.overflow).toBe('auto')
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument())
  })

  it('opens consultation and dismisses the navigation', async () => {
    const onOpenConsultation = vi.fn()
    openMenu(onOpenConsultation)
    fireEvent.click(screen.getByRole('button', { name: 'Book Consultation' }))
    expect(onOpenConsultation).toHaveBeenCalledOnce()
    expect(document.body.style.overflow).toBe('auto')
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument())
  })
})
