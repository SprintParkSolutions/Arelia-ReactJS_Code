import type { Appointment } from '../../services/siteVisitApi'

export function canRespondToSiteVisit(appointment: Appointment | null | undefined): boolean {
  return Boolean(appointment?.success && appointment.appointmentAvailable && appointment.actionRequired
    && appointment.appointmentSentDate?.trim() && appointment.appointmentDate?.trim()
    && appointment.appointmentTimeSlot?.trim()
    && (appointment.appointmentStatus === 'Pending' || appointment.appointmentStatus === 'Appointment Rescheduled'))
}
