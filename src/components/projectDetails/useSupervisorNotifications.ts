import { useEffect, useState } from 'react'
import type { ProjectDetailsResult } from '../../services/projectDetailsApi'
import { getSupervisor, type SupervisorResult } from '../../services/supervisorApi'
import { useProjectNotifications } from './useProjectReminder'

export function useSupervisorNotifications(leadId: string | undefined, projects: ProjectDetailsResult | null | undefined, primary: SupervisorResult | null) {
  const items = projects?.projects?.length ? projects.projects : leadId ? [{ leadId }] : []
  const ids = JSON.stringify(items.map(project => project.leadId).filter((id): id is string => Boolean(id && id !== leadId)))
  const [observed, setObserved] = useState<{ account: string; results: Record<string, SupervisorResult> } | null>(null)
  useEffect(() => {
    if (!leadId) return
    const projectIds: string[] = JSON.parse(ids)
    if (!projectIds.length) return
    let active = true
    const pending = new Set<string>()
    async function check(id: string) {
      if (!active || pending.has(id) || document.visibilityState === 'hidden') return
      pending.add(id)
      try {
        const result = await getSupervisor(id)
        if (active && result.success) setObserved(previous => ({
          account: leadId!, results: { ...(previous && previous.account === leadId ? previous.results : {}), [id]: result },
        }))
      } finally { pending.delete(id) }
    }
    const refresh = () => { projectIds.forEach(id => { void check(id) }) }
    refresh()
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [leadId, ids])
  return useProjectNotifications(items.map((project, index) => {
    const result = project.leadId === leadId ? primary
      : observed && observed.account === leadId && project.leadId ? observed.results[project.leadId] : null
    const name = result?.supervisorUser?.trim()
    return {
      leadId: project.leadId, needed: Boolean(result?.success && result.assigned),
      message: `${items.length > 1 ? `Project ${index + 1}: ` : ''}${name ? `${name} has been assigned as your project supervisor.` : 'A supervisor has been assigned to your project.'}`,
    }
  }), 'supervisorAssignedNotification', 'supervisor-assigned', 'supervisor')
}
