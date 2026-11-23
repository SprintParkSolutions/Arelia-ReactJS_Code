import { motion, useReducedMotion } from 'framer-motion'
import { FiCheck, FiEdit3, FiHome, FiTool } from 'react-icons/fi'
import './ProjectStagePath.css'

const stages = [
  { label: 'Design & Planning', icon: FiEdit3 },
  { label: 'Execution', icon: FiTool },
  { label: 'Handover', icon: FiHome },
]

export function ProjectStagePath({ status }: { status?: string | null }) {
  const reduceMotion = useReducedMotion()
  const normalizedStatus = status?.trim().replace(/\s+/g, ' ').toLowerCase()
  const activeIndex = normalizedStatus === 'completed' ? 2 : normalizedStatus === 'in progress' ? 1 : 0

  return <ol className="projectStagePath" aria-label="Project stages">
    {stages.map(({ label, icon: Icon }, index) => {
      const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'upcoming'
      return <motion.li key={label} className={`projectStagePath__step is-${state}`}
        aria-current={state === 'active' ? 'step' : undefined}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.12 }}>
        {index > 0 && <span className="projectStagePath__connector" aria-hidden="true">
          <motion.span initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: index <= activeIndex ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : index * 0.15 }} />
        </span>}
        <span className="projectStagePath__icon" aria-hidden="true">
          {state === 'done' ? <FiCheck /> : <Icon />}
        </span>
        <span className="projectStagePath__label">{label}</span>
        <span className="projectStagePath__state">{state === 'done' ? 'Completed' : state === 'active' ? 'Current stage' : 'Upcoming'}</span>
      </motion.li>
    })}
  </ol>
}
