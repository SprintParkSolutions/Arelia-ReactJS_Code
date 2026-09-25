import type { ReactNode } from 'react'
import type { ApprovalCategory } from './approvalCategories'
export function ReviewApprovals({ selected, children }: { selected: ApprovalCategory | null; children?: ReactNode }) {
  return <section className="dashboardSection">
    <div className="dashboardSection__heading" style={(selected === '3D Design Approvals' || selected === 'Proforma Invoice Approvals' || selected === 'Budget Review Approvals') ? { marginBottom: 'clamp(1rem, 2vw, 1.5rem)' } : undefined}>
      <h2 className="dashboardSection__title">{selected || 'Review & Approvals'}</h2>
    </div>
    {children}
  </section>
}