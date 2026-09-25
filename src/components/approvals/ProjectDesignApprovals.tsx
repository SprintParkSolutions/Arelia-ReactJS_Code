import { useState } from 'react'
import { ProjectNavigation } from '../ProjectNavigation'
import { DesignApprovals } from './DesignApprovals'
import type { useDesignApprovals } from './useDesignApprovals'
export function ProjectDesignApprovals({ contactId, state, highlightId, onProjectChange }: {
  contactId: string; state: ReturnType<typeof useDesignApprovals>; highlightId: string | null; onProjectChange?: () => void
}) {
  const [selection, setSelection] = useState<{ id: string; highlight: string | null } | null>(null)
  const projects = [...(state.result?.projects || [])]
  for (const design of state.result?.designs || []) {
    if (!projects.some(project => project.id === design.opportunityId)) projects.push({ id: design.opportunityId, name: design.opportunityName })
  }
  if (!state.result?.success || !projects.length) return <DesignApprovals contactId={contactId} state={state} highlightId={highlightId} />
  const highlighted = state.result.designs.find(design => design.designId === highlightId)?.opportunityId
  const requested = selection?.highlight === highlightId ? selection.id : highlighted
  const selected = projects.find(project => project.id === requested) || projects[0]
  const result = { ...state.result, designs: state.result.designs.filter(design => design.opportunityId === selected.id) }
  return <section className="siteVisitCarousel" aria-label="3D designs by project">
    <ProjectNavigation projects={projects} selectedId={selected.id} onSelect={id => { setSelection({ id, highlight: onProjectChange ? null : highlightId }); onProjectChange?.() }} eyebrow="3D DESIGNS BY PROJECT" />
    <DesignApprovals key={selected.id} contactId={contactId} state={{ ...state, result }} highlightId={highlighted === selected.id ? highlightId : null} />
  </section>
}
