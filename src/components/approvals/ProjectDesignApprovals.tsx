import type { ProjectDetailsResult } from '../../services/projectDetailsApi'
import { useState } from 'react'
import { ProjectNavigation } from '../ProjectNavigation'
import { DesignApprovals } from './DesignApprovals'
import type { useDesignApprovals } from './useDesignApprovals'
export function ProjectDesignApprovals({ contactId, state, highlightId, onProjectChange, projectLeadIds, accountProjects }: {
  accountProjects?: ProjectDetailsResult[]
  projectLeadIds?: string[]
  contactId: string; state: ReturnType<typeof useDesignApprovals>; highlightId: string | null; onProjectChange?: () => void
}) {
  const [selection, setSelection] = useState<{ id: string; highlight: string | null } | null>(null)
  const designResult = contactId ? state.result : { success: true, message: '', designs: [], projects: [] }
  const mappedProjects = accountProjects?.flatMap(project => project.leadId
    ? [{ id: project.leadId, opportunityId: project.convertedOpportunityId }]
    : []) || []
  const projects: { id: string; opportunityId?: string }[] = mappedProjects.length
    ? mappedProjects
    : [...(designResult?.projects || [])].map(project => ({ id: project.id, opportunityId: project.id }))
  if (!mappedProjects.length) {
    for (const design of designResult?.designs || []) {
      if (!projects.some(project => project.opportunityId === design.opportunityId)) {
        projects.push({ id: design.opportunityId, opportunityId: design.opportunityId })
      }
    }
    if (!designResult?.designs.length && projectLeadIds?.length) {
      projects.length = 0
      projects.push(...[...new Set(projectLeadIds)].map(id => ({ id })))
    }
  }
  if (!designResult?.success || !projects.length) return <DesignApprovals contactId={contactId} state={state} highlightId={highlightId} />
  const highlightedOpportunity = designResult.designs.find(design => design.designId === highlightId)?.opportunityId
  const highlighted = highlightedOpportunity
    ? projects.find(project => project.opportunityId === highlightedOpportunity)?.id
    : undefined
  const requested = selection?.highlight === highlightId ? selection.id : highlighted
  const selected = projects.find(project => project.id === requested) || projects[0]
  const result = { ...designResult, designs: designResult.designs.filter(design => design.opportunityId === selected.opportunityId) }
  return <section className="siteVisitCarousel" aria-label="3D designs by project">
    <ProjectNavigation projects={projects} selectedId={selected.id} onSelect={id => { setSelection({ id, highlight: onProjectChange ? null : highlightId }); onProjectChange?.() }} eyebrow="3D DESIGNS BY PROJECT" />
    <DesignApprovals key={selected.id} contactId={contactId} state={{ ...state, result }} highlightId={highlighted === selected.id ? highlightId : null} />
  </section>
}
