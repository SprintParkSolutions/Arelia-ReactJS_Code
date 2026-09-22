import { useEffect, useRef, useState } from 'react'
import { FiDownload, FiFileText } from 'react-icons/fi'
import { getProformaInvoice, proformaFileUrl, type Invoice, type InvoiceFile } from '../../services/proformaApi'
import type { useProformaApprovals } from './useProformaApprovals'
import './DesignApprovals.css'
function InvoiceAttachment({ leadId, invoice, file }: { leadId: string; invoice: Invoice; file: InvoiceFile }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const url = proformaFileUrl(leadId, invoice, file)
  const extension = file.fileType.toLowerCase()
  async function download() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) })
      if (!response.ok) throw new Error('download')
      const objectUrl = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      const suffix = extension ? '.' + ({ word_x: 'docx', excel_x: 'xlsx', word: 'doc', excel: 'xls' }[extension] || extension) : ''
      anchor.download = file.title.toLowerCase().endsWith(suffix) ? file.title : file.title + suffix
      document.body.appendChild(anchor)
      try { anchor.click() } finally { anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000) }
    } catch { setError('Unable to download this file. Please try again.') }
    finally { setBusy(false) }
  }
  return <li className="designReview__file">
    <div className="designReview__fileName"><FiFileText aria-hidden="true" /><span>{file.title}<small>{file.fileType}</small></span></div>
    <div className="designReview__actions">
      <button type="button" disabled={busy} onClick={() => void download()} aria-label={'Download ' + file.title}>{busy ? 'Downloading…' : 'Download'} <FiDownload aria-hidden="true" /></button>
    </div>
    {error && <p role="alert" className="designReview__error">{error}</p>}
  </li>
}
function InvoiceCard({ leadId, invoice, state, highlighted }: { leadId: string; invoice: Invoice; state: ReturnType<typeof useProformaApprovals>; highlighted: boolean }) {
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
  return <article ref={ref} tabIndex={-1} className={'designReview__card' + (highlighted ? ' is-highlighted' : '')} aria-label={invoice.name}>
    <header className="designReview__header"><div><p className="designReview__eyebrow">{invoice.opportunityName}</p><h3>{invoice.name}</h3></div><span className="designReview__status">{invoice.status === 'Sent' ? 'Awaiting your review' : invoice.status}</span></header>
    <div className="designReview__body">
      {!invoice.secureToken && <p role="alert">This invoice is temporarily unavailable. Please contact the Arelia team.</p>}
      {invoice.secureToken && <div>
        {loading ? <p role="status">Loading invoice…</p> : fileError ? <p role="alert">{fileError}</p> : <>
          <h4 className="proformaReview__filesHeading">Invoice and supporting files</h4>
          {details?.files.length ? <ul className="designReview__files">{details.files.map(file => <InvoiceAttachment key={file.fileVersionId} leadId={leadId} invoice={details} file={file} />)}</ul> : <p>No invoice files have been attached yet.</p>}
        </>}
      </div>}
      {invoice.status !== 'Sent' && <div className="designReview__decision"><div><strong>Response recorded: {invoice.status}</strong>{invoice.comments && <p>{invoice.comments}</p>}</div></div>}
      {canRespond && !mode && <div className="designReview__actions"><button type="button" className="designReview__primary" disabled={state.busy} onClick={() => setMode('Approved')}>Approve invoice</button><button type="button" disabled={state.busy} onClick={() => setMode('Changes Requested')}>Request changes</button></div>}
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
    </div>
  </article>
}
export function ProformaApprovals({ leadId, state, highlightId }: { leadId: string; state: ReturnType<typeof useProformaApprovals>; highlightId: string | null }) {
  if (!leadId) return <div className="dashboardEmptyState">No Proforma Invoices are available for this account.</div>
  if (!state.result) return <p role="status">Loading Proforma Invoices…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  if (!state.result.invoices.length) return <div className="dashboardEmptyState">No Proforma Invoices have been sent for your review yet.</div>
  return <div className="designReview">
    <p className="designReview__intro">Review your invoice and supporting files, then approve or request changes.</p>
    {highlightId && !state.result.invoices.some(invoice => invoice.invoiceId === highlightId) && <p role="status">This invoice is no longer available for your account.</p>}
    {state.result.invoices.map(invoice => <InvoiceCard key={invoice.invoiceId} leadId={leadId} invoice={invoice} state={state} highlighted={invoice.invoiceId === highlightId} />)}
  </div>
}
