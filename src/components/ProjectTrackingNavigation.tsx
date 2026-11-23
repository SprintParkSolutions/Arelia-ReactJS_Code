import { FiBriefcase, FiCalendar, FiChevronDown, FiCreditCard, FiFileText } from 'react-icons/fi'
import { dashboardTabs, isProjectTrackingTab, type DashboardTabId } from '../constants/dashboardTabs'
import './approvals/ReviewApprovals.css'

const children = [
  { id: 'status', icon: FiCalendar },
  { id: 'vendor', icon: FiBriefcase },
  { id: 'payment', icon: FiCreditCard },
  { id: 'documents', icon: FiFileText },
] as const

export function ProjectTrackingNavigation({ mobile = false, activeTab, expanded, onToggle, onSelect }: {
  mobile?: boolean
  activeTab: DashboardTabId
  expanded: boolean
  onToggle: () => void
  onSelect: (tab: DashboardTabId) => void
}) {
  const listId = mobile ? 'mobile-project-tracking-subtabs' : 'project-tracking-subtabs'
  const linkClass = mobile ? 'dashboardMobileDrawer__link' : 'dashboardRail__link'
  return <div className="approvalNavigation">
    <button type="button" className={linkClass + (isProjectTrackingTab(activeTab) ? ' is-active' : '')}
      aria-expanded={expanded} aria-controls={listId} onClick={onToggle}>
      <FiCalendar aria-hidden="true" />
      <span className={mobile ? 'dashboardMobileDrawer__linkLabel' : 'dashboardRail__linkLabel'}>Project Tracking</span>
      <FiChevronDown aria-hidden="true" className={'approvalNavigation__chevron' + (expanded ? ' is-expanded' : '')} />
    </button>
    {expanded && <ul id={listId} className="approvalNavigation__children">
      {children.map(({ id, icon: Icon }) => <li key={id}>
        <button type="button" className="approvalNavigation__child"
          aria-current={activeTab === id ? 'page' : undefined} onClick={() => onSelect(id)}>
          <Icon className="approvalNavigation__childIcon" aria-hidden="true" />
          <span>{dashboardTabs.find(tab => tab.id === id)?.label}</span>
        </button>
      </li>)}
    </ul>}
  </div>
}
