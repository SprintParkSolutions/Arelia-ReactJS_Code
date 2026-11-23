import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DocumentDownload } from './DocumentDownload'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
const props = { leadId: 'lead1', reportId: 'report1', document: { versionId: 'version1', title: 'Blueprint', fileExtension: 'png' } }
it('downloads the returned file with its filename instead of navigating', async () => {
  const blob = new Blob(['image'], { type: 'image/png' })
  const fetcher = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob })
  vi.stubGlobal('fetch', fetcher)
  const create = vi.fn().mockReturnValue('blob:download')
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: vi.fn() })
  let filename = ''
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { filename = this.download })
  render(<DocumentDownload {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Download Blueprint' }))
  await waitFor(() => expect(click).toHaveBeenCalledOnce())
  expect(filename).toBe('Blueprint.png')
  expect(create).toHaveBeenCalledWith(blob)
  expect(fetcher.mock.calls[0][0]).toContain('leadId=lead1&reportId=report1&versionId=version1')
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
it('shows a retryable error instead of saving a failed response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  render(<DocumentDownload {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Download Blueprint' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to download')
  expect(click).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Download Blueprint' })).toBeEnabled()
})