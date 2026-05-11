import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { ConsultationForm } from './ConsultationForm'
import './ConsultationForm.css'

type ConsultationModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function ConsultationModal({ isOpen, onClose }: ConsultationModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="consultation-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="consultation-modal__veil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="consultation-modal__shell"
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
