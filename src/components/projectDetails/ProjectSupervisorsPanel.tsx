import { useState } from 'react'
import { ProjectNavigation } from '../ProjectNavigation'
import type { ProjectDetailsResult } from '../../services/projectDetailsApi'
import { SupervisorInformation } from './SupervisorInformation'
import { useSupervisor } from './useSupervisor'

function ProjectSupervisor({ leadId }: { leadId: string }) {
  const supervisor = useSupervisor(leadId)
  return <SupervisorInformation leadId={leadId} result={supervisor.result} retry={supervisor.retry} />
}

export function ProjectSupervisorsPanel({ leadId, projects, loading, reload, supervisor, selectedLeadId, onSelectProject }: {
  selectedLeadId?: string; onSelectProject?: (leadId: string) => void
  leadId?: string; projects: ProjectDetailsResult | null; loading: boolean
  reload: () => void; supervisor: ReturnType<typeof useSupervisor>
}) {
  const [selectedId, setSelectedId] = useState(leadId)
  if (!leadId) return <SupervisorInformation result={null} retry={reload} />
  if (loading) return <p role="status">Loading project supervisors?</p>
  if (!projects?.success) return <div className="dashboardEmptyState">
    <p role="alert">{projects?.message || 'Unable to load projects.'}</p>
    <button type="button" className="projectDetails__submit" onClick={reload}>Retry</button>
  </div>
  const items = (projects.projects?.length ? projects.projects : [projects]).map(project => ({
    ...project, id: project.leadId || leadId,
  }))
  const selected = items.find(project => project.id === (selectedLeadId ?? selectedId)) || items[0]
  return <div className="projectDetailsList siteVisitCarousel">
    <ProjectNavigation projects={items} selectedId={selected.id} onSelect={id => { setSelectedId(id); onSelectProject?.(id) }} eyebrow="SUPERVISOR INFORMATION BY PROJECT" />
    {selected.id === leadId
      ? <SupervisorInformation leadId={leadId} result={supervisor.result} retry={supervisor.retry} />
      : <ProjectSupervisor key={selected.id} leadId={selected.id} />}
  </div>
}
