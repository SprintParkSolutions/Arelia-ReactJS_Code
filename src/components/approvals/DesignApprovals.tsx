import { useEffect, useRef, useState } from 'react'
import { FiDownload, FiFileText, FiCheckCircle } from 'react-icons/fi'
import { designFileUrl, type Design, type DesignFile } from '../../services/designApprovalsApi'
import type { useDesignApprovals } from './useDesignApprovals'
import './DesignApprovals.css'

function DesignAttachment({ contactId, design, file }: { contactId: string; design: Design; file: DesignFile }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const url = designFileUrl(contactId, design, file)
  async function download() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error('download')
      const blobUrl = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      const suffix = file.extension ? '.' + file.extension : ''
      anchor.download = file.title.toLowerCase().endsWith(suffix.toLowerCase()) ? file.title : file.title + suffix
      document.body.appendChild(anchor)
      try { anchor.click() } finally { anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000) }
    } catch { setError('Unable to download this file. Please try again.') }
    finally { setBusy(false) }
  }
  return <li className="designReview__file">
    <div className="designReview__fileName"><FiFileText aria-hidden="true" /><span>{file.title}<small>{file.extension.toUpperCase()}</small></span></div>
    <div className="designReview__actions">
      <button type="button" disabled={busy} onClick={() => void download()} aria-label={'Download ' + file.title}>{busy ? 'Downloading…' : 'Download'} <FiDownload aria-hidden="true" /></button>
    </div>
    {error && <p role="alert" className="designReview__error">{error}</p>}
  </li>
}
function DesignCard({ contactId, design, state, highlighted }: { contactId: string; design: Design; state: ReturnType<typeof useDesignApprovals>; highlighted: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const [mode, setMode] = useState<'Approved' | 'Changes Requested' | null>(null)
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => { if (highlighted) { ref.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); ref.current?.focus({ preventScroll: true }) } }, [highlighted])
  async function submit() {
    if (!mode || state.busy) return
    if (mode === 'Changes Requested' && !comments.trim()) { setError('Please describe the changes you would like.'); return }
    setError(''); setMessage('')
    const result = await state.submit(design, mode, comments)
    if (!result.success) { setError(result.message); return }
    setMode(null); setMessage(result.message)
  }
  const pending = design.status === 'Sent' && (design.canApprove || design.canRequestChanges)
  return <article ref={ref} tabIndex={-1} className={'designReview__card' + (highlighted ? ' is-highlighted' : '')} aria-label={design.designName}>
    <header className="designReview__header"><div><p className="designReview__eyebrow">{design.opportunityName}</p><h3>{design.designName}</h3></div><span className="designReview__status">{design.status === 'Sent' ? 'Awaiting your review' : design.status}</span></header>
    <div className="designReview__body">
      <h4>Design files</h4>
      {design.files.length ? <ul className="designReview__files">{design.files.map(file => <DesignAttachment key={file.versionId} contactId={contactId} design={design} file={file} />)}</ul> : <p>No files have been attached to this design.</p>}
      {!pending && <div className="designReview__decision"><FiCheckCircle aria-hidden="true" /><div><strong>Response recorded: {design.status}</strong>{design.comments && <p>{design.comments}</p>}</div></div>}
      {pending && !mode && <div className="designReview__actions">
        <button type="button" className="designReview__primary" disabled={state.busy || !design.canApprove} onClick={() => setMode('Approved')}>Approve design</button>
        <button type="button" disabled={state.busy || !design.canRequestChanges} onClick={() => setMode('Changes Requested')}>Request changes</button>
      </div>}
      {pending && mode && <form onSubmit={event => { event.preventDefault(); void submit() }}>
        <fieldset disabled={state.busy}><legend>{mode === 'Approved' ? 'Confirm design approval' : 'Request design changes'}</legend>
          <p>{mode === 'Approved' ? 'Submit your approval after reviewing the attached files. Your response cannot be submitted again.' : 'Describe the updates you need before this design can be approved.'}</p>
          <label htmlFor={'design-comments-' + design.designId}>{mode === 'Approved' ? 'Comments (optional)' : 'Comments (required)'}</label>
          <textarea id={'design-comments-' + design.designId} required={mode === 'Changes Requested'} value={comments} onChange={event => setComments(event.target.value)} rows={4} />
          <div className="designReview__actions"><button className="designReview__primary" type="submit">{state.busy ? 'Submitting…' : mode === 'Approved' ? 'Confirm approval' : 'Submit change request'}</button><button type="button" onClick={() => { setMode(null); setError('') }}>Cancel</button></div>
        </fieldset>
      </form>}
      {error && <p role="alert" className="designReview__error">{error}</p>}
      {message && <p role="status">{message}</p>}
    </div>
  </article>
}
export function DesignApprovals({ contactId, state, highlightId }: { contactId: string; state: ReturnType<typeof useDesignApprovals>; highlightId: string | null }) {
  if (!contactId) return null
  if (!state.result) return <p role="status">Loading design approvals…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  if (!state.result.designs.length) return <div className="dashboardEmptyState">No designs have been sent for your review yet. We will notify you when a design is ready.</div>
  return <div className="designReview">
    <p className="designReview__intro">Review the attached designs, then approve or share the changes you need.</p>
    {highlightId && !state.result.designs.some(d => d.designId === highlightId) && <p role="status">This design is no longer available for your account.</p>}
    {state.result.designs.map(design => <DesignCard key={design.designId} contactId={contactId} design={design} state={state} highlighted={highlightId === design.designId} />)}
  </div>
}
