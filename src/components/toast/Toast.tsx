import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'
import './Toast.css'

export type ToastTone = 'success' | 'error' | 'info'

type ToastProps = {
  message: string
  tone: ToastTone
  onDismiss: () => void
}

const TONE_ICON: Record<ToastTone, typeof FiInfo> = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
}

export function Toast({ message, tone, onDismiss }: ToastProps) {
  const Icon = TONE_ICON[tone]

  return (
    <div className={`toast toast--${tone}`} role="alert">
      <Icon className="toast__icon" aria-hidden="true" />
      <p className="toast__message">{message}</p>
      <button type="button" className="toast__dismiss" onClick={onDismiss} aria-label="Dismiss notification">
        <FiX aria-hidden="true" />
      </button>
    </div>
  )
}
