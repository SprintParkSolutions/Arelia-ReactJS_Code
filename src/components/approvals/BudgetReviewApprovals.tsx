import { useState } from 'react'
import { BUDGET_SENT, type BudgetDecision, type BudgetReview } from '../../services/budgetReviewApi'
import type { useBudgetReview } from './useBudgetReview'
import './DesignApprovals.css'
type State = ReturnType<typeof useBudgetReview>
const money = (value: number | null) => value == null ? 'Not available' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)
function BudgetCard({ budget, state }: { budget: BudgetReview; state: State }) {
  const [mode, setMode] = useState<BudgetDecision | null>(null)
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function submit() {
    if (!mode || state.busy) return
    if (mode === 'Client Requested Changes' && !comments.trim()) { setError('Please describe the changes you need.'); return }
    setError(''); setMessage('')
    const response = await state.submit(budget, mode, comments)
    if (!response.success) { setError(response.message); return }
    setMode(null); setMessage(response.message)
  }
  return <article className="designReview__card" aria-label="Budget Review">
    <header className="designReview__header"><div><p className="designReview__eyebrow">{budget.opportunityName}</p><h3>Budget Review</h3></div><span className="designReview__status">{budget.status === BUDGET_SENT ? 'Awaiting your review' : budget.status}</span></header>
    <div className="designReview__body">
      <dl className="budgetReview__details">
        <div><dt>Customer Budget</dt><dd>{money(budget.customerBudget)}</dd></div>
        <div><dt>Supervisor Budget</dt><dd>{money(budget.supervisorBudget)}</dd></div>
        <div><dt>Estimated Duration</dt><dd>{budget.estimatedDuration ? (/^[0-9.]+$/.test(budget.estimatedDuration.trim()) ? budget.estimatedDuration + (Number(budget.estimatedDuration) === 1 ? ' month' : ' months') : budget.estimatedDuration) : 'Not available'}</dd></div>
      </dl>
      {budget.status !== BUDGET_SENT && <div className="designReview__decision"><div><strong>{budget.status}</strong>{budget.clientRemarks && <p>{budget.clientRemarks}</p>}</div></div>}
      {budget.canRespond && !mode && <div className="designReview__actions"><button type="button" className="designReview__primary" disabled={state.busy} onClick={() => setMode('Client Approved')}>Approve budget</button><button type="button" disabled={state.busy} onClick={() => setMode('Client Requested Changes')}>Request changes</button></div>}
      {budget.canRespond && mode && <form onSubmit={event => { event.preventDefault(); void submit() }}>
        <fieldset disabled={state.busy}><legend>{mode === 'Client Approved' ? 'Confirm budget approval' : 'Request budget changes'}</legend>
          <p>Please review the budget before confirming. Your response will be recorded for the Arelia team.</p>
          <label htmlFor="budget-comments">{mode === 'Client Approved' ? 'Comments (optional)' : 'Client comments (required)'}</label>
          <textarea id="budget-comments" rows={4} value={comments} required={mode === 'Client Requested Changes'} onChange={event => setComments(event.target.value)} />
          <div className="designReview__actions"><button type="submit" className="designReview__primary">{state.busy ? 'Submitting…' : mode === 'Client Approved' ? 'Confirm approval' : 'Submit change request'}</button><button type="button" onClick={() => setMode(null)}>Cancel</button></div>
        </fieldset>
      </form>}
      {error && <p role="alert" className="designReview__error">{error}</p>}
      {message && <p role="status">{message}</p>}
    </div>
  </article>
}
export function BudgetReviewApprovals({ leadId, state }: { leadId: string; state: State }) {
  if (!leadId) return <div className="dashboardEmptyState">No Budget Review is available for this account.</div>
  if (!state.result) return <p role="status">Loading Budget Review…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  if (!state.result.budget) return <div className="dashboardEmptyState">No Budget Review has been sent for your approval yet.</div>
  return <div className="designReview"><p className="designReview__intro">Review your project budget and estimated duration, then approve or share the changes you need.</p><BudgetCard key={state.result.budget.opportunityId} budget={state.result.budget} state={state} /></div>
}
