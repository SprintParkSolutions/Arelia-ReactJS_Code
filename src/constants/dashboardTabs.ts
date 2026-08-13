export type DashboardTabId =
  | 'profile'
  | 'projectDetails'
  | 'siteVisit'
  | 'status'
  | 'vendor'
  | 'payment'
  | 'documents'
  | 'cases'
  | 'notifications'
  | 'approvals'

export const dashboardTabs: { id: DashboardTabId; label: string }[] = [
  { id: 'profile', label: 'Profile & Overview' },
  { id: 'projectDetails', label: 'Project Details' },
  { id: 'siteVisit', label: 'Site Visit Appointment & Report' },
  { id: 'status', label: 'Project Status' },
  { id: 'vendor', label: 'Vendor Tasks' },
  { id: 'payment', label: 'Payment Terms' },
  { id: 'documents', label: 'Documents & Reports' },
  { id: 'cases', label: 'Support Cases' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'approvals', label: 'Approvals' },
]
