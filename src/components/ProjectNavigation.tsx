import { useEffect, useRef } from 'react'
import { FiArrowLeft, FiArrowRight, FiLayers } from 'react-icons/fi'
import './siteVisit/ProjectSiteVisitCarousel.css'
export function ProjectNavigation({ projects, selectedId, onSelect, eyebrow }: {
  projects: { id: string }[]; selectedId: string; onSelect: (id: string) => void; eyebrow: string
}) {
  const selectedButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { selectedButton.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }) }, [selectedId, projects.length])
  if (projects.length < 2) return null
  const index = Math.max(0, projects.findIndex(project => project.id === selectedId))
  return (
    <div className="siteVisitCarousel__navigation">
      <div className="siteVisitCarousel__heading">
        <span className="siteVisitCarousel__icon" aria-hidden="true"><FiLayers /></span>
        <div><p className="projectSummary__eyebrow">{eyebrow}</p><h2 className="dashboardSection__title">Project {index + 1}</h2></div>
      </div>
      <div className="siteVisitCarousel__controls">
        <span className="siteVisitCarousel__position" role="status" aria-live="polite"><strong>{String(index + 1).padStart(2, '0')}</strong><span aria-hidden="true"> / </span><span className="siteVisitCarousel__srOnly">of </span>{String(projects.length).padStart(2, '0')}</span>
        {projects.length > 1 && <>
          <button className="siteVisitCarousel__arrow" type="button" aria-label="Previous project" disabled={index === 0} onClick={() => onSelect(projects[index - 1].id)}><FiArrowLeft aria-hidden="true" /></button>
          <button className="siteVisitCarousel__arrow" type="button" aria-label="Next project" disabled={index === projects.length - 1} onClick={() => onSelect(projects[index + 1].id)}><FiArrowRight aria-hidden="true" /></button>
        </>}
      </div>
      {projects.length > 1 && <div className="siteVisitCarousel__projects" role="group" aria-label="Choose a project">
        {projects.map((project, position) => <button key={project.id} ref={position === index ? selectedButton : undefined}
          type="button" className="siteVisitCarousel__project" aria-pressed={position === index}
          onClick={() => onSelect(project.id)}>
          <span className="siteVisitCarousel__projectNumber" aria-hidden="true">{String(position + 1).padStart(2, '0')}</span>
          Project {position + 1}
          <span className="siteVisitCarousel__activeDot" aria-hidden="true" />
        </button>)}
      </div>}
    </div>
  )
}
