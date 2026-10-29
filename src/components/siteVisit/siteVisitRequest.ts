import type { Appointment } from '../../services/siteVisitApi'

export function canRespondToSiteVisit(appointment: Appointment | null | undefined): boolean {
  return Boolean(appointment?.success && appointment.appointmentAvailable && appointment.actionRequired
    && appointment.appointmentSentDate?.trim() && appointment.appointmentDate?.trim()
    && appointment.appointmentTimeSlot?.trim()
    && (appointment.appointmentStatus === 'Pending' || appointment.appointmentStatus === 'Appointment Rescheduled'))
}


// A slot is available only before its start, so an ongoing slot cannot be requested.
export function isFutureSiteVisitSlot(date: string, slot: string, now = new Date()): boolean {
  const match = slot.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*(?:[-??]|$)/i)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !match) return false
  let hour = Number(match[1])
  const minute = Number(match[2] || 0)
  const period = match[3]?.toUpperCase()
  if (minute > 59 || (period ? hour < 1 || hour > 12 : hour > 23)) return false
  if (period) hour = hour % 12 + (period === 'PM' ? 12 : 0)
  const start = new Date(date + 'T' + String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0') + ':00')
  return Number.isFinite(start.getTime()) && start.getTime() > now.getTime()
}
