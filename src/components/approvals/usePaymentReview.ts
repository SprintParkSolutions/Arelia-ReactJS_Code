import { useCallback, useEffect, useRef, useState } from 'react'
import { getPaymentReview, submitPaymentDecision, type PaymentReview, type PaymentResult, type PaymentDecision } from '../../services/paymentTermsApi'
export function usePaymentReview(leadId: string) {
  const [state, setState] = useState<{ leadId: string; result: PaymentResult } | null>(null)
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
      const result = await getPaymentReview(leadId)
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
  async function submit(payment: PaymentReview, status: PaymentDecision, comments: string) {
    if (lock.current) return { success: false, message: 'A response is already being submitted.' }
    lock.current = true; generation.current++; setBusy(true)
    try {
      const result = await submitPaymentDecision(leadId, payment, status, comments)
      if (result.success || result.conflict) setState(previous =>
        previous?.leadId === leadId && previous.result.payment?.opportunityId === payment.opportunityId
          ? { ...previous, result: { ...previous.result, payment: { ...previous.result.payment,
            status: result.success ? status : previous.result.payment.status,
            clientRemarks: result.success ? comments.trim() : payment.clientRemarks, canRespond: false } } }
          : previous)
      retry()
      return result
    } finally { lock.current = false; setBusy(false) }
  }
  return { result: state?.leadId === leadId ? state.result : null, busy, retry, submit }
}
