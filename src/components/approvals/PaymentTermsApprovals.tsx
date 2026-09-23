import { useState } from 'react'
import { PAYMENT_SENT, type PaymentDecision, type PaymentReview } from '../../services/paymentTermsApi'
import type { usePaymentReview } from './usePaymentReview'
import './DesignApprovals.css'
type State = ReturnType<typeof usePaymentReview>
function dueDate(value: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Not available'
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
function PaymentCard({ payment, state }: { payment: PaymentReview; state: State }) {
  const [mode, setMode] = useState<PaymentDecision | null>(null)
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function submit() {
    if (!mode || state.busy) return
    if (mode === 'Client Requested Changes' && !comments.trim()) { setError('Please describe the changes you need.'); return }
    setError(''); setMessage('')
    const response = await state.submit(payment, mode, comments)
    if (!response.success) { setError(response.message); return }
    setMode(null); setMessage(response.message)
  }
  return <article className="designReview__card" aria-label="Payment Terms">
    <header className="designReview__header"><div><p className="designReview__eyebrow">{payment.opportunityName}</p><h3>Payment Terms</h3></div><span className="designReview__status">{payment.status === PAYMENT_SENT ? 'Awaiting your review' : payment.status}</span></header>
    <div className="designReview__body">
      {payment.terms.length ? <div className="paymentReview__tableWrap">
        <table className="paymentReview__table">
          <caption className="paymentReview__caption">Payment schedule</caption>
          <thead><tr><th scope="col">Payment Term</th><th scope="col">Percentage</th><th scope="col">Due Date</th></tr></thead>
          <tbody>{payment.terms.map(term => <tr key={term.id}>
            <th scope="row">{term.label}</th>
            <td>{term.percentage == null ? 'Not available' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(term.percentage) + '%'}</td>
            <td>{dueDate(term.dueDate)}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p>No payment terms have been added yet.</p>}
      {payment.status !== PAYMENT_SENT && <div className="designReview__decision"><div><strong>{payment.status}</strong>{payment.clientRemarks && <p>{payment.clientRemarks}</p>}</div></div>}
      {payment.canRespond && !mode && <div className="designReview__actions"><button type="button" className="designReview__primary" disabled={state.busy} onClick={() => setMode('Client Approved')}>Approve payment terms</button><button type="button" disabled={state.busy} onClick={() => setMode('Client Requested Changes')}>Request changes</button></div>}
      {payment.canRespond && mode && <form onSubmit={event => { event.preventDefault(); void submit() }}>
        <fieldset disabled={state.busy}><legend>{mode === 'Client Approved' ? 'Confirm payment terms approval' : 'Request payment terms changes'}</legend>
          <p>Please review the payment terms before confirming. Your response will be recorded for the Arelia team.</p>
          <label htmlFor="payment-comments">{mode === 'Client Approved' ? 'Comments (optional)' : 'Client comments (required)'}</label>
          <textarea id="payment-comments" rows={4} value={comments} required={mode === 'Client Requested Changes'} onChange={event => setComments(event.target.value)} />
          <div className="designReview__actions"><button type="submit" className="designReview__primary">{state.busy ? 'Submitting…' : mode === 'Client Approved' ? 'Confirm approval' : 'Submit change request'}</button><button type="button" onClick={() => setMode(null)}>Cancel</button></div>
        </fieldset>
      </form>}
      {error && <p role="alert" className="designReview__error">{error}</p>}
      {message && <p role="status">{message}</p>}
    </div>
  </article>
}
export function PaymentTermsApprovals({ leadId, state }: { leadId: string; state: State }) {
  if (!leadId) return <div className="dashboardEmptyState">No Payment Terms are available for this account.</div>
  if (!state.result) return <p role="status">Loading Payment Terms…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  if (!state.result.payment) return <div className="dashboardEmptyState">No Payment Terms have been sent for your approval yet.</div>
  return <div className="designReview"><p className="designReview__intro">Review your payment schedule, then approve or share the changes you need.</p><PaymentCard key={state.result.payment.opportunityId} payment={state.result.payment} state={state} /></div>
}
