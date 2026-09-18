export type DashboardTabId =
  | 'profile'
  | 'siteVisit'
  | 'projectDetails'
  | 'supervisor'
  | 'approvals'
  | 'status'
  | 'vendor'
  | 'payment'
  | 'documents'
  | 'cases'
  | 'notifications'

export const dashboardTabs: { id: DashboardTabId; label: string }[] = [
  { id: 'profile', label: 'Profile & Overview' },
  { id: 'projectDetails', label: 'Project Details' },
  { id: 'supervisor', label: 'Supervisor Information' },
  { id: 'siteVisit', label: 'Site Visit Appointment & Report' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'status', label: 'Project Status' },
  { id: 'vendor', label: 'Vendor Tasks' },
  { id: 'payment', label: 'Payment Terms' },
  { id: 'documents', label: 'Documents & Reports' },
  { id: 'cases', label: 'Support Cases' },
]