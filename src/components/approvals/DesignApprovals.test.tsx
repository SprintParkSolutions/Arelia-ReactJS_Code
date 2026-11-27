import { Blob as NodeBlob } from 'node:buffer'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DesignApprovals } from './DesignApprovals'
import { useDesignNotifications } from './useDesignNotifications'
import { designFileUrl, type Design } from '../../services/designApprovalsApi'
const design: Design = { designId: 'design1', opportunityId: 'opp1', designName: 'Living room', opportunityName: 'Home', status: 'Sent', comments: '', createdDate: '', canApprove: true, canRequestChanges: true, files: [{ versionId: 'file1', title: 'Layout', extension: 'pdf' }] }
function state() { return { result: { success: true, message: '', designs: [design] }, busy: false, retry: vi.fn(), submit: vi.fn().mockResolvedValue({ success: true, message: 'Saved' }) } }
describe('design review', () => {
  it('offers PDF download and explicit approval confirmation', async () => {
    const data = state()
    render(<DesignApprovals contactId="contact1" state={data} highlightId={null} />)
    expect(screen.getByRole('heading', { name: 'External design files' })).toBeInTheDocument()
    expect(screen.getByText('No additional design files available.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download Layout' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve design' }))
    expect(data.submit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }))
    await waitFor(() => expect(data.submit).toHaveBeenCalledWith(design, 'Approved', ''))
  })
  it('loads a PDF preview only after the client opens it', async () => {
    const fetchPdf = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new NodeBlob(['%PDF-1.7']),
    } as Response)
    const createObjectURL = vi.fn().mockReturnValue('blob:design-preview')
    const revokeObjectURL = vi.fn()
    const pdfViewer = vi.spyOn(window, 'navigator', 'get')
    pdfViewer.mockReturnValue({ pdfViewerEnabled: true } as Navigator)
    const NativeURL = URL
    vi.stubGlobal('URL', class extends NativeURL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    })
    try {
      render(<DesignApprovals contactId="contact1" state={state()} highlightId={null} />)
      expect(screen.queryByTitle('Layout PDF preview')).not.toBeInTheDocument()
      expect(fetchPdf).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Preview PDF' }))
      expect(await screen.findByTitle('Layout PDF preview')).toHaveAttribute('src', 'blob:design-preview')
      expect(screen.getByRole('link', { name: /Open PDF in a new tab/ })).toHaveAttribute('href', 'blob:design-preview')
      expect(screen.getByRole('button', { name: 'Download Layout' })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
      expect(screen.queryByTitle('Layout PDF preview')).not.toBeInTheDocument()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:design-preview')
    } finally {
      fetchPdf.mockRestore()
      pdfViewer.mockRestore()
      vi.unstubAllGlobals()
    }
  })
  it.each(['JPG', 'PNG', 'JPEG'])('shows a %s attachment inline and retains its download', extension => {
    const file = { versionId: 'image1', title: 'Living room render', extension }
    const imageDesign = { ...design, files: [file] }
    const data = state()
    render(<DesignApprovals contactId="contact1" state={{ ...data, result: { ...data.result, designs: [imageDesign] } }} highlightId={null} />)

    expect(screen.queryByRole('img', { name: file.title })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Preview image' }))
    const image = screen.getByRole('img', { name: file.title })
    expect(image).toHaveAttribute('src', designFileUrl('contact1', imageDesign, file))
    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
    expect(screen.queryByRole('img', { name: file.title })).not.toBeInTheDocument()
    const previewButton = screen.getByRole('button', { name: 'Preview image' })
    expect(previewButton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(previewButton)
    expect(screen.getByRole('button', { name: 'Hide preview' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.error(screen.getByRole('img', { name: file.title }))
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to preview this image')
    expect(screen.getByRole('button', { name: 'Download Living room render' })).toBeEnabled()
  })
  it('shows the next stage after manager approval', () => {
    const data = state()
    const approved = { ...design, status: 'Approved', files: [] }
    const approvals = (managerApproval: boolean) => ({
      ...data, result: { ...data.result, designs: [{ ...approved, managerApproval }] },
    })
    const view = render(<DesignApprovals contactId="contact1" state={approvals(false)} highlightId={null} />)
    expect(screen.getByText('Design approved')).toBeInTheDocument()
    expect(screen.queryByText('The next stage is Proforma Invoice Approval.')).not.toBeInTheDocument()
    expect(screen.getByText('Current stage').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()

    view.rerender(<DesignApprovals contactId="contact1" state={approvals(true)} highlightId={null} />)
    expect(screen.getByText('The next stage is Proforma Invoice Approval.')).toBeInTheDocument()
    expect(screen.getByText('Completed').closest('li')).toHaveTextContent('3D Design')
    expect(screen.getByText('Completed').closest('li')).not.toHaveAttribute('aria-current')
  })

  it('switches between design references and opens the design selected by a notification', () => {
    const data = state()
    const approved = { ...design, designId: 'approved', designName: 'AD-0007', status: 'Approved', files: [] }
    const changed = { ...design, designId: 'changed', designName: 'AD-0004', status: 'Changes Requested', files: [] }
    const approvals = { ...data, result: { ...data.result, designs: [approved, changed] } }
    const view = render(<DesignApprovals contactId="contact1" state={approvals} highlightId={null} />)

    expect(screen.getByRole('button', { name: 'AD-0007 Approved' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'AD-0004 Changes Requested' }))
    expect(screen.getByRole('heading', { name: 'AD-0004' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'AD-0007' })).not.toBeInTheDocument()

    view.rerender(<DesignApprovals contactId="contact1" state={approvals} highlightId={approved.designId} />)
    expect(screen.getByRole('button', { name: 'AD-0007 Approved' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'AD-0007' })).toBeInTheDocument()
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

it.each(['https://drive.google.com/file/d/example/view', 'https://1drv.ms/u/s!example', 'https://example-my.sharepoint.com/:f:/g/example'])('displays a clickable external design link: %s', url => {
  const data = state()
  render(<DesignApprovals contactId="contact1" state={{ ...data, result: { ...data.result, designs: [{ ...design, files: [], externalFileLink: url }] } }} highlightId={null} />)
  const link = screen.getByRole('link', { name: /Open design link/ })
  expect(link).toHaveAttribute('href', url)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(screen.getByText(url)).toBeInTheDocument()
  expect(screen.queryByText('No files have been attached to this design.')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Approve design' })).toBeEnabled()
})
it('shows attachments alongside a link and rejects unsafe links', () => {
  const data = state()
  const view = render(<DesignApprovals contactId="contact1" state={{ ...data, result: { ...data.result, designs: [{ ...design, externalFileLink: 'https://drive.google.com/drive/folders/example' }] } }} highlightId={null} />)
  expect(screen.getByRole('button', { name: 'Download Layout' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Open design link/ })).toBeInTheDocument()
  view.rerender(<DesignApprovals contactId="contact1" state={{ ...data, result: { ...data.result, designs: [{ ...design, externalFileLink: 'javascript:alert(1)' }] } }} highlightId={null} />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
