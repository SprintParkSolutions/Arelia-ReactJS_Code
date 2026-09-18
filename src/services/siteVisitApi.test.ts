import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSiteVisit, getSiteVisitReport, respondToSiteVisit, reportDocumentUrl } from './siteVisitApi'
afterEach(() => vi.unstubAllGlobals())
function mock(payload: unknown, status = 200) {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
describe('site visit API contracts', () => {
  it('loads an appointment and supplied time slots for the correct lead', async () => {
    mock({ success: true, leadId: '00Q123', appointmentAvailable: true, actionRequired: true, appointmentDate: '2030-10-10', appointmentTimeSlot: '9AM-10AM', availableTimeSlots: ['9AM-10AM'] })
    expect(await getSiteVisit('00Q123')).toMatchObject({ success: true, actionRequired: true, availableTimeSlots: ['9AM-10AM'] })
  })
  it('sends approval without reschedule fields', async () => {
    const fetcher = mock({ success: true, leadId: '00Q123', appointmentStatus: 'Approved', appointmentConfirmed: true, appointmentDate: '2030-10-10', appointmentTimeSlot: '9AM-10AM' })
    expect(await respondToSiteVisit('00Q123', 'Approved')).toMatchObject({ success: true, actionRequired: false, appointmentConfirmed: true, appointmentDate: '2030-10-10' })
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ leadId: '00Q123', response: 'Approved' })
  })
  it('sends requested date and slot, displays cleared confirmed fields', async () => {
    const fetcher = mock({ success: true, leadId: '00Q123', appointmentStatus: 'Rescheduled', appointmentDate: null, appointmentTimeSlot: null, requestedDate: '2030-10-11', requestedTimeSlot: '2PM-3PM' })
    expect(await respondToSiteVisit('00Q123', 'Rescheduled', '2030-10-11', '2PM-3PM')).toMatchObject({ success: true, requestedDate: '2030-10-11', requestedTimeSlot: '2PM-3PM', appointmentDate: undefined })
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ leadId: '00Q123', response: 'Rescheduled', requestedDate: '2030-10-11', requestedTimeSlot: '2PM-3PM' })
  })
  it('preserves conflict and permission errors', async () => {
    mock({ success: false, message: 'Already responded' }, 409)
    expect(await respondToSiteVisit('00Q123', 'Approved')).toMatchObject({ success: false, message: 'Already responded' })
    mock([{ message: 'Apex class access denied' }], 403)
    expect(await getSiteVisit('00Q123')).toMatchObject({ success: false, message: 'Apex class access denied' })
  })
  it('rejects an appointment belonging to another lead', async () => {
    mock({ success: true, leadId: 'other' })
    expect((await getSiteVisit('00Q123')).success).toBe(false)
  })
  it.each([false, null, 'true'])('does not display reports without explicit management approval: %s', async managementApproval => {
    mock({ success: true, reportAvailable: true, report: { leadId: '00Q123', reportId: 'report1', finalSubmitted: true, managementApproval } })
    expect((await getSiteVisitReport('00Q123')).success).toBe(false)
  })
  it('loads approved final reports and builds a lead/report scoped document link', async () => {
    mock({ success: true, reportAvailable: true, report: { leadId: '00Q123', reportId: 'report1', finalSubmitted: true, managementApproval: true }, documents: [{ versionId: '068123', title: 'Plan', fileExtension: 'pdf' }] })
    expect(await getSiteVisitReport('00Q123')).toMatchObject({ success: true, reportAvailable: true, documents: [{ versionId: '068123', title: 'Plan' }] })
    expect(reportDocumentUrl('00Q123', 'report1', '068123')).toContain('leadId=00Q123&reportId=report1&versionId=068123')
  })
  it('distinguishes no approved report from a missing endpoint', async () => {
    mock({ success: false, reportAvailable: false, message: 'No final-submitted and management-approved Site Visit Report is available yet.' }, 404)
    expect(await getSiteVisitReport('00Q123')).toMatchObject({ success: true, reportAvailable: false })
    mock([{ message: 'Resource missing' }], 404)
    expect((await getSiteVisitReport('00Q123')).success).toBe(false)
  })
})
