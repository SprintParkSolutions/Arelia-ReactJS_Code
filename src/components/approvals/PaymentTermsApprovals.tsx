import { useId, useState } from 'react'
import { FiCalendar, FiCheck, FiCheckCircle, FiClock, FiCreditCard, FiUser } from 'react-icons/fi'
import { PAYMENT_SENT, type PaymentDecision, type PaymentReview } from '../../services/paymentTermsApi'
import type { usePaymentReview } from './usePaymentReview'
import './DesignApprovals.css'
import './DesignLayout.css'
import './PaymentTermsLayout.css'
type State = ReturnType<typeof usePaymentReview>
function dueDate(value: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Not available'
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
function PaymentCard({ payment, state, clientName, onOpenTimeline }: { payment: PaymentReview; state: State; clientName?: string; onOpenTimeline?: () => void }) {
  const scheduleHeadingId = useId()
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
    setMode(null); if (mode === 'Client Requested Changes') setMessage(response.message)
  }
  const completed = payment.status === 'Client Approved'
  const changesRequested = payment.status === 'Client Requested Changes'
  const status = completed ? 'Approved' : changesRequested ? 'Changes requested' : 'Awaiting your review'

  return <article className="designLayout paymentLayout" aria-label="Payment Terms">
    <div className="designLayout__main">
      <header className="designLayout__summary designLayout__panel">
        <span className="designLayout__projectIcon"><FiCreditCard aria-hidden="true" /></span>
        <div><p className="designReview__eyebrow">Project</p><p className="designLayout__projectName">{payment.opportunityName}</p></div>
        <span className={'designReview__status' + (completed ? ' designLayout__approved' : '')}>{completed && <FiCheck aria-hidden="true" />}{status}</span>
      </header>

      <section className="designLayout__panel paymentLayout__schedule">
        <h4 id={scheduleHeadingId}>Payment schedule</h4>
        {payment.terms.length ? <div className="paymentReview__tableWrap">
          <table className="paymentReview__table" aria-labelledby={scheduleHeadingId}>
            <thead><tr><th scope="col">Payment Term</th><th scope="col">Percentage</th><th scope="col">Due Date</th></tr></thead>
            <tbody>{payment.terms.map(term => <tr key={term.id}>
              <th scope="row">{term.label}</th>
              <td>{term.percentage == null ? 'Not available' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(term.percentage) + '%'}</td>
              <td>{dueDate(term.dueDate)}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p>No payment terms have been added yet.</p>}
      </section>
    </div>

    <div className="designLayout__sidebar">
      <section className="designLayout__approval designLayout__panel">
        <h4>Approval status</h4>
        <div className="designLayout__statusMessage" role="status">
          {completed ? <FiCheckCircle aria-hidden="true" /> : <FiClock aria-hidden="true" />}
          <div>
            <strong>{completed ? 'Payment terms approved' : status}</strong>
            <p>{completed ? 'The payment terms have been reviewed and approved by the client.'
              : changesRequested ? 'Your requested changes have been submitted.'
              : payment.canRespond ? 'Review the payment schedule and submit your response.' : 'The payment schedule is unavailable for review.'}</p>
          </div>
        </div>
        {completed && clientName?.trim() && <dl className="designLayout__details">
          <div><dt><FiUser aria-hidden="true" /> Approved by</dt><dd>{clientName}</dd></div>
        </dl>}
        {payment.status !== PAYMENT_SENT && payment.clientRemarks && <p className="designLayout__comments">{payment.clientRemarks}</p>}
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
      </section>

      <section className="designLayout__progress designLayout__panel">
        <h4>Project progress</h4>
        <ol className="designLayout__steps">
          <li><span>Previous stage</span><i aria-hidden="true">6</i><span>Budget Review</span></li>
          <li aria-current={completed ? undefined : 'step'} className={completed ? 'designLayout__completedStep' : undefined}>
            <span>{completed ? 'Completed' : 'Current stage'}</span>
            <i aria-hidden="true">{completed ? <FiCheck /> : '7'}</i>
            <span>Payment Terms</span>
          </li>
          <li><span>Next stage</span><i aria-hidden="true">8</i><span>Client Agreement</span></li>
        </ol>
      </section>
    </div>

    {completed && <footer className="designLayout__next designLayout__panel">
      <strong>What's next?</strong>
      <p>Your payment terms are finalized. Review and sign the Client Agreement to proceed.</p>
      {onOpenTimeline && <button type="button" onClick={onOpenTimeline}><FiCalendar aria-hidden="true" /> View project timeline</button>}
    </footer>}
  </article>
}
export function PaymentTermsApprovals({ leadId, state, clientName, onOpenTimeline }: { leadId: string; state: State; clientName?: string; onOpenTimeline?: () => void }) {
  if (!leadId) return <div className="dashboardEmptyState">No Payment Terms are available for this account.</div>
  if (!state.result) return <p role="status">Loading Payment Terms…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  if (!state.result.payment) return <div className="dashboardEmptyState">No Payment Terms have been sent for your approval yet.</div>
  return <div className="designReview"><PaymentCard key={state.result.payment.opportunityId} payment={state.result.payment} state={state} clientName={clientName} onOpenTimeline={onOpenTimeline} /></div>
}
