import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './ConsultationForm.css'

export type ConsultationFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
}

type ConsultationFormErrors = Partial<Record<keyof ConsultationFormValues, string>>

type ConsultationFormProps = {
  mode?: 'modal' | 'page'
  onSuccess?: () => void
  title?: string
  description?: string
  submitLabel?: string
}

const initialValues: ConsultationFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
}

const namePattern = /^[A-Za-z\s]*$/
const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

function validate(values: ConsultationFormValues) {
  const errors: ConsultationFormErrors = {}

  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required'
  } else if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(values.firstName.trim())) {
    errors.firstName = 'First name should contain letters only'
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required'
  } else if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(values.lastName.trim())) {
    errors.lastName = 'Last name should contain letters only'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required'
  } else if (values.phone.length !== 10) {
    errors.phone = 'Phone number must be 10 digits'
  }

  return errors
}

export function ConsultationForm({
  mode = 'modal',
  onSuccess,
  title = 'Tell us about your project',
  description = 'Share a few essentials and our team can shape the next conversation around your space.',
  submitLabel = 'Continue',
}: ConsultationFormProps) {
  const [values, setValues] = useState<ConsultationFormValues>(initialValues)
  const [errors, setErrors] = useState<ConsultationFormErrors>({})
  const [statusMessage, setStatusMessage] = useState('')

  const cardClassName = useMemo(
    () =>
      mode === 'page'
        ? 'consultation-form consultation-form--page'
        : 'consultation-form consultation-form--modal',
    [mode],
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target

    if ((name === 'firstName' || name === 'lastName') && !namePattern.test(value)) {
      return
    }

    if (name === 'phone') {
      if (!/^\d*$/.test(value)) return
      if (value.length > 10) return
    }

    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setStatusMessage('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('')
      return
    }

    setStatusMessage('Details look good. Submission wiring can be added next.')
    onSuccess?.()
  }

  return (
    <form className={cardClassName} onSubmit={handleSubmit} noValidate>
      <div className="consultation-form__intro">
        <p className="consultation-form__eyebrow">Consultation Request</p>
        <h2 className="consultation-form__title">{title}</h2>
        <p className="consultation-form__description">{description}</p>
      </div>

      <div className="consultation-form__grid">
        <label className="consultation-form__field">
          <span className="consultation-form__label">First Name</span>
          <input
            type="text"
            name="firstName"
            value={values.firstName}
            onChange={handleChange}
            placeholder="First Name"
            autoComplete="given-name"
          />
          <span className="consultation-form__error">{errors.firstName}</span>
        </label>

        <label className="consultation-form__field">
          <span className="consultation-form__label">Last Name</span>
          <input
            type="text"
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            autoComplete="family-name"
          />
          <span className="consultation-form__error">{errors.lastName}</span>
        </label>

        <label className="consultation-form__field">
          <span className="consultation-form__label">Email</span>
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            placeholder="Email Address"
            autoComplete="email"
            inputMode="email"
          />
          <span className="consultation-form__error">{errors.email}</span>
        </label>

        <label className="consultation-form__field">
          <span className="consultation-form__label">Phone</span>
          <input
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            autoComplete="tel"
            inputMode="numeric"
          />
          <span className="consultation-form__error">{errors.phone}</span>
        </label>

        <label className="consultation-form__field consultation-form__field--full">
          <span className="consultation-form__label">Company</span>
          <input
            type="text"
            name="company"
            value={values.company}
            onChange={handleChange}
            placeholder="Company Name (Optional)"
            autoComplete="organization"
          />
          <span className="consultation-form__hint">Optional</span>
        </label>
      </div>

      <div className="consultation-form__footer">
        <button type="submit" className="consultation-form__submit">
          {submitLabel}
        </button>
        <p className="consultation-form__status" role="status">
          {statusMessage}
        </p>
      </div>
    </form>
  )
}
