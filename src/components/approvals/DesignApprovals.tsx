import { useEffect, useRef, useState } from 'react'
import { FiDownload, FiFileText, FiCheckCircle, FiExternalLink, FiBox, FiFolder, FiPlayCircle, FiCalendar, FiUser, FiClock, FiCheck, FiEye } from 'react-icons/fi'
import { safeDesignLink, designFileUrl, type Design, type DesignFile } from '../../services/designApprovalsApi'
import type { useDesignApprovals } from './useDesignApprovals'
import { ApprovalPdfPreview } from './ApprovalPdfPreview'
import './DesignApprovals.css'
import './DesignLayout.css'

type DesignDisplay = {
  clientName?: string
  onOpenTimeline?: () => void
}

const videoTypes: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg' }

function DesignVideo({ url, file }: { url: string; file: DesignFile }) {
  const [source, setSource] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  useEffect(() => () => { if (source) URL.revokeObjectURL(source) }, [source])

  async function watch() {
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(120000)]) })
      if (!response.ok) throw new Error('video')
      const blob = await response.blob()
      if (!controller.signal.aborted) {
        setSource(URL.createObjectURL(blob.slice(0, blob.size, videoTypes[file.extension.toLowerCase()])))
      }
    } catch {
      if (!controller.signal.aborted) setError('Unable to load this video. You can still download the file.')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return <div className="designLayout__player">
    {source ? <video src={source} controls playsInline autoPlay aria-label={file.title}
      onError={() => setError('Unable to play this video. You can still download the file.')} />
      : <button type="button" disabled={busy} onClick={() => void watch()}>
        <FiPlayCircle aria-hidden="true" /> {busy ? 'Loading video?' : 'Watch video'}
      </button>}
    {error && <p className="designReview__error" role="alert">{error}</p>}
  </div>
}

const previewImageExtensions = new Set(['jpg', 'jpeg', 'png'])

