import { ProjectNavigation } from '../ProjectNavigation'
import { SiteVisitPanel } from './SiteVisitPanel'
import type { useProjectSiteVisits } from './useProjectSiteVisits'
import './ProjectSiteVisitCarousel.css'

export function ProjectSiteVisitCarousel({ visits, selectedLeadId, onSelect, loading, error, retry }: {
  visits: ReturnType<typeof useProjectSiteVisits>; selectedLeadId?: string
  onSelect: (id: string) => void; loading: boolean; error?: string; retry: () => void
}) {
  if (loading) return <p role="status">Loading project site visits...</p>
  if (error) return <div className="dashboardEmptyState"><p role="alert">{error}</p><button type="button" className="projectDetails__submit" onClick={retry}>Retry projects</button></div>
  if (!visits.length) return <p>Site visits are available for consultation accounts.</p>
  const index = Math.max(0, visits.findIndex(visit => visit.leadId === selectedLeadId))
  const selected = visits[index]
  if (visits.length === 1) return <SiteVisitPanel key={selected.leadId} leadId={selected.leadId} visit={selected} />
  return <section className="siteVisitCarousel" aria-label="Project site visits" aria-roledescription="carousel">
    <ProjectNavigation projects={visits.map(visit => ({ id: visit.leadId }))} selectedId={selected.leadId} onSelect={onSelect} eyebrow="SITE VISITS BY PROJECT" />
    <div role="group" aria-roledescription="slide" aria-label={`Project ${index + 1} of ${visits.length}`}>
      <SiteVisitPanel key={selected.leadId} leadId={selected.leadId} visit={selected} />
    </div>
  </section>
}
