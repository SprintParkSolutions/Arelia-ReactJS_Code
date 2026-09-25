import type { ProjectDetailsResult } from '../../services/projectDetailsApi'
import { SupervisorInformation } from './SupervisorInformation'
import { useSupervisor } from './useSupervisor'

function ProjectSupervisor({ leadId }: { leadId: string }) {
  const supervisor = useSupervisor(leadId)
  return <SupervisorInformation leadId={leadId} result={supervisor.result} retry={supervisor.retry} />
}

export function ProjectSupervisorsPanel({ leadId, projects, loading, reload, supervisor }: {
  leadId?: string; projects: ProjectDetailsResult | null; loading: boolean
  reload: () => void; supervisor: ReturnType<typeof useSupervisor>
}) {
  if (!leadId) return <SupervisorInformation result={null} retry={reload} />
  if (loading) return <p role="status">Loading project supervisors?</p>
  if (!projects?.success) return <div className="dashboardEmptyState">
    <p role="alert">{projects?.message || 'Unable to load projects.'}</p>
    <button type="button" className="projectDetails__submit" onClick={reload}>Retry</button>
  </div>
  const items = projects.projects?.length ? projects.projects : [projects]
  return <div className="projectDetailsList">
    {items.map((project, index) => {
      const projectLeadId = project.leadId || leadId
      return <div key={projectLeadId}>
        {items.length > 1 && <h2 className="dashboardSection__title">Project {index + 1}</h2>}
        {projectLeadId === leadId
          ? <SupervisorInformation leadId={leadId} result={supervisor.result} retry={supervisor.retry} />
          : <ProjectSupervisor leadId={projectLeadId} />}
      </div>
    })}
  </div>
}