function DesignImagePreview({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false)

  return <div className="designLayout__imagePreview">
    {failed
      ? <p role="alert" className="designReview__error">Unable to preview this image. You can still download it.</p>
      : <img src={url} alt={title} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
  </div>
}

function DesignAttachment({ contactId, design, file, previewOpen, onTogglePreview }: { contactId: string; design: Design; file: DesignFile; previewOpen?: boolean; onTogglePreview?: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [imageOpen, setImageOpen] = useState(false)
  const isImage = previewImageExtensions.has(file.extension.toLowerCase())
  const isPreviewOpen = isImage ? imageOpen : previewOpen
  const togglePreview = isImage ? () => setImageOpen(open => !open) : onTogglePreview
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
      {togglePreview && <button type="button" aria-expanded={isPreviewOpen} onClick={togglePreview}>
        <FiEye aria-hidden="true" /> {isPreviewOpen ? 'Hide preview' : isImage ? 'Preview image' : 'Preview PDF'}
      </button>}
      <button type="button" disabled={busy} onClick={() => void download()} aria-label={'Download ' + file.title}>{busy ? 'Downloading…' : 'Download'} <FiDownload aria-hidden="true" /></button>
    </div>
    {isImage && imageOpen && <DesignImagePreview key={url} url={url} title={file.title} />}
    {previewOpen && <ApprovalPdfPreview key={url} url={url} title={file.title} />}
    {error && <p role="alert" className="designReview__error">{error}</p>}
  </li>
}
const designStatusLabels: Record<string, string> = {
  Sent: 'Awaiting your review',
  Approved: 'Approved',
  'Changes Requested': 'Changes Requested',
}

function DesignCard({ contactId, design, state, highlighted, clientName, onOpenTimeline }: DesignDisplay & { contactId: string; design: Design; state: ReturnType<typeof useDesignApprovals>; highlighted: boolean }) {
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
  const externalLink = safeDesignLink(design.externalFileLink)
  const pending = design.status === 'Sent' && (design.canApprove || design.canRequestChanges)
  const approved = design.status === 'Approved'
  const completed = approved && design.managerApproval === true
  const changesRequested = design.status === 'Changes Requested'
  const status = designStatusLabels[design.status] || design.status
  const videos = design.files.filter(file => Object.hasOwn(videoTypes, file.extension.toLowerCase()))
  const documents = design.files.filter(file => !Object.hasOwn(videoTypes, file.extension.toLowerCase()))
  const [showDocuments, setShowDocuments] = useState(false)
  const documentView = documents.length > 0 && (showDocuments || !videos.length)
  const files = documentView ? documents : videos
  const [openPdfId, setOpenPdfId] = useState<string | null>(null)

  return <article ref={ref} tabIndex={-1} className={'designLayout' + (highlighted ? ' is-highlighted' : '')} aria-label={design.designName}>
    <header className="designLayout__summary designLayout__panel">
      <span className="designLayout__projectIcon"><FiBox aria-hidden="true" /></span>
      <div><p className="designReview__eyebrow">Project</p><p className="designLayout__projectName">{design.opportunityName}</p></div>
      <div><p className="designReview__eyebrow">Design reference</p><h3 className="designLayout__reference">{design.designName}</h3></div>
      <span className={'designReview__status' + (approved ? ' designLayout__approved' : '')}>{approved && <FiCheck aria-hidden="true" />}{status}</span>
    </header>

    <section className="designLayout__approval designLayout__panel">
      <h4>Approval status</h4>
      <div className="designLayout__statusMessage">
        {approved ? <FiCheckCircle aria-hidden="true" /> : <FiClock aria-hidden="true" />}
        <div>
          <strong>{approved ? 'Design approved' : status}</strong>
          <p>{approved ? 'The design has been approved by the client.' : changesRequested ? 'Your requested changes have been submitted.' : 'Review your design and submit your response.'}</p>
        </div>
      </div>
      {approved && clientName?.trim() && <dl className="designLayout__details">
        <div><dt><FiUser aria-hidden="true" /> Approved By</dt><dd>{clientName}</dd></div>
      </dl>}
      {!pending && design.comments && !(approved && design.comments === 'Approved By Client') && <p className="designLayout__comments">{design.comments}</p>}
      {pending && !mode && <div className="designReview__actions">
        <button type="button" className="designReview__primary" disabled={state.busy || !design.canApprove} onClick={() => setMode('Approved')}>Approve design</button>
        <button type="button" disabled={state.busy || !design.canRequestChanges} onClick={() => setMode('Changes Requested')}>Request changes</button>
      </div>}
      {pending && mode && <form onSubmit={event => { event.preventDefault(); void submit() }}>
        <fieldset disabled={state.busy}><legend>{mode === 'Approved' ? 'Confirm design approval' : 'Request design changes'}</legend>
          <p>{mode === 'Approved' ? 'Submit your approval after reviewing the design files and any shared link. Your response cannot be submitted again.' : 'Describe the updates you need before this design can be approved.'}</p>
          <label htmlFor={'design-comments-' + design.designId}>{mode === 'Approved' ? 'Comments (optional)' : 'Comments (required)'}</label>
          <textarea id={'design-comments-' + design.designId} required={mode === 'Changes Requested'} value={comments} onChange={event => setComments(event.target.value)} rows={4} />
          <div className="designReview__actions"><button className="designReview__primary" type="submit">{state.busy ? 'Submitting…' : mode === 'Approved' ? 'Confirm approval' : 'Submit change request'}</button><button type="button" onClick={() => { setMode(null); setError('') }}>Cancel</button></div>
        </fieldset>
      </form>}
      {error && <p role="alert" className="designReview__error">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>

    <section className="designLayout__media designLayout__panel" aria-label="Design files">
      {files.length ? <>
        <div className="designLayout__fileNav" role="group" aria-label="Design file categories">
          {videos.length > 0 && <button type="button" aria-pressed={!documentView} onClick={() => setShowDocuments(false)}><FiPlayCircle aria-hidden="true" /> Design Walkthrough</button>}
          {documents.length > 0 && <button type="button" aria-pressed={documentView} onClick={() => setShowDocuments(true)}><FiFileText aria-hidden="true" /> Documents ({documents.length})</button>}
        </div>
        <ul className="designReview__files designLayout__files">
          {files.map(file => documentView
            ? <DesignAttachment key={file.versionId} contactId={contactId} design={design} file={file}
              previewOpen={openPdfId === file.versionId}
              onTogglePreview={file.extension.toLowerCase() === 'pdf' ? () => setOpenPdfId(id => id === file.versionId ? null : file.versionId) : undefined} />
            : <li key={file.versionId} className="designLayout__video">
              <DesignVideo url={designFileUrl(contactId, design, file)} file={file} />
              <ul className="designReview__files"><DesignAttachment contactId={contactId} design={design} file={file} /></ul>
            </li>)}
        </ul>
      </> : <div className="designLayout__empty">
        <FiFolder aria-hidden="true" />
        <h4>No design files available</h4>
        <p>{externalLink ? 'Open the shared design folder to review external files.' : 'There are no videos, images or documents attached to this approval.'}</p>
      </div>}
    </section>

    <section className="designLayout__progress designLayout__panel">
      <h4>Project progress</h4>
      <ol className="designLayout__steps">
        <li><span>Previous stage</span><i aria-hidden="true">2</i><span>Site Visit</span></li>
        <li aria-current={completed ? undefined : 'step'} className={completed ? 'designLayout__completedStep' : undefined}>
          <span>{completed ? 'Completed' : 'Current stage'}</span>
          <i aria-hidden="true">{completed ? <FiCheck /> : '3'}</i>
          <span>3D Design</span>
        </li>
        <li><span>Next stage</span><i aria-hidden="true">4</i><span>Proforma Invoice</span></li>
      </ol>
    </section>

    {externalLink && <section className="designLayout__external designLayout__panel">
      <h4>External design files</h4>
      <p>Access additional design files and materials.</p>
      <div className="designLayout__externalFile">
        <FiFolder aria-hidden="true" />
        <div><strong>Shared design folder</strong><small title={externalLink}>{externalLink}</small></div>
        <a href={externalLink} target="_blank" rel="noopener noreferrer" aria-label="Open design link (new tab)">Open link <FiExternalLink aria-hidden="true" /></a>
      </div>
    </section>}

    {completed && <footer className="designLayout__next designLayout__panel">
      <strong>What?s next?</strong>
      <p>The next stage is Proforma Invoice Approval.</p>
      {onOpenTimeline && <button type="button" onClick={onOpenTimeline}><FiCalendar aria-hidden="true" /> View project timeline</button>}
    </footer>}
  </article>
}
export function DesignApprovals({ contactId, state, highlightId, clientName, onOpenTimeline }: DesignDisplay & { contactId: string; state: ReturnType<typeof useDesignApprovals>; highlightId: string | null }) {
  const [selection, setSelection] = useState<{ designId: string; highlightId: string | null } | null>(null)
  if (!contactId) return <div className="dashboardEmptyState">No designs have been sent for your review yet. We will notify you when a design is ready.</div>
  if (!state.result) return <p role="status">Loading design approvals…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  const { designs } = state.result
  if (!designs.length) return <div className="dashboardEmptyState">No designs have been sent for your review yet. We will notify you when a design is ready.</div>

  const highlightedDesign = designs.find(design => design.designId === highlightId)
  const selectedDesign = selection?.highlightId === highlightId
    ? designs.find(design => design.designId === selection.designId)
    : undefined
  const activeDesign = selectedDesign || highlightedDesign || designs[0]

  return <div className="designReview">
    {highlightId && !highlightedDesign && <p role="status">This design is no longer available for your account.</p>}
    {designs.length > 1 && <div className="designLayout__references" role="group" aria-label="Choose a design reference">
      {designs.map(design => <button
        key={design.designId}
        type="button"
        aria-pressed={design.designId === activeDesign.designId}
        onClick={() => setSelection({ designId: design.designId, highlightId })}
      >
        <strong>{design.designName}</strong>{' '}
        <span>{designStatusLabels[design.status] || design.status}</span>
      </button>)}
    </div>}
    <DesignCard key={activeDesign.designId} contactId={contactId} design={activeDesign} state={state}
      highlighted={highlightId === activeDesign.designId} clientName={clientName} onOpenTimeline={onOpenTimeline} />
  </div>
}
