import { useCallback, useEffect, useRef, useState } from 'react'
import { getSiteVisit, getSiteVisitReport, respondToSiteVisit, type Appointment, type VisitReport } from '../../services/siteVisitApi'
export function useSiteVisit(leadId?: string) {
  const [state, setState] = useState<{ leadId: string; appointment: Appointment | null; report: VisitReport | null } | null>(null)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const generation = useRef(0)
  const retry = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    if (!leadId) return
    let active = true
    let pending = false
    async function check() {
      if (!active || pending || locked.current || document.visibilityState === 'hidden') return
      pending = true
      const current = generation.current
      const [appointment, report] = await Promise.all([getSiteVisit(leadId!), getSiteVisitReport(leadId!)])
      if (active && current === generation.current) setState({ leadId: leadId!, appointment, report })
      pending = false
    }
    void check()
    const timer = window.setInterval(() => { void check() }, 30_000)
    const refresh = () => { void check() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [leadId, revision])
  async function submit(response: 'Approved' | 'Rescheduled', date?: string, slot?: string) {
    if (!leadId || locked.current) return { success: false, message: 'Please wait for the current request.' }
    locked.current = true
    generation.current++
    setBusy(true)
    try {
      const result = await respondToSiteVisit(leadId, response, date, slot)
      if (result.success) setState(previous => previous?.leadId === leadId ? { ...previous, appointment: { ...previous.appointment, ...result } } : previous)
      // Re-fetch authoritative state, including conflicts from another browser.
      retry()
      return result
    } finally { locked.current = false; setBusy(false) }
  }
  return { appointment: state?.leadId === leadId ? state?.appointment ?? null : null, report: state?.leadId === leadId ? state?.report ?? null : null, retry, submit, busy }
}
