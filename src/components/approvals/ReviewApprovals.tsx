import { FiChevronRight } from 'react-icons/fi'
import type { ReactNode } from 'react'
import type { ApprovalCategory } from './approvalCategories'
export function ReviewApprovals({ selected, children }: { selected: ApprovalCategory | null; children?: ReactNode }) {
  const isDesign = selected === '3D Design Approvals'
  return <section className="dashboardSection">
    <div className={'dashboardSection__heading' + (isDesign ? ' designLayout__heading' : '')} style={(isDesign || selected === 'Proforma Invoice Approvals' || selected === 'Budget Review Approvals' || selected === 'Payment Terms Approvals') ? { marginBottom: 'clamp(1rem, 2vw, 1.5rem)' } : undefined}>
      {isDesign && <p className="designLayout__breadcrumb">Review &amp; Approvals <FiChevronRight aria-hidden="true" /> 3D Design Approvals</p>}
      <h2 className="dashboardSection__title">{selected || 'Review & Approvals'}</h2>
      {isDesign && <p className="designLayout__description">Explore the 3D interior design, view supporting files, and share your approval or feedback.</p>}
    </div>
    {children}
  </section>
}