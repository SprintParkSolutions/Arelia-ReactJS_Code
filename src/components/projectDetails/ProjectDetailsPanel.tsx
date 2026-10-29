import { useState } from 'react'
import { ProjectNavigation } from '../ProjectNavigation'
import { ProjectDetailsForm } from './ProjectDetailsForm'
import type { ProjectDetailsResult } from '../../services/projectDetailsApi'

const emptyProject: ProjectDetailsResult = {
  success: true, message: '', projectSubmitted: false,
  details: { siteSpace: '', typeOfProject: '', projectScope: '', planLevel: '', customerBudget: '', siteLocation: '', projectDescription: '' },
}

export function ProjectDetailsPanel({ leadId, result, addingProject, onCancel, onSaved, reload, selectedLeadId, onSelectProject }: {
  leadId: string; result: ProjectDetailsResult; addingProject: boolean
  selectedLeadId?: string; onSelectProject?: (leadId: string) => void
  onCancel: () => void; onSaved: () => void; reload: () => void
}) {
  const [selectedId, setSelectedId] = useState(leadId)
  if (addingProject && result.projectSubmitted === true) return <>
    <ProjectDetailsForm key="new-project" leadId={leadId} result={emptyProject} createNewProject onSaved={onSaved} reload={reload} />
    <button type="button" className="projectDetails__submit" onClick={onCancel}>Back to projects</button>
  </>
  const projects = (result.projects?.length ? result.projects : [result]).map(project => ({
    ...project, id: project.leadId || leadId,
  }))
  const selected = projects.find(project => project.id === (selectedLeadId ?? selectedId)) || projects[0]
  return <div className="projectDetailsList siteVisitCarousel">
    <ProjectNavigation projects={projects} selectedId={selected.id} onSelect={id => { setSelectedId(id); onSelectProject?.(id) }} eyebrow="PROJECT DETAILS BY PROJECT" />
    <ProjectDetailsForm key={selected.id} leadId={selected.id} result={selected} onSaved={onSaved} reload={reload} />
  </div>
}
