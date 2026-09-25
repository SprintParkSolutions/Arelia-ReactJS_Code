import { ProjectDetailsForm } from './ProjectDetailsForm'
import type { ProjectDetailsResult } from '../../services/projectDetailsApi'

const emptyProject: ProjectDetailsResult = {
  success: true, message: '', projectSubmitted: false,
  details: { siteSpace: '', typeOfProject: '', projectScope: '', planLevel: '', customerBudget: '', siteLocation: '', projectDescription: '' },
}

export function ProjectDetailsPanel({ leadId, result, addingProject, onCancel, onSaved, reload }: {
  leadId: string; result: ProjectDetailsResult; addingProject: boolean
  onCancel: () => void; onSaved: () => void; reload: () => void
}) {
  if (addingProject) return <>
    <ProjectDetailsForm key="new-project" leadId={leadId} result={emptyProject} createNewProject onSaved={onSaved} reload={reload} />
    <button type="button" className="projectDetails__submit" onClick={onCancel}>Back to projects</button>
  </>
  const projects = result.projects?.length ? result.projects : [result]
  return <div className="projectDetailsList">
    {projects.map((project, index) => <div key={project.leadId || leadId}>
      {projects.length > 1 && <h2 className="dashboardSection__title">Project {index + 1}</h2>}
      <ProjectDetailsForm leadId={project.leadId || leadId} result={project} onSaved={onSaved} reload={reload} />
    </div>)}
  </div>
}
