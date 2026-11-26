import { useState } from 'react'
import { FiCalendar, FiCheck, FiCheckCircle, FiClock, FiDatabase, FiLayers, FiTag, FiUser } from 'react-icons/fi'
import { BUDGET_SENT, type BudgetDecision, type BudgetReview } from '../../services/budgetReviewApi'
import type { useBudgetReview } from './useBudgetReview'
import './DesignApprovals.css'
import './DesignLayout.css'
import './BudgetReviewLayout.css'
type State = ReturnType<typeof useBudgetReview>
const money = (value: number | null) => value == null ? 'Not available' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
function BudgetCard({ budget, state, clientName, onOpenTimeline }: { budget: BudgetReview; state: State; clientName?: string; onOpenTimeline?: () => void }) {
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
    setMode(null)
    setMessage(mode === 'Client Requested Changes' ? 'Changes submitted successfully.' : response.message)
  }
  const completed = budget.status === 'Manager Approved'
  const approved = completed || budget.status === 'Client Approved'
  const changesRequested = budget.status === 'Client Requested Changes'
  const status = approved ? 'Approved' : changesRequested ? 'Changes requested'
    : budget.status === BUDGET_SENT ? 'Awaiting your review' : 'Under review'
  const duration = budget.estimatedDuration.trim()
  const durationLabel = /^\d+(\.\d+)?$/.test(duration)
    ? duration + (Number(duration) === 1 ? ' month' : ' months')
    : duration || 'Not available'

  return <article className="designLayout budgetLayout" aria-label="Budget Review">
    <header className="designLayout__summary designLayout__panel">
      <span className="designLayout__projectIcon"><FiDatabase aria-hidden="true" /></span>
      <div><p className="designReview__eyebrow">Project</p><p className="designLayout__projectName">{budget.opportunityName}</p></div>
      <span className={'designReview__status' + (approved ? ' designLayout__approved' : '')}>{approved && <FiCheck aria-hidden="true" />}{status}</span>
    </header>

    <section className="designLayout__panel budgetLayout__overview">
      <h4>Budget overview</h4>
      <dl className="budgetLayout__metrics">
        <div>
          <dt><FiLayers aria-hidden="true" /> Client Initial Budget</dt>
          <dd className="budgetLayout__description">Preliminary budget expectations shared during project onboarding.</dd>
          <dd>{money(budget.customerBudget)}</dd>
        </div>
        <div className="budgetLayout__featured">
          <dt><FiTag aria-hidden="true" /> Client-Approved Project Budget</dt>
          <dd className="budgetLayout__description">Budget estimate following client approval of the 3D Design and Proforma Invoice.</dd>
          <dd>{money(budget.supervisorBudget)}</dd>
        </div>
        <div>
          <dt><FiCalendar aria-hidden="true" /> Estimated Duration</dt>
          <dd className="budgetLayout__description">Projected timeline from material procurement to final handover.</dd>
          <dd>{durationLabel}</dd>
        </div>
      </dl>
    </section>

    <div className="budgetLayout__sidebar">
      <section className="designLayout__approval designLayout__panel">
        <h4>Approval status</h4>
        <div className="designLayout__statusMessage">
          {approved ? <FiCheckCircle aria-hidden="true" /> : <FiClock aria-hidden="true" />}
          <div>
            <strong>{approved ? 'Budget approved' : status}</strong>
            <p>{approved ? 'The budget has been reviewed and approved by the client.' : changesRequested
              ? 'Your requested changes have been submitted.' : budget.canRespond ? 'Review the budget and submit your response.' : 'The budget is being reviewed.'}</p>
          </div>
        </div>
        {approved && clientName?.trim() && <dl className="designLayout__details">
          <div><dt><FiUser aria-hidden="true" /> Approved by</dt><dd>{clientName}</dd></div>
        </dl>}
        {budget.status !== BUDGET_SENT && budget.clientRemarks && <p className="designLayout__comments">{budget.clientRemarks}</p>}
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
      </section>

      <section className="designLayout__progress designLayout__panel">
        <h4>Project progress</h4>
        <ol className="designLayout__steps">
          <li><span>Previous stage</span><i aria-hidden="true">5</i><span>Proforma Invoice</span></li>
          <li aria-current={completed ? undefined : 'step'} className={completed ? 'designLayout__completedStep' : undefined}>
            <span>{completed ? 'Completed' : 'Current stage'}</span>
            <i aria-hidden="true">{completed ? <FiCheck /> : '6'}</i>
            <span>Budget Review</span>
          </li>
          <li><span>Next stage</span><i aria-hidden="true">7</i><span>Payment Terms</span></li>
        </ol>
      </section>
    </div>

    {completed && <footer className="designLayout__next designLayout__panel">
      <strong>What's next?</strong>
      <p>The next stage is Payment Terms Approval.</p>
      {onOpenTimeline && <button type="button" onClick={onOpenTimeline}><FiCalendar aria-hidden="true" /> View project timeline</button>}
    </footer>}
  </article>
}
export function BudgetReviewApprovals({ leadId, state, clientName, onOpenTimeline }: { leadId: string; state: State; clientName?: string; onOpenTimeline?: () => void }) {
  if (!leadId) return <div className="dashboardEmptyState">No Budget Review is available for this account.</div>
  if (!state.result) return <p role="status">Loading Budget Review…</p>
  if (!state.result.success) return <div className="designReview"><p role="alert">{state.result.message}</p><button type="button" onClick={state.retry}>Retry</button></div>
  if (!state.result.budget) return <div className="dashboardEmptyState">No Budget Review has been sent for your approval yet.</div>
  return <div className="designReview"><BudgetCard key={state.result.budget.opportunityId} budget={state.result.budget} state={state} clientName={clientName} onOpenTimeline={onOpenTimeline} /></div>
}
