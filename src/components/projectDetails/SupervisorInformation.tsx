import { FiUserCheck, FiMail, FiPhone } from 'react-icons/fi'
import type { SupervisorResult } from '../../services/supervisorApi'
import './ProjectDetailsForm.css'
export function SupervisorInformation({ leadId, result, retry }: { leadId?: string; result: SupervisorResult | null; retry: () => void }) {
  return <section className="dashboardSection projectDetails projectDetails--summary">
    <header className="projectSummary__header"><div>
      <p className="projectSummary__eyebrow">YOUR ARELIA CONTACT</p>
      <h2 className="dashboardSection__title">Supervisor Information</h2>
      <p className="projectSummary__subtitle">Your point of contact for site coordination.</p>
    </div></header>
    <div className="projectSummary__body">
      {!leadId ? <p>Supervisor information is available for consultation accounts.</p>
        : !result ? <p role="status">Loading supervisor information…</p>
        : !result.success ? <div><p role="alert">{result.message}</p><button type="button" className="projectDetails__submit" onClick={retry}>Retry</button></div>
        : !result.assigned ? <p>A supervisor has not been assigned yet. We will notify you when your supervisor is assigned.</p>
        : <dl className="projectSummary__grid">
          {[
            { label: 'Supervisor User', value: result.supervisorUser, icon: FiUserCheck },
            { label: 'Supervisor User Email', value: result.supervisorUserEmail, icon: FiMail },
            { label: 'Supervisor User Phone', value: result.supervisorUserPhone, icon: FiPhone },
          ].map(({ label, value, icon: Icon }) => <div key={label} className="projectSummary__item">
            <span className="projectSummary__icon" aria-hidden="true"><Icon /></span>
            <div><dt>{label}</dt><dd>{value || 'Not available'}</dd></div>
          </div>)}
        </dl>}
    </div>
  </section>
}
