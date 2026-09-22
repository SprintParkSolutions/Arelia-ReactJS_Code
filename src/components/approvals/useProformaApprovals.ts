import { useCallback, useEffect, useRef, useState } from 'react'
import { getProformaInvoices, submitProformaDecision, type Invoice, type InvoicesResult } from '../../services/proformaApi'
export function useProformaApprovals(leadId: string) {
  const [state, setState] = useState<{ leadId: string; result: InvoicesResult } | null>(null)
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
      const result = await getProformaInvoices(leadId)
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
  async function submit(invoice: Invoice, status: 'Approved' | 'Changes Requested', comments: string) {
    if (lock.current) return { success: false, message: 'A response is already being submitted.' }
    lock.current = true; generation.current++; setBusy(true)
    try {
      const result = await submitProformaDecision(leadId, invoice, status, comments)
      if (result.success || result.conflict) {
        setState(previous => previous?.leadId === leadId ? { ...previous, result: { ...previous.result, invoices: previous.result.invoices.map(d => d.invoiceId === invoice.invoiceId ? { ...d, status: result.success ? status : d.status, comments: result.success ? comments.trim() || invoice.comments : d.comments, canApprove: false, canRequestChanges: false } : d) } } : previous)
      }
      retry()
      return result
    } finally { lock.current = false; setBusy(false) }
  }
  return { result: state?.leadId === leadId ? state?.result ?? null : null, busy, retry, submit }
}
