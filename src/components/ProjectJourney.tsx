import { useId, useState } from 'react'
import { FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { FaInfoCircle } from 'react-icons/fa'
import type { PendingItem } from './approvals/pendingApprovalItems'
import './ProjectJourney.css'

const milestones = [
  'Project Details', 'Site Visit', '3D Design', 'Proforma Invoice', 'Budget Review',
  'Payment Terms', 'Client Agreement', 'First Installment', 'Project Execution', 'Project Completion',
]

const milestoneHelp: Record<string, string> = {
  'Project Details': 'Open Project Details in the menu to tell us about your space and what you have in mind for your project.',
  'Site Visit': 'Open Site Visit Appointment & Report to confirm your visit, request a new time, or view your approved report.',
  '3D Design': 'Open Review & Approvals → 3D Design Approvals to view your designs, approve them, or request changes.',
  'Proforma Invoice': 'Open Review & Approvals → Proforma Invoice Approvals to review your invoice, approve it, or request changes.',
  'Budget Review': 'Open Review & Approvals → Budget Review Approvals to review your proposed budget, approve it, or request changes.',
  'Payment Terms': 'Open Review & Approvals → Payment Terms Approvals to review your payment schedule, approve the terms, or request changes.',
  'Client Agreement': 'Once your Client Agreement is ready, check your registered email for a link to review and sign it.',
  'First Installment': 'Open Project Tracking → Payment Terms to view your payment schedule and check the amount and due date of your first installment.',
  'Project Execution': 'Open Project Tracking → Project Status to see how your project is progressing and track key milestones.',
}

export type JourneyProject = {
  id: string
  name?: string
  currentStep: number
  completionPercentage?: number
  action?: PendingItem
  siteVisitLeadId?: string
}

export function ProjectJourney({ projects, selectedId, onSelect, onOpenProjectDetails, onOpenSiteVisit, onOpenDesignApprovals, onOpenProformaApprovals, onOpenBudgetApprovals, onOpenPaymentApprovals, onOpenPaymentSchedule, onOpenProjectStatus }: {
  projects: JourneyProject[]
  selectedId?: string | null
  onSelect: (id: string) => void
  onOpenProjectDetails: () => void
  onOpenSiteVisit: (leadId?: string) => void
  onOpenDesignApprovals: (projectId: string) => void
  onOpenProformaApprovals: (projectId: string) => void
  onOpenBudgetApprovals: (projectId: string) => void
  onOpenPaymentApprovals: (projectId: string) => void
  onOpenPaymentSchedule: (projectId: string) => void
  onOpenProjectStatus: (projectId: string) => void
}) {
  const helpId = useId()
  const [helpStep, setHelpStep] = useState<number | null>(null)

  if (!projects.length) return null

  const index = Math.max(0, projects.findIndex(project => project.id === selectedId))
  const project = projects[index]
  const multiple = projects.length > 1
  const journeyComplete = project.currentStep === milestones.length
  const next = milestones[project.currentStep + 1]
  const openMilestone: Partial<Record<string, () => void>> = {
    'Project Details': onOpenProjectDetails,
    'Site Visit': () => onOpenSiteVisit(project.siteVisitLeadId),
    '3D Design': () => onOpenDesignApprovals(project.id),
    'Proforma Invoice': () => onOpenProformaApprovals(project.siteVisitLeadId || project.id),
    'Budget Review': () => onOpenBudgetApprovals(project.siteVisitLeadId || project.id),
    'Payment Terms': () => onOpenPaymentApprovals(project.siteVisitLeadId || project.id),
    'First Installment': () => onOpenPaymentSchedule(project.id),
    'Project Execution': () => onOpenProjectStatus(project.id),
  }

  function move(offset: number) {
    onSelect(projects[(index + offset + projects.length) % projects.length].id)
  }

  return (
    <section className="projectJourney" aria-labelledby="project-journey-title"
      aria-roledescription={multiple ? 'carousel' : undefined}>
      <header className="projectJourney__header">
        <div>
          <h2 id="project-journey-title">Your Project Journey</h2>
          <p>See what's completed, what needs your attention, and what comes next.</p>
        </div>
        <div className="projectJourney__headerSide">
          <div className="projectJourney__progress">
            <div className="projectJourney__metrics" aria-live="polite" aria-atomic="true">
              <span>{journeyComplete ? 'Journey complete' : `Step ${project.currentStep + 1} of ${milestones.length}`}</span>
              <strong>{project.completionPercentage == null
                ? 'Completion awaiting update'
                : <><span>{project.completionPercentage}%</span> Complete</>}</strong>
            </div>
            {project.completionPercentage != null && (
              <progress aria-label="Project completion" max={100} value={project.completionPercentage} />
            )}
          </div>
          {multiple && <div className="projectJourney__controls">
            <button type="button" aria-label="Previous project" onClick={() => move(-1)}><FiChevronLeft aria-hidden="true" /></button>
            <span aria-live="polite">Project {index + 1} of {projects.length}</span>
            <button type="button" aria-label="Next project" onClick={() => move(1)}><FiChevronRight aria-hidden="true" /></button>
          </div>}
        </div>
      </header>
      <ol className="projectJourney__steps" aria-label="Project milestones">
        {milestones.map((label, step) => {
          const state = step < project.currentStep ? 'done' : step === project.currentStep ? 'current' : 'upcoming'
          const helpMessage = milestoneHelp[label]
          const open = openMilestone[label]
          const HelpTrigger = open ? 'button' : 'span'
          const stepHelpId = helpId + '-' + step
          const showHelp = helpStep === step
          const hideHelp = () => setHelpStep(current => current === step ? null : current)
          const milestone = <>
            <span className="projectJourney__marker" aria-hidden="true">{state === 'done' ? <FiCheck /> : step + 1}</span>
            <span className="projectJourney__label">{label}</span>
          </>
          return <li key={label} className={`projectJourney__step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}
            onPointerEnter={helpMessage ? event => {
              if (event.pointerType === 'mouse') setHelpStep(step)
            } : undefined}
            onPointerLeave={helpMessage ? event => {
              if (event.pointerType === 'mouse') hideHelp()
            } : undefined}>
            {helpMessage ? <>
              <HelpTrigger type={open ? "button" : undefined} tabIndex={open ? undefined : 0} className="projectJourney__helpTrigger"
                aria-describedby={stepHelpId}
                onFocus={(event: React.FocusEvent<HTMLElement>) => {
                  if (event.currentTarget.matches(':focus-visible')) setHelpStep(step)
                }}
                onBlur={() => hideHelp()}
                onClick={open}
                onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
                  if (event.key === 'Escape') hideHelp()
                }}>{milestone}</HelpTrigger>
              <button type="button" className="projectJourney__info"
                aria-label={'Help with ' + label} aria-controls={stepHelpId} aria-expanded={showHelp}
                onClick={() => setHelpStep(current => current === step ? null : step)}
                onBlur={() => hideHelp()}
                onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
                  if (event.key === 'Escape') hideHelp()
                }}>
                <FaInfoCircle aria-hidden="true" />
              </button>
              <span id={stepHelpId} className="projectJourney__help" role="tooltip" hidden={!showHelp}>
                {helpMessage}
              </span>
            </> : open
              ? <button type="button" className="projectJourney__helpTrigger" onClick={open}>{milestone}</button>
              : milestone}
            {state === 'current' && <span className="projectJourney__srOnly">Current step</span>}
            {state === 'done' && <span className="projectJourney__srOnly">Completed</span>}
            {state === 'upcoming' && <span className="projectJourney__srOnly">Upcoming</span>}
          </li>
        })}
      </ol>

      {next && <span className="projectJourney__srOnly">Up next: {next}</span>}
    </section>
  )
}
