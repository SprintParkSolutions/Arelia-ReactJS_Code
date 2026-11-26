import { useEffect, useRef, useState } from 'react'
import { FiDownload, FiFileText, FiEye, FiCheck, FiCheckCircle, FiClock, FiUser, FiCalendar } from 'react-icons/fi'
import { getProformaInvoice, proformaFileUrl, invoiceFileFormat, canPreviewInvoiceFile, type Invoice, type InvoiceFile } from '../../services/proformaApi'
import type { useProformaApprovals } from './useProformaApprovals'
import { InvoiceFilePreview } from './InvoiceFilePreview'
import './DesignApprovals.css'
import './DesignLayout.css'
import './ProformaLayout.css'

type InvoiceDisplay = { clientName?: string; onOpenTimeline?: () => void }
function InvoiceAttachment({ leadId, invoice, file, expanded, onToggle }: { leadId: string; invoice: Invoice; file: InvoiceFile; expanded: boolean; onToggle?: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const url = proformaFileUrl(leadId, invoice, file)
  const extension = invoiceFileFormat(file)
  const previewLabel = extension === 'pdf' ? 'Preview PDF' : extension === 'csv' ? 'Preview CSV'
    : extension === 'xls' || extension === 'xlsx' ? 'Preview Excel' : 'Preview image'
  const previewAction = expanded ? 'Hide preview' : previewLabel
  async function download() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error('download')
      const objectUrl = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      const suffix = extension ? '.' + extension : ''
      anchor.download = file.title.toLowerCase().endsWith(suffix) ? file.title : file.title + suffix
      document.body.appendChild(anchor)
      try { anchor.click() } finally { anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000) }
    } catch { setError('Unable to download this file. Please try again.') }
    finally { setBusy(false) }
  }
  return <li className="designReview__file">
    <div className="designReview__fileName"><FiFileText aria-hidden="true" /><span>{file.title}<small>{extension.toUpperCase()}</small></span></div>
    <div className="designReview__actions">
      {onToggle && <button type="button" aria-expanded={expanded} aria-label={previewAction + ' ' + file.title} onClick={onToggle}><FiEye aria-hidden="true" /> {previewAction}</button>}
      <button type="button" disabled={busy} onClick={() => void download()} aria-label={'Download ' + file.title}>{busy ? 'Downloading…' : 'Download'} <FiDownload aria-hidden="true" /></button>
    </div>
    {expanded && <InvoiceFilePreview key={url} file={file} url={url} />}
    {error && <p role="alert" className="designReview__error">{error}</p>}
  </li>
}
function InvoiceFiles({ leadId, invoice }: { leadId: string; invoice: Invoice }) {
  const [selectedId, setSelectedId] = useState<string>()
  return <>
    <h4 className="proformaLayout__documentsHeading"><FiFileText aria-hidden="true" /> Documents ({invoice.files.length})</h4>
    {invoice.files.length ? <ul className="designReview__files designLayout__files">{invoice.files.map(file => <InvoiceAttachment
      key={file.fileVersionId} leadId={leadId} invoice={invoice} file={file} expanded={selectedId === file.fileVersionId}
      onToggle={canPreviewInvoiceFile(file) ? () => setSelectedId(id => id === file.fileVersionId ? undefined : file.fileVersionId) : undefined}
    />)}</ul> : <div className="designLayout__empty"><FiFileText aria-hidden="true" /><p>No invoice files have been attached yet.</p></div>}
  </>
}

