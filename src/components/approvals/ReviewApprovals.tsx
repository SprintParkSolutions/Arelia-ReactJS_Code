import type { ReactNode } from 'react'
import type { ApprovalCategory } from './approvalCategories'
export function ReviewApprovals({ selected, children }: { selected: ApprovalCategory | null; children?: ReactNode }) {
  return <section className="dashboardSection">
    <div className="dashboardSection__heading">
      <h2 className="dashboardSection__title">{selected || 'Review & Approvals'}</h2>
    </div>
    {children}
  </section>
}