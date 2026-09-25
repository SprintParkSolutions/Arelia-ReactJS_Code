import { useState } from 'react'
import { ProjectNavigation } from '../ProjectNavigation'
import { BudgetReviewApprovals } from './BudgetReviewApprovals'
import type { useBudgetReview } from './useBudgetReview'
export function ProjectBudgetReviewApprovals({ leadId, state, highlightId, onProjectChange }: {
  leadId: string; state: ReturnType<typeof useBudgetReview>; highlightId: string | null; onProjectChange: () => void
}) {
  const [selection, setSelection] = useState<{ id: string; highlight: string | null } | null>(null)
  const projects = state.result?.projects
  if (!state.result?.success || !projects?.length) return <BudgetReviewApprovals leadId={leadId} state={state} />
  const highlighted = projects.find(project => project.result.budget?.opportunityId === highlightId)?.id
  const requested = selection?.highlight === highlightId ? selection.id : highlighted
  const selected = projects.find(project => project.id === requested) || projects[0]
  return <section className="siteVisitCarousel" aria-label="Budget reviews by project">
    <ProjectNavigation projects={projects} selectedId={selected.id} onSelect={id => { setSelection({ id, highlight: null }); onProjectChange() }} eyebrow="BUDGET REVIEWS BY PROJECT" />
    <BudgetReviewApprovals key={selected.id} leadId={selected.id} state={{ ...state, result: selected.result }} />
  </section>
}
