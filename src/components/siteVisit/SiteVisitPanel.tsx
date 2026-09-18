import { useState } from 'react'
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi'
import { DocumentDownload } from './DocumentDownload'
import type { useSiteVisit } from './useSiteVisit'
import '../projectDetails/ProjectDetailsForm.css'
import './SiteVisitPanel.css'
function displayDate(value?: string) {
  if (!value) return 'Not available'
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
function today() {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
export function SiteVisitPanel({ leadId, visit }: { leadId?: string; visit: ReturnType<typeof useSiteVisit> }) {
  const [rescheduling, setRescheduling] = useState(false)
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { appointment, report, busy } = visit
  const requested = appointment?.appointmentStatus === 'Rescheduled'
  const canRespond = appointment?.success && appointment.appointmentAvailable && appointment.actionRequired
  async function respond(response: 'Approved' | 'Rescheduled') {
    setError(''); setMessage('')
    if (response === 'Rescheduled' && (!date || date < today() || !slot || !appointment?.availableTimeSlots?.includes(slot))) { setError('Choose a date today or later and an available time slot.'); return }
    const result = await visit.submit(response, date, slot)
    if (!result.success) { setError(result.message); return }
    setMessage(result.message); setRescheduling(false)
  }
  return <div className="siteVisit">
    <section className="dashboardSection projectDetails projectDetails--summary">
      <header className="projectSummary__header"><div><p className="projectSummary__eyebrow">YOUR SITE VISIT</p><h2 className="dashboardSection__title">Site Visit Appointment</h2><p className="projectSummary__subtitle">Review your appointment or request a more convenient time.</p></div>
        {appointment?.success && appointment.appointmentAvailable && <span className="projectSummary__badge">{requested ? 'Reschedule requested' : appointment.appointmentStatus}</span>}
      </header>
      <div className="projectSummary__body">
        {!leadId ? <p>Site visits are available for consultation accounts.</p> : !appointment ? <p role="status">Loading appointment…</p> : !appointment.success ? <div><p role="alert">{appointment.message}</p><button onClick={visit.retry}>Retry appointment</button></div> : !appointment.appointmentAvailable ? <p>No site visit appointment has been scheduled yet. We will notify you when one is available.</p> : <>
          <dl className="projectSummary__grid">
            {[
              { label: requested ? 'Requested date' : appointment.appointmentStatus === 'Approved' ? 'Approved date' : 'Appointment date', value: displayDate(requested ? appointment.requestedDate : appointment.appointmentDate), icon: FiCalendar },
              { label: requested ? 'Requested time slot' : appointment.appointmentStatus === 'Approved' ? 'Approved time slot' : 'Appointment time slot', value: requested ? appointment.requestedTimeSlot : appointment.appointmentTimeSlot, icon: FiClock },
              { label: 'Site location', value: appointment.siteLocation, icon: FiMapPin },
              { label: 'Supervisor', value: appointment.supervisorName, icon: FiCalendar },
            ].map(({ label, value, icon: Icon }) => <div className="projectSummary__item" key={label}><span className="projectSummary__icon"><Icon /></span><div><dt>{label}</dt><dd>{value || 'Not available'}</dd></div></div>)}
          </dl>
          {requested && <p>Your preferred date and time have been sent to the Arelia team for coordination.</p>}
          {canRespond && <div className="siteVisit__response">
            {!rescheduling ? <div className="siteVisit__actions"><button className="projectDetails__submit" disabled={busy || !appointment.appointmentDate || !appointment.appointmentTimeSlot} onClick={() => void respond('Approved')}>{busy ? 'Saving…' : 'Approve'}</button><button disabled={busy} onClick={() => setRescheduling(true)}>Reschedule</button></div>
            : <form onSubmit={event => { event.preventDefault(); void respond('Rescheduled') }}>
              <fieldset disabled={busy}><legend>Choose your preferred appointment</legend><div className="siteVisit__fields">
                <label htmlFor="visit-date">Preferred date<input id="visit-date" type="date" required min={today()} value={date} onChange={event => setDate(event.target.value)} /></label>
                <label htmlFor="visit-slot">Preferred time slot<select id="visit-slot" required value={slot} onChange={event => setSlot(event.target.value)}><option value="">Select a time slot</option>{appointment.availableTimeSlots?.map(value => <option key={value}>{value}</option>)}</select></label>
              </div><div className="siteVisit__actions"><button type="submit" className="projectDetails__submit">{busy ? 'Submitting…' : 'Submit reschedule request'}</button><button type="button" onClick={() => setRescheduling(false)}>Cancel</button></div></fieldset>
            </form>}
          </div>}
        </>}
        {error && <p role="alert" className="siteVisit__error">{error}</p>}
        {message && <p role="status">{message}</p>}
      </div>
    </section>
    {leadId && <section className="dashboardSection projectDetails projectDetails--summary">
      <header className="projectSummary__header"><div><p className="projectSummary__eyebrow">SITE ASSESSMENT</p><h2 className="dashboardSection__title">Site Visit Report</h2><p className="projectSummary__subtitle">Your management-approved site assessment and supporting documents.</p></div></header>
      <div className="projectSummary__body">
        {!report ? <p role="status">Loading report…</p> : !report.success ? <div><p role="alert">{report.message}</p><button onClick={visit.retry}>Retry report</button></div> : !report.reportAvailable || !report.report ? <p>{report.message}</p> : <>
          <span className="projectSummary__badge">Approved by management</span>
          <dl className="projectSummary__grid siteVisit__report">
            {[
              ['reportName', 'Report'], ['siteVisitDate', 'Visit date'], ['siteVisitTimeSlot', 'Visit time slot'], ['supervisorName', 'Supervisor'],
              ['siteVisitType', 'Visit type'], ['siteAddress', 'Site address'], ['roomsCount', 'Rooms'],
              ['siteAreaSqFt', 'Site area (sq ft)'], ['usableAreaSqFt', 'Usable area (sq ft)'], ['totalEstimatedCost', 'Total estimated cost'],
              ['estimatedCompletionMonths', 'Estimated completion (months)'],
              ['estimatedBudgetDescription', 'Budget details'],
            ].map(([key, label]) => {
              const value = report.report![key]
              return <div key={key} className="projectSummary__item"><div><dt>{label}</dt><dd>{value == null || value === '' ? 'Not available' : key.endsWith('Date') ? displayDate(String(value)) : typeof value === 'number' ? value.toLocaleString('en-IN') : String(value)}</dd></div></div>
            })}
          </dl>
          <h3 className="siteVisit__documentsHeading">Supporting documents</h3>
          {report.documents?.length ? <ul className="siteVisit__documents">{report.documents.map(doc => <li key={doc.versionId}><DocumentDownload leadId={leadId} reportId={String(report.report!.reportId)} document={doc} /></li>)}</ul> : <p>No supporting documents have been attached.</p>}
        </>}
      </div>
    </section>}
  </div>
}
