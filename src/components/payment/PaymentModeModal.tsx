import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { createPortal } from 'react-dom'
import type { PaymentMode } from '../../types/payment'
import './PaymentModeModal.css'

type PaymentModeModalProps = {
  isOpen: boolean
  amountLabel: string
  isSubmitting: boolean
  onClose: () => void
  onContinueOnline: () => void
  onSubmitOffline: (description: string) => void
}

export function PaymentModeModal({
  isOpen,
  amountLabel,
  isSubmitting,
  onClose,
  onContinueOnline,
  onSubmitOffline,
}: PaymentModeModalProps) {
  const [mode, setMode] = useState<PaymentMode>('Online')
  const [description, setDescription] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setMode('Online')
      setDescription('')
      setValidationError(null)
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (typeof document === 'undefined') return null

  function handleContinue() {
    if (mode === 'Online') {
      onContinueOnline()
      return
    }

    const trimmed = description.trim()
    if (!trimmed) {
      setValidationError('Please describe how you will complete this payment offline.')
      return
    }
    setValidationError(null)
    onSubmitOffline(trimmed)
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="paymentModeModal__layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="paymentModeModal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
          />
          <div className="paymentModeModal__viewport">
            <motion.div
              className="paymentModeModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-mode-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.97, y: 10, filter: 'blur(6px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="paymentModeModal__glow" aria-hidden="true" />
              <button
                type="button"
                className="paymentModeModal__close"
                aria-label="Close"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <FiX aria-hidden="true" />
              </button>

              <p className="paymentModeModal__eyebrow">Amount Due · {amountLabel}</p>
              <h2 id="payment-mode-modal-title" className="paymentModeModal__title">
                How would you like to pay?
              </h2>

              <div className="paymentModeModal__options">
                <label
                  className={`paymentModeModal__option ${mode === 'Online' ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value="Online"
                    checked={mode === 'Online'}
                    onChange={() => setMode('Online')}
                    disabled={isSubmitting}
                  />
                  <span>
                    <strong>Online Payment</strong>
                    <small>Pay securely now via Razorpay checkout.</small>
                  </span>
                </label>

                <label
                  className={`paymentModeModal__option ${mode === 'Offline' ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMode"
                    value="Offline"
                    checked={mode === 'Offline'}
                    onChange={() => setMode('Offline')}
                    disabled={isSubmitting}
                  />
                  <span>
                    <strong>Offline Payment</strong>
                    <small>Pay directly with your supervisor (cash, cheque, bank transfer, etc.).</small>
                  </span>
                </label>
              </div>

              {mode === 'Offline' ? (
                <div className="paymentModeModal__field">
                  <label htmlFor="offlinePaymentDescription">
                    Describe how you'll complete this payment
                  </label>
                  <textarea
                    id="offlinePaymentDescription"
                    rows={4}
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value)
                      if (validationError) setValidationError(null)
                    }}
                    placeholder="e.g. Will pay by cheque at the site office by Friday."
                    disabled={isSubmitting}
                  />
                  {validationError ? <p className="paymentModeModal__error">{validationError}</p> : null}
                  <p className="paymentModeModal__hint">
                    Your supervisor will contact you to complete this payment.
                  </p>
                </div>
              ) : null}

              <div className="paymentModeModal__actions">
                <button
                  type="button"
                  className="paymentModeModal__button"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="paymentModeModal__button paymentModeModal__button--primary"
                  onClick={handleContinue}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : mode === 'Online' ? 'Continue to Payment' : 'Submit Details'}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
