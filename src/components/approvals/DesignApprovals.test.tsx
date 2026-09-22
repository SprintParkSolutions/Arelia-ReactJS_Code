import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DesignApprovals } from './DesignApprovals'
import { useDesignNotifications } from './useDesignNotifications'
import type { Design } from '../../services/designApprovalsApi'
const design: Design = { designId: 'design1', opportunityId: 'opp1', designName: 'Living room', opportunityName: 'Home', status: 'Sent', comments: '', createdDate: '', canApprove: true, canRequestChanges: true, files: [{ versionId: 'file1', title: 'Layout', extension: 'pdf' }] }
function state() { return { result: { success: true, message: '', designs: [design] }, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
describe('design review', () => {
  it('offers download without a view action and explicit approval confirmation', async () => {
    const data = state()
    render(<DesignApprovals contactId="contact1" state={data} highlightId={null} />)
    expect(screen.queryByRole('link', { name: 'View Layout' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Layout' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve design' }))
    expect(data.submit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(design, 'Approved', ''))
  })
  it('requires comments and submits requested changes', async () => {
    const data = state()
    render(<DesignApprovals contactId="contact1" state={data} highlightId={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }))
    fireEvent.change(screen.getByLabelText('Comments (required)'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    expect(data.submit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Comments (required)'), { target: { value: 'Use lighter wood' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit change request' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(design, 'Changes Requested', 'Use lighter wood'))
  })
  it('shows saved responses read-only and disables requests in flight', () => {
    const data = state()
    const view = render(<DesignApprovals contactId="contact1" state={{ ...data, busy: true }} highlightId={null} />)
    expect(screen.getByRole('button', { name: 'Approve design' })).toBeDisabled()
    view.rerender(<DesignApprovals contactId="contact1" state={{ ...data, result: { success: true, message: '', designs: [{ ...design, status: 'Changes Requested', canApprove: false, canRequestChanges: false, comments: 'Use lighter wood' }] } }} highlightId={null} />)
    expect(screen.getByText('Use lighter wood')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve design' })).not.toBeInTheDocument()
  })
  it('keeps read notification history and does not duplicate or resurrect deleted designs', () => {
    const data = state().result
    const hook = renderHook(({ result }) => useDesignNotifications('design-history-client', result), { initialProps: { result: data } })
    expect(hook.result.current.notifications).toHaveLength(1)
    const id = hook.result.current.notifications[0].id
    act(() => hook.result.current.markRead(id))
    hook.rerender({ result: { ...data, designs: [{ ...design, status: 'Approved' }] } })
    expect(hook.result.current.notifications[0].read).toBe(true)
    hook.rerender({ result: data })
    expect(hook.result.current.notifications).toHaveLength(1)
    act(() => hook.result.current.dismiss(id))
    hook.rerender({ result: { ...data } })
    expect(hook.result.current.notifications).toHaveLength(0)
  })
})
