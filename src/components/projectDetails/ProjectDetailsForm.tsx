import { useRef, useState, type SubmitEvent } from 'react'
import { requestProjectDetails, type ProjectDetails, type ProjectDetailsResult } from '../../services/projectDetailsApi'
import { FiCheckCircle, FiHome, FiLayers, FiMapPin, FiMaximize, FiLock, FiFileText, FiCreditCard } from 'react-icons/fi'
import './ProjectDetailsForm.css'
const fields: { key: keyof ProjectDetails; label: string; options?: string[] }[] = [
  { key: 'siteSpace', label: 'Site Space' },
  { key: 'typeOfProject', label: 'Type of Project', options: ['Home', 'Office', 'Interior Combo Package', 'Only Project Plan'] },
  { key: 'projectScope', label: 'Project Scope', options: ['Full Home Interiors', 'Home Decor', 'Kitchen', 'Bed Room', 'Hall Interior', 'Conference Hall', 'Fully Office Interiors', 'Office Decor', 'Office Space', 'Dining Hall', 'Cabins', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK', '1RK'] },
  { key: 'planLevel', label: 'Plan Level', options: ['Standard', 'Premium', 'Luxury'] },
  { key: 'customerBudget', label: 'Customer Budget' },
  { key: 'siteLocation', label: 'Site Location' },
  { key: 'projectDescription', label: 'Project Description' },
]
export function ProjectDetailsForm({ leadId, result, onSaved, reload }: {
  leadId: string; result: ProjectDetailsResult; onSaved: (result: ProjectDetailsResult) => void; reload: () => void
}) {
  const [values, setValues] = useState<ProjectDetails>(result.details!)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectDetails, string>>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [locked, setLocked] = useState(false)
  const pending = useRef(false)
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || result.projectSubmitted || locked) return
    const cleaned = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])) as ProjectDetails
    const next: typeof errors = {}
    fields.forEach(field => {
      if (!cleaned[field.key]) next[field.key] = `${field.label} is required.`
      else if (field.options && !field.options.includes(cleaned[field.key])) next[field.key] = 'Choose an available option.'
    })
    if (cleaned.customerBudget && (!/^\d+(\.\d+)?$/.test(cleaned.customerBudget) || !Number.isFinite(Number(cleaned.customerBudget)) || Number(cleaned.customerBudget) <= 0)) next.customerBudget = 'Enter a budget greater than zero.'
    setErrors(next)
    if (Object.keys(next).length) return
    pending.current = true; setBusy(true); setMessage('')
    const saved = await requestProjectDetails(leadId, cleaned)
    pending.current = false; setBusy(false)
    if (saved.success) {
      setMessage('Project details submitted successfully.')
      onSaved(saved)
    } else if (saved.conflict) {
      setLocked(true)
      reload()
    } else setMessage(saved.message)
  }
  if (result.projectSubmitted) {
    const icons = { siteSpace: FiMaximize, typeOfProject: FiHome, projectScope: FiLayers, planLevel: FiLayers, customerBudget: FiCreditCard, siteLocation: FiMapPin, projectDescription: FiFileText }
    const displayValue = (key: keyof ProjectDetails) => {
      const value = result.details?.[key]
      if (!value) return 'Not available'
      if ((key === 'customerBudget' || key === 'siteSpace') && /^\d+(\.\d+)?$/.test(value)) {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(value))
      }
      return value
    }
    return (
      <section className="dashboardSection projectDetails projectDetails--summary">
        <header className="projectSummary__header">
          <div>
            <p className="projectSummary__eyebrow">YOUR PROJECT BRIEF</p>
            <h2 className="dashboardSection__title">Project Details</h2>
            <p className="projectSummary__subtitle">Your submitted requirements, together in one place.</p>
          </div>
          <span className="projectSummary__badge" role="status"><FiCheckCircle aria-hidden="true" />Submitted</span>
        </header>
        <div className="projectSummary__body">
          <dl className="projectSummary__grid">
            {fields.filter(field => field.key !== 'projectDescription').map(field => {
              const Icon = icons[field.key]
              return <div key={field.key} className="projectSummary__item">
                <span className="projectSummary__icon" aria-hidden="true"><Icon /></span>
                <div><dt>{field.label}</dt><dd className={field.key === 'customerBudget' ? 'projectSummary__budget' : undefined}>{displayValue(field.key)}</dd></div>
              </div>
            })}
          </dl>
          <div className="projectSummary__description">
            <h3><FiFileText aria-hidden="true" />Project Description</h3>
            <p>{result.details?.projectDescription || 'Not available'}</p>
          </div>
        </div>
        <footer className="projectSummary__footer">
          <FiLock aria-hidden="true" />
          <p><strong>Your details are saved.</strong> This summary is read-only. Please contact our team if you need to make changes.</p>
        </footer>
      </section>
    )
  }
  return (
    <section className="dashboardSection projectDetails">
      <h2 className="dashboardSection__title">Project Details</h2>
      <p>Tell us about your project. Once submitted, these details cannot be edited.</p>
      <form onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy || locked} className="projectDetails__grid">
          {fields.map(field => {
            const id = `project-${field.key}`
            const props = { id, required: true, value: values[field.key], 'aria-invalid': Boolean(errors[field.key]), 'aria-describedby': `${id}-error`,
              onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                setValues(current => ({ ...current, [field.key]: event.target.value }))
                setErrors(current => ({ ...current, [field.key]: undefined }))
              } }
            return <div key={field.key}>
              <label htmlFor={id}>{field.label}</label>
              {field.options ? <select {...props}><option value="">Select an option</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
                : field.key === 'projectDescription' ? <textarea {...props} rows={4} />
                : <input {...props} inputMode={field.key === 'customerBudget' ? 'decimal' : undefined} />}
              <span id={`${id}-error`} className="projectDetails__error">{errors[field.key]}</span>
            </div>
          })}
        </fieldset>
        {message && <p role="alert" className="projectDetails__error">{message}</p>}
        <button type="submit" disabled={busy || locked} className="projectDetails__submit">{busy ? 'Submitting…' : 'Submit Project Details'}</button>
      </form>
    </section>
  )
}
