import { useEffect, useState } from 'react'
import { FiExternalLink } from 'react-icons/fi'

export function ApprovalPdfPreview({ url, title }: { url: string; title: string }) {
  const [source, setSource] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let previewUrl = ''

    async function load() {
      try {
        const response = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
        })
        if (!response.ok) throw new Error('PDF request failed')
        const blob = await response.blob()
        if (await blob.slice(0, 5).text() !== '%PDF-') throw new Error('Invalid PDF response')
        if (controller.signal.aborted) return
        previewUrl = URL.createObjectURL(blob.slice(0, blob.size, 'application/pdf'))
        setSource(previewUrl)
      } catch {
        if (!controller.signal.aborted) setError(true)
      }
    }

    void load()
    return () => {
      controller.abort()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [url])

  return <div className="designLayout__pdfPreview">
    {error ? <p role="alert" className="designReview__error">Unable to preview this PDF. You can still download it.</p>
      : !source ? <p role="status">Loading PDF preview...</p>
      : <>
        {navigator.pdfViewerEnabled !== false && <iframe src={source} title={title + ' PDF preview'} />}
        <a href={source} target="_blank" rel="noopener noreferrer">Open PDF in a new tab <FiExternalLink aria-hidden="true" /></a>
      </>}
  </div>
}
