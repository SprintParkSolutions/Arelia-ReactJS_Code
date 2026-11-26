import { FiChevronRight } from 'react-icons/fi'
import type { ReactNode } from 'react'
import type { ApprovalCategory } from './approvalCategories'
export function ReviewApprovals({ selected, children }: { selected: ApprovalCategory | null; children?: ReactNode }) {
  const isDesign = selected === '3D Design Approvals'
  const isProforma = selected === 'Proforma Invoice Approvals'
  const hasOverviewHeading = isDesign || isProforma
  return <section className="dashboardSection">
    <div className={'dashboardSection__heading' + (hasOverviewHeading ? ' designLayout__heading' : '')} style={(hasOverviewHeading || selected === 'Budget Review Approvals' || selected === 'Payment Terms Approvals') ? { marginBottom: 'clamp(1rem, 2vw, 1.5rem)' } : undefined}>
      {hasOverviewHeading && <p className="designLayout__breadcrumb">Review &amp; Approvals <FiChevronRight aria-hidden="true" /> {selected}</p>}
      <h2 className="dashboardSection__title">{selected || 'Review & Approvals'}</h2>
      {hasOverviewHeading && <p className="designLayout__description">{isProforma ? 'Review the proforma invoice and supporting files, then approve or request changes.' : 'Explore the 3D interior design, view supporting files, and share your approval or feedback.'}</p>}
    </div>
    {children}
  </section>
}