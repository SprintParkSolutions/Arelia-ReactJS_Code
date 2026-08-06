import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { createPortal } from 'react-dom'
import './LogoutModal.css'

type LogoutModalProps = {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function LogoutModal({ isOpen, onCancel, onConfirm }: LogoutModalProps) {
  useEffect(() => {
    if (!isOpen) return undefined

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="logoutModal__layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="logoutModal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <div className="logoutModal__viewport">
            <motion.div
              className="logoutModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-modal-title"
              aria-describedby="logout-modal-subtitle"
              initial={{ opacity: 0, scale: 0.95, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.97, y: 10, filter: 'blur(6px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="logoutModal__glow" aria-hidden="true" />
              <button
                type="button"
                className="logoutModal__close"
                aria-label="Close logout confirmation"
                onClick={onCancel}
              >
                <FiX aria-hidden="true" />
              </button>
              <p className="logoutModal__eyebrow">Arelia Client Portal</p>
              <h2 id="logout-modal-title" className="logoutModal__title">
                Leave your workspace?
              </h2>
              <p id="logout-modal-subtitle" className="logoutModal__subtitle">
                You will be signed out of the private client portal and returned to the public site.
              </p>
              <div className="logoutModal__actions">
                <button type="button" className="logoutModal__button" onClick={onCancel}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="logoutModal__button logoutModal__button--primary"
                  onClick={onConfirm}
                >
                  Confirm Logout
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
