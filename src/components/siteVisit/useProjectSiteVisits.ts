import { useCallback, useEffect, useRef, useState } from 'react'
import { getSiteVisit, getSiteVisitReport, respondToSiteVisit, type Appointment, type VisitReport } from '../../services/siteVisitApi'
import type { ProjectDetailsResult } from '../../services/projectDetailsApi'

type Visit = { appointment: Appointment | null; report: VisitReport | null; busy: boolean }
export function useProjectSiteVisits(accountId: string | undefined, projects?: ProjectDetailsResult | null) {
  const ids = JSON.stringify([...new Set((projects?.projects?.length ? projects.projects.map(project => project.leadId) : [accountId]).filter((id): id is string => Boolean(id)))])
  const [state, setState] = useState<{ accountId?: string; visits: Record<string, Visit> }>({ visits: {} })
  const operations = useRef(new Map<string, { pending: boolean; busy: boolean; generation: number }>())
  const refreshRef = useRef<(id?: string) => void>(() => {})
  const epoch = useRef(0)
  useEffect(() => {
    const currentEpoch = ++epoch.current
    const leadIds: string[] = JSON.parse(ids)
    operations.current = new Map(leadIds.map(id => [id, { pending: false, busy: false, generation: 0 }]))
    let active = true
    async function check(id: string) {
      const operation = operations.current.get(id)
      if (!active || !operation || operation.pending || operation.busy || document.visibilityState === 'hidden') return
      operation.pending = true
      const generation = operation.generation
      try {
        const [appointment, report] = await Promise.all([getSiteVisit(id), getSiteVisitReport(id)])
        if (active && epoch.current === currentEpoch && generation === operation.generation) {
          setState(previous => ({ accountId, visits: { ...(previous.accountId === accountId ? previous.visits : {}), [id]: { appointment, report, busy: false } } }))
        }
      } finally {
        operation.pending = false
        if (active && generation !== operation.generation && !operation.busy) void check(id)
      }
    }
    const refresh = (id?: string) => { (id ? leadIds.filter(value => value === id) : leadIds).forEach(value => { void check(value) }) }
    refreshRef.current = refresh
    refresh()
    const onVisible = () => refresh()
    const timer = window.setInterval(onVisible, 30_000)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; epoch.current = currentEpoch + 1; window.clearInterval(timer); window.removeEventListener('focus', onVisible); document.removeEventListener('visibilitychange', onVisible) }
  }, [accountId, ids])
  const submit = useCallback(async (id: string, response: 'Approved' | 'Rescheduled', date?: string, slot?: string) => {
    const operation = operations.current.get(id)
    if (!operation || operation.busy) return { success: false, message: 'Please wait for the current request.' }
    const currentEpoch = epoch.current
    operation.busy = true
    operation.generation++
    const update = (result?: Appointment) => {
      if (epoch.current !== currentEpoch) return
      setState(previous => {
        const visit = previous.accountId === accountId ? previous.visits[id] : null
        return visit ? { ...previous, visits: { ...previous.visits, [id]: { ...visit, busy: operation.busy,
          appointment: result?.success ? { ...visit.appointment, ...result } : visit.appointment } } } : previous
      })
    }
    update()
    try {
      const result = await respondToSiteVisit(id, response, date, slot)
      update(result)
      return result
    } finally {
      operation.busy = false
      update()
      if (epoch.current === currentEpoch) refreshRef.current(id)
    }
  }, [accountId])
  const leadIds: string[] = JSON.parse(ids)
  return leadIds.map(leadId => ({ leadId,
    appointment: state.accountId === accountId ? state.visits[leadId]?.appointment ?? null : null,
    report: state.accountId === accountId ? state.visits[leadId]?.report ?? null : null,
    busy: state.accountId === accountId && Boolean(state.visits[leadId]?.busy),
    retry: () => refreshRef.current(leadId),
    submit: (response: 'Approved' | 'Rescheduled', date?: string, slot?: string) => submit(leadId, response, date, slot),
  }))
}
