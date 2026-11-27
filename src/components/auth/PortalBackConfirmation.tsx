import { useEffect, useRef } from 'react'
import { FiLogOut } from 'react-icons/fi'
import { matchPath, useBlocker, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './PortalBackConfirmation.css'

function isPortalPath(pathname: string) {
  return Boolean(matchPath('/dashboard', pathname) || matchPath('/payment/*', pathname))
}

export function PortalBackConfirmation() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  const blocker = useBlocker(({ currentLocation, nextLocation, historyAction }) =>
    isAuthenticated &&
    historyAction === 'POP' &&
    isPortalPath(currentLocation.pathname) &&
    !isPortalPath(nextLocation.pathname),
  )
  const isOpen = isAuthenticated && blocker.state === 'blocked'

  useEffect(() => {
    const element = dialog.current
    if (!isOpen || !element) return

    element.showModal()
    return () => element.close()
  }, [isOpen])

  if (!isAuthenticated || blocker.state !== 'blocked') return null

  const stayLoggedIn = blocker.reset
  const confirmLogout = () => {
    blocker.reset()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <dialog
      ref={dialog}
      className="portalBackConfirmation"
      aria-labelledby="portal-back-confirmation-title"
      aria-describedby="portal-back-confirmation-description"
      onCancel={(event) => {
        event.preventDefault()
        stayLoggedIn()
      }}
    >
      <div className="portalBackConfirmation__body">
        <span className="portalBackConfirmation__icon" aria-hidden="true">
          <FiLogOut />
        </span>
        <div>
          <h2 id="portal-back-confirmation-title">Do you want to log out?</h2>
          <p id="portal-back-confirmation-description">You will return to the login page.</p>
        </div>
      </div>
      <div className="portalBackConfirmation__actions">
        <button type="button" onClick={stayLoggedIn} autoFocus>No</button>
        <button type="button" className="portalBackConfirmation__confirm" onClick={confirmLogout}>Yes</button>
      </div>
    </dialog>
  )
}
