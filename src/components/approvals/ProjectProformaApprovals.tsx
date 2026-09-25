import { useState } from 'react'
import { ProjectNavigation } from '../ProjectNavigation'
import { ProformaApprovals } from './ProformaApprovals'
import type { useProformaApprovals } from './useProformaApprovals'
export function ProjectProformaApprovals({ leadId, state, highlightId, onProjectChange }: {
  leadId: string; state: ReturnType<typeof useProformaApprovals>; highlightId: string | null; onProjectChange: () => void
}) {
  const [selection, setSelection] = useState<{ id: string; highlight: string | null } | null>(null)
  const projects = state.result?.projects || [{ id: leadId, success: true, message: '' }]
  if (!state.result?.success || !projects.length) return <ProformaApprovals leadId={leadId} state={state} highlightId={highlightId} />
  const highlighted = state.result.invoices.find(invoice => invoice.invoiceId === highlightId)?.leadId
  const requested = selection?.highlight === highlightId ? selection.id : highlighted
  const selected = projects.find(project => project.id === requested) || projects[0]
  const result = { ...state.result, success: selected.success, message: selected.message,
    invoices: state.result.invoices.filter(invoice => (invoice.leadId || leadId) === selected.id) }
  return <section className="siteVisitCarousel" aria-label="Proforma invoices by project">
    <ProjectNavigation projects={projects} selectedId={selected.id} onSelect={id => { setSelection({ id, highlight: null }); onProjectChange() }} eyebrow="PROFORMA INVOICES BY PROJECT" />
    <ProformaApprovals key={selected.id} leadId={selected.id} state={{ ...state, result }} highlightId={highlighted === selected.id ? highlightId : null} />
  </section>
}
