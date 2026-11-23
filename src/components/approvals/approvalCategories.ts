export const approvalCategories = [
  '3D Design Approvals',
  'Proforma Invoice Approvals',
  'Budget Review Approvals',
  'Payment Terms Approvals',
] as const
export type ApprovalCategory = typeof approvalCategories[number]