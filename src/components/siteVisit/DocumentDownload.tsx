import { useRef, useState } from 'react'
import { FiDownload, FiFileText } from 'react-icons/fi'
import { reportDocumentUrl } from '../../services/siteVisitApi'

export function DocumentDownload({ leadId, reportId, document: file }: {
  leadId: string; reportId: string
  document: { versionId: string; title: string; fileExtension: string }
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  async function download() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const response = await fetch(reportDocumentUrl(leadId, reportId, file.versionId), { cache: 'no-store' })
      if (!response.ok) throw new Error('Unable to download this document. Please try again.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const extension = file.fileExtension ? '.' + file.fileExtension : ''
      const title = file.title.replace(/[<>:"/\\|?*]/g, '_')
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = extension && !title.toLowerCase().endsWith(extension.toLowerCase()) ? title + extension : title
      document.body.appendChild(anchor)
      try { anchor.click() } finally {
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch {
      setError('Unable to download this document. Please try again.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return <>
    <button type="button" disabled={busy} onClick={() => void download()} aria-label={'Download ' + file.title}>
      <FiFileText aria-hidden="true" /> {file.title}{file.fileExtension ? ' (' + file.fileExtension.toUpperCase() + ')' : ''}
      <span className="siteVisit__fileHint">{busy ? 'Downloading…' : 'Download'} <FiDownload aria-hidden="true" /></span>
    </button>
    {error && <p role="alert" className="siteVisit__error">{error}</p>}
  </>
}