function InvoiceCard({ leadId, invoice, state, highlighted, onOpenTimeline, clientName }: InvoiceDisplay & { leadId: string; invoice: Invoice; state: ReturnType<typeof useProformaApprovals>; highlighted: boolean }) {
  const ref = useRef<HTMLElement>(null)

  const [details, setDetails] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [fileError, setFileError] = useState('')
  const [mode, setMode] = useState<'Approved' | 'Changes Requested' | null>(null)
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => { if (highlighted) { ref.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); ref.current?.focus({ preventScroll: true }) } }, [highlighted])
  useEffect(() => {
    if (!invoice.secureToken) return
    let active = true
    void getProformaInvoice(leadId, invoice).then(result => {
      if (!active) return
      setLoading(false)
      if (result.success && result.invoice) { setDetails(result.invoice); setFileError('') }
      else setFileError(result.message)
    })
    return () => { active = false }
  }, [leadId, invoice])
  async function submit() {
    if (!mode || state.busy) return
    if (mode === 'Changes Requested' && !comments.trim()) { setError('Please describe the changes you need.'); return }
    setError(''); setMessage('')
    const result = await state.submit(invoice, mode, comments)
    if (!result.success) { setError(result.message); return }
    setMode(null); setMessage(result.message)
  }
  const canRespond = invoice.status === 'Sent' && (invoice.canApprove || invoice.canRequestChanges)
  const approved = invoice.status === 'Approved'
  const completed = approved && invoice.managerApproval === true
  const status = invoice.status === 'Sent' ? 'Awaiting your review' : invoice.status

  return <article ref={ref} tabIndex={-1} className={'designLayout proformaLayout' + (highlighted ? ' is-highlighted' : '')} aria-label={invoice.name}>
    <header className="designLayout__summary designLayout__panel">
      <span className="designLayout__projectIcon"><FiFileText aria-hidden="true" /></span>
      <div><p className="designReview__eyebrow">Project</p><p className="designLayout__projectName">{invoice.opportunityName}</p></div>
      <div><p className="designReview__eyebrow">Invoice reference</p><h3 className="designLayout__reference">{invoice.name}</h3></div>
      <span className={'designReview__status' + (approved ? ' designLayout__approved' : '')}>{approved && <FiCheck aria-hidden="true" />}{status}</span>
    </header>

    <section className="designLayout__approval designLayout__panel">
      <h4>Approval status</h4>
      <div className="designLayout__statusMessage">
        {approved ? <FiCheckCircle aria-hidden="true" /> : <FiClock aria-hidden="true" />}
        <div>
          <strong>{approved ? 'Invoice approved' : status}</strong>
          <p>{approved ? 'The proforma invoice has been approved by the client.' : invoice.status === 'Changes Requested' ? 'Your requested changes have been submitted.' : 'Review the invoice and submit your response.'}</p>
        </div>
      </div>
      {approved && clientName?.trim() && <dl className="designLayout__details"><div><dt><FiUser aria-hidden="true" /> Approved by</dt><dd>{clientName}</dd></div></dl>}
      {invoice.status !== 'Sent' && invoice.comments && invoice.comments !== 'Approved By Client' && <p className="designLayout__comments">{invoice.comments}</p>}
      {canRespond && !mode && <div className="designReview__actions"><button type="button" className="designReview__primary" disabled={state.busy || !invoice.canApprove} onClick={() => setMode('Approved')}>Approve invoice</button><button type="button" disabled={state.busy || !invoice.canRequestChanges} onClick={() => setMode('Changes Requested')}>Request changes</button></div>}
      {canRespond && mode && <form onSubmit={event => { event.preventDefault(); void submit() }}>
        <fieldset disabled={state.busy}><legend>{mode === 'Approved' ? 'Confirm invoice approval' : 'Request invoice changes'}</legend>
          <p>Your response cannot be submitted again. Please review the invoice before confirming.</p>
          <label htmlFor={'invoice-comments-' + invoice.invoiceId}>{mode === 'Approved' ? 'Comments (optional)' : 'Client comments (required)'}</label>
          <textarea id={'invoice-comments-' + invoice.invoiceId} rows={4} value={comments} required={mode === 'Changes Requested'} onChange={event => setComments(event.target.value)} />
          <div className="designReview__actions"><button type="submit" className="designReview__primary">{state.busy ? 'Submitting…' : mode === 'Approved' ? 'Confirm approval' : 'Submit change request'}</button><button type="button" onClick={() => setMode(null)}>Cancel</button></div>
        </fieldset>
      </form>}
      {error && <p role="alert" className="designReview__error">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>

    <section className="designLayout__panel designLayout__media proformaLayout__media" aria-label="Invoice and supporting files">
      {!invoice.secureToken ? <p role="alert">This invoice is temporarily unavailable. Please contact the Arelia team.</p>
        : loading ? <p role="status">Loading invoice...</p> : fileError ? <p role="alert">{fileError}</p>
        : details && <InvoiceFiles leadId={leadId} invoice={details} />}
    </section>

    <section className="designLayout__progress designLayout__panel">
      <h4>Project progress</h4>
      <ol className="designLayout__steps">
        <li><span>Previous stage</span><i aria-hidden="true">3</i><span>3D Design</span></li>
        <li aria-current={completed ? undefined : 'step'} className={completed ? 'designLayout__completedStep' : undefined}>
          <span>{completed ? 'Completed' : 'Current stage'}</span>
          <i aria-hidden="true">{completed ? <FiCheck /> : '4'}</i>
          <span>Proforma Invoice</span>
        </li>
        <li><span>Next stage</span><i aria-hidden="true">5</i><span>Budget Review</span></li>
      </ol>
    </section>

    {completed && <footer className="designLayout__next designLayout__panel">
      <strong>What's next?</strong>
      <p>The next stage is Budget Review Approval.</p>
      {onOpenTimeline && <button type="button" onClick={onOpenTimeline}><FiCalendar aria-hidden="true" /> View project timeline</button>}
    </footer>}
  </article>
}
export function ProformaApprovals({ leadId, state, highlightId, onOpenTimeline, clientName }: InvoiceDisplay & { leadId: string; state: ReturnType<typeof useProformaApprovals>; highlightId: string | null }) {
  const [selection, setSelection] = useState<{ invoiceId: string; highlightId: string | null } | null>(null)
  if (!leadId) return <div className="dashboardEmptyState">No Proforma Invoices are available for this account.</div>
  if (!state.result) return <p role="status">Loading Proforma Invoices…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  const { invoices } = state.result
  if (!invoices.length) return <div className="dashboardEmptyState">No Proforma Invoices have been sent for your review yet.</div>

  const highlightedInvoice = invoices.find(invoice => invoice.invoiceId === highlightId)
  const selectedInvoice = selection?.highlightId === highlightId
    ? invoices.find(invoice => invoice.invoiceId === selection.invoiceId)
    : undefined
  const activeInvoice = selectedInvoice || highlightedInvoice || invoices[0]

  return <div className="designReview">
    {highlightId && !highlightedInvoice && <p role="status">This invoice is no longer available for your account.</p>}
    {invoices.length > 1 && <div className="designLayout__references" role="group" aria-label="Choose an invoice reference">
      {invoices.map(invoice => <button
        key={invoice.invoiceId}
        type="button"
        aria-pressed={invoice.invoiceId === activeInvoice.invoiceId}
        onClick={() => setSelection({ invoiceId: invoice.invoiceId, highlightId })}
      >
        <strong>{invoice.name}</strong>{' '}
        <span>{invoice.status === 'Sent' ? 'Awaiting your review' : invoice.status}</span>
      </button>)}
    </div>}
    <InvoiceCard key={activeInvoice.invoiceId} leadId={leadId} invoice={activeInvoice} state={state}
      highlighted={activeInvoice.invoiceId === highlightId} clientName={clientName} onOpenTimeline={onOpenTimeline} />
  </div>
}
