import { useCallback, useEffect, useRef, useState } from 'react'
import { getBudgetReview, submitBudgetDecision, type BudgetReview, type BudgetResult, type BudgetDecision } from '../../services/budgetReviewApi'
export function useBudgetReview(leadId: string) {
  const [state, setState] = useState<{ leadId: string; result: BudgetResult } | null>(null)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const generation = useRef(0)
  const retry = useCallback(() => setRevision(v => v + 1), [])
  useEffect(() => {
    if (!leadId) return
    let active = true
    let pending = false
    async function check() {
      if (!active || pending || lock.current || document.visibilityState === 'hidden') return
      pending = true
      const version = generation.current
      const result = await getBudgetReview(leadId)
      if (active && version === generation.current) setState({ leadId, result })
      pending = false
    }
    void check()
    const refresh = () => { void check() }
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [leadId, revision])
  async function submit(budget: BudgetReview, status: BudgetDecision, comments: string) {
    if (lock.current) return { success: false, message: 'A response is already being submitted.' }
    lock.current = true; generation.current++; setBusy(true)
    try {
      const result = await submitBudgetDecision(leadId, budget, status, comments)
      if (result.success || result.conflict) setState(previous =>
        previous?.leadId === leadId && previous.result.budget?.opportunityId === budget.opportunityId
          ? { ...previous, result: { ...previous.result, budget: { ...previous.result.budget,
            status: result.success ? status : previous.result.budget.status,
            clientRemarks: result.success ? comments.trim() || budget.clientRemarks : budget.clientRemarks, canRespond: false } } }
          : previous)
      retry()
      return result
    } finally { lock.current = false; setBusy(false) }
  }
  return { result: state?.leadId === leadId ? state.result : null, busy, retry, submit }
}
