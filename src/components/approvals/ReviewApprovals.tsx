import { FiChevronRight } from 'react-icons/fi'
import type { ReactNode } from 'react'
import type { ApprovalCategory } from './approvalCategories'
const overviewDescriptions: Partial<Record<ApprovalCategory, string>> = {
  '3D Design Approvals': 'Explore the 3D interior design, view supporting files, and share your approval or feedback.',
  'Proforma Invoice Approvals': 'Review the proforma invoice and supporting files, then approve or request changes.',
  'Budget Review Approvals': 'Review your project budget and estimated duration, then approve or share the changes you need.',
  'Payment Terms Approvals': 'Review your payment schedule, then approve or share the changes you need.',
}

export function ReviewApprovals({ selected, children }: { selected: ApprovalCategory | null; children?: ReactNode }) {
  const description = selected ? overviewDescriptions[selected] : undefined
  return <section className="dashboardSection">
    <div className={'dashboardSection__heading' + (description ? ' designLayout__heading' : '')} style={(description) ? { marginBottom: 'clamp(1rem, 2vw, 1.5rem)' } : undefined}>
      {description && <p className="designLayout__breadcrumb">Review &amp; Approvals <FiChevronRight aria-hidden="true" /> {selected}</p>}
      <h2 className="dashboardSection__title">{selected || 'Review & Approvals'}</h2>
      {description && <p className="designLayout__description">{description}</p>}
    </div>
    {children}
  </section>
}