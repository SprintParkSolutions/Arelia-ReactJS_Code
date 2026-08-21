export type DashboardTabId =
  | 'profile'
  | 'status'
  | 'vendor'
  | 'payment'
  | 'documents'
  | 'cases'
  | 'notifications'

export const dashboardTabs: { id: DashboardTabId; label: string }[] = [
  { id: 'profile', label: 'Profile & Overview' },
  { id: 'status', label: 'Project Status' },
  { id: 'vendor', label: 'Vendor Tasks' },
  { id: 'payment', label: 'Payment Terms' },
  { id: 'documents', label: 'Documents & Reports' },
  { id: 'cases', label: 'Support Cases' },
  { id: 'notifications', label: 'Notifications' },
]
