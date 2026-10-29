import { FiArrowRight, FiBarChart2, FiBox, FiCalendar, FiCreditCard, FiFileText } from 'react-icons/fi'
import type { PendingItem, PendingOverview } from './pendingApprovalItems'
import './PendingApprovals.css'

const icons = { siteVisit: FiCalendar, design: FiBox, invoice: FiFileText, budget: FiBarChart2, payment: FiCreditCard }
export function PendingApprovals({ overview, onReview }: { overview: PendingOverview; onReview: (item: PendingItem) => void }) {
  if (!overview.count) return null
  return <section className="pendingApprovals" aria-labelledby="pending-approvals-title">
    <header className="pendingApprovals__header">
      <div className="pendingApprovals__heading"><h2 id="pending-approvals-title">Pending your approval</h2><span className="pendingApprovals__count" aria-label={`${overview.count} pending approvals`}>{overview.count}</span></div>
      <p>{overview.multipleProjects ? 'Review and approve items for each project.' : 'Review the items below to keep your project moving.'}</p>
    </header>
    <div className="pendingApprovals__groups">
      {overview.groups.map(group => <div className="pendingApprovals__group" key={group.id}>
        {overview.multipleProjects && <div className="pendingApprovals__project"><h3>{group.label}</h3><span>{group.items.length} pending</span></div>}
        <ul className="pendingApprovals__list">
          {group.items.map(item => {
            const Icon = icons[item.kind]
            return <li className="pendingApprovals__item" key={item.id}>
              <span className="pendingApprovals__icon" aria-hidden="true"><Icon /></span>
              <div className="pendingApprovals__copy"><strong>{item.title}</strong>{item.description && <span>{item.description}</span>}</div>
              <button type="button" onClick={() => onReview(item)} aria-label={`Review ${item.title}${overview.multipleProjects ? ` for ${group.label}` : ''}`}><span>Review</span><FiArrowRight aria-hidden="true" /></button>
            </li>
          })}
        </ul>
      </div>)}
    </div>
  </section>
}