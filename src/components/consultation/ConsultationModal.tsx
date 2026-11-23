import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useEffectEvent } from 'react'
import { createPortal } from 'react-dom'
import { ConsultationForm } from './ConsultationForm'
import './ConsultationForm.css'

type ConsultationModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ConsultationModal({ isOpen, onClose }: ConsultationModalProps) {
  const reduceMotion = useReducedMotion()
  const closeFromEscape = useEffectEvent(() => onClose())
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFromEscape()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="consultation-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.16, ease: 'easeOut' }}
        >
          <div className="consultation-modal__veil" aria-hidden="true" />

          <div
            className="consultation-modal__shell"
            role="dialog"
            aria-modal="true"
            aria-label="Book your consultation"
          >
            <div className="consultation-modal__ambient consultation-modal__ambient--one" />
            <div className="consultation-modal__ambient consultation-modal__ambient--two" />

            <button
              type="button"
              className="consultation-modal__close"
              onClick={onClose}
              aria-label="Close consultation form"
            >
              <span />
              <span />
            </button>

            <ConsultationForm
              mode="modal"
              title="Book your consultation"
              description="A few details are enough to start a refined conversation about your project, timeline, and design direction."
              submitLabel="Request Consultation"
              onSuccess={onClose}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
