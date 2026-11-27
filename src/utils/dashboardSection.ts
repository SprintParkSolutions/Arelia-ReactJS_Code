import { approvalCategories, type ApprovalCategory } from '../components/approvals/approvalCategories'
import { dashboardTabs, type DashboardTabId } from '../constants/dashboardTabs'

const approvalSlugs: Record<ApprovalCategory, string> = {
  '3D Design Approvals': 'design',
  'Proforma Invoice Approvals': 'proforma-invoice',
  'Budget Review Approvals': 'budget-review',
  'Payment Terms Approvals': 'payment-terms',
}

export function readDashboardSection(search: string) {
  const params = new URLSearchParams(search)
  const tab = dashboardTabs.find(({ id }) => id === params.get('tab'))?.id ?? 'profile'
  const approval = tab === 'approvals'
    ? approvalCategories.find((category) => approvalSlugs[category] === params.get('approval'))
    : undefined
  return { tab, approval: approval ?? approvalCategories[0] }
}

export function dashboardSectionPath(tab: DashboardTabId, approval: ApprovalCategory = approvalCategories[0]) {
  if (tab === 'profile') return '/dashboard'

  const params = new URLSearchParams({ tab })
  if (tab === 'approvals') params.set('approval', approvalSlugs[approval])
  return `/dashboard?${params}`
}
