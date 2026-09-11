import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConsultationModal } from './ConsultationModal'

vi.mock('./ConsultationForm', () => ({
  ConsultationForm: () => <input aria-label="Project name" />,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('shared consultation modal', () => {
  it('renders outside the page and preserves the form and scroll lock on parent updates', () => {
    const firstClose = vi.fn()
    const latestClose = vi.fn()
    const { container, rerender } = render(<ConsultationModal isOpen onClose={firstClose} />)
    const dialog = screen.getByRole('dialog')
    expect(container).not.toContainElement(dialog)
    expect(document.body).toContainElement(dialog)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My home' } })

    const overflowSetter = vi.spyOn(document.body.style, 'overflow', 'set')
    rerender(<ConsultationModal isOpen onClose={latestClose} />)
    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(screen.getByRole('textbox')).toHaveValue('My home')
    expect(overflowSetter).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(firstClose).not.toHaveBeenCalled()
    expect(latestClose).toHaveBeenCalledOnce()
  })

  it('can close and reopen without leaving duplicate overlays or a stale scroll lock', async () => {
    const previousOverflow = document.body.style.overflow
    const close = vi.fn()
    const { rerender } = render(<ConsultationModal isOpen onClose={close} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close consultation form' }))
    expect(close).toHaveBeenCalledOnce()
    rerender(<ConsultationModal isOpen={false} onClose={close} />)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.body.style.overflow).toBe(previousOverflow)
    rerender(<ConsultationModal isOpen onClose={close} />)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('hidden')
  })
})
