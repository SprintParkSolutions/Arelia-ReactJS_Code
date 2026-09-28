import { useState } from 'react'
import { ProjectNavigation } from '../ProjectNavigation'
import { PaymentTermsApprovals } from './PaymentTermsApprovals'
import type { usePaymentReview } from './usePaymentReview'
export function ProjectPaymentTermsApprovals({ leadId, state, highlightId, onProjectChange }: {
  leadId: string; state: ReturnType<typeof usePaymentReview>; highlightId: string | null; onProjectChange: () => void
}) {
  const [selection, setSelection] = useState<{ id: string; highlight: string | null } | null>(null)
  const projects = state.result?.projects
  if (!state.result?.success || !projects?.length) return <PaymentTermsApprovals leadId={leadId} state={state} />
  const highlighted = projects.find(project => project.result.payment?.opportunityId === highlightId)?.id
  const requested = selection?.highlight === highlightId ? selection.id : highlighted
  const selected = projects.find(project => project.id === requested) || projects[0]
  return <section className="siteVisitCarousel" aria-label="Payment terms by project">
    <ProjectNavigation projects={projects} selectedId={selected.id} onSelect={id => { setSelection({ id, highlight: null }); onProjectChange() }} eyebrow="PAYMENT TERMS BY PROJECT" />
    <PaymentTermsApprovals key={selected.id} leadId={selected.id} state={{ ...state, result: selected.result }} />
  </section>
}
