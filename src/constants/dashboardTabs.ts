export type DashboardTabId = 'profile' | 'status' | 'vendor' | 'payment' | 'documents'

export const dashboardTabs: { id: DashboardTabId; label: string }[] = [
  { id: 'profile', label: 'Profile & Overview' },
  { id: 'status', label: 'Project Status' },
  { id: 'vendor', label: 'Vendor Tasks' },
  { id: 'payment', label: 'Payment Terms' },
  { id: 'documents', label: 'Documents & Reports' },
]
