import { FiCheckCircle, FiChevronDown, FiBox, FiFileText, FiPieChart, FiCreditCard } from 'react-icons/fi'
import { approvalCategories, type ApprovalCategory } from './approvalCategories'
import './ReviewApprovals.css'

const categoryIcons = [FiBox, FiFileText, FiPieChart, FiCreditCard]

export function ApprovalNavigation({ mobile = false, active, expanded, selected, onToggle, onSelect }: {
  mobile?: boolean; active: boolean; expanded: boolean; selected: ApprovalCategory | null
  onToggle: () => void; onSelect: (category: ApprovalCategory) => void
}) {
  const listId = mobile ? 'mobile-approval-subtabs' : 'approval-subtabs'
  const linkClass = mobile ? 'dashboardMobileDrawer__link' : 'dashboardRail__link'
  return <div className="approvalNavigation">
    <button type="button" className={linkClass + (active ? ' is-active' : '')}
      aria-expanded={expanded} aria-controls={listId} onClick={onToggle}>
      <FiCheckCircle aria-hidden="true" />
      <span className={mobile ? 'dashboardMobileDrawer__linkLabel' : 'dashboardRail__linkLabel'}>Review &amp; Approvals</span>
      <FiChevronDown aria-hidden="true" className={'approvalNavigation__chevron' + (expanded ? ' is-expanded' : '')} />
    </button>
    {expanded && <ul id={listId} className="approvalNavigation__children">
      {approvalCategories.map((category, index) => {
        const Icon = categoryIcons[index]
        return <li key={category}>
        <button type="button" className="approvalNavigation__child"
          aria-current={active && selected === category ? 'page' : undefined}
          onClick={() => onSelect(category)}>
          <Icon className="approvalNavigation__childIcon" aria-hidden="true" />
          <span>{category}</span>
        </button>
      </li>})}
    </ul>}
  </div>
}