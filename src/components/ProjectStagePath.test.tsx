import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ProjectStagePath } from './ProjectStagePath'

afterEach(cleanup)

describe('ProjectStagePath', () => {
  it('shows only the three requested stages and follows status changes', () => {
    const { rerender } = render(<ProjectStagePath status="In Progress" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('Execution').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Design & Planning').closest('li')).toHaveTextContent('Completed')
    expect(screen.getByText('Handover').closest('li')).toHaveTextContent('Upcoming')
    rerender(<ProjectStagePath status="Completed" />)
    expect(screen.getByText('Handover').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Execution').closest('li')).toHaveTextContent('Completed')
  })

  it.each([undefined, '', 'Not Started', 'Planning'])('defaults %s to Design & Planning', status => {
    render(<ProjectStagePath status={status} />)
    expect(screen.getByText('Design & Planning').closest('li')).toHaveAttribute('aria-current', 'step')
  })

  it('accepts case and whitespace differences in status', () => {
    render(<ProjectStagePath status="  IN   PROGRESS  " />)
    expect(screen.getByText('Execution').closest('li')).toHaveAttribute('aria-current', 'step')
  })
})
