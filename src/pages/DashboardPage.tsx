import { AnimatePresence, motion } from 'framer-motion'
import { useDeferredValue, useEffect, useState, useTransition, type ReactNode } from 'react'
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiImage,
  FiLogOut,
  FiMail,
  FiPhone,
  FiUserCheck,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { LogoutModal } from '../components/auth/LogoutModal'
import { dashboardTabs } from '../constants/dashboardTabs'
import { useAuth } from '../context/AuthContext'
import {
  getClientPortalDetails,
  getPaymentTerms,
  getProjectByContact,
  getProjectFiles,
  getProjectStatus,
  type ClientPortalResponse,
  type ContactProjectLookup,
  type PaymentTerm,
  type ProjectFile,
  type ProjectImage,
  type ProjectStatusRecord,
  type ProjectVendor,
} from '../services/salesforceApi'
import './DashboardPage.css'

const staggerTransition = {
  staggerChildren: 0.08,
  delayChildren: 0.06,
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

function GlassEmptyState({ message }: { message: string }) {
  return <div className="dashboardEmptyState">{message}</div>
}

function isImageFileType(fileType?: string) {
  if (!fileType) return false
  const normalized = fileType.trim().toUpperCase()
  return ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP'].includes(normalized)
}

function getFileTypeLabel(fileType?: string) {
  if (!fileType) return 'Secure file'
  return fileType.trim().toUpperCase()
}

function formatReadableFileMeta(file: ProjectFile) {
  const legacyMeta = formatFileMeta(file)
  const parts: string[] = []
  if (file.fileType) parts.push(file.fileType)
  if (file.fileSize && file.fileSize > 0) {
    const sizeInMb = file.fileSize / (1024 * 1024)
    parts.push(sizeInMb >= 1 ? `${sizeInMb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.fileSize / 1024))} KB`)
  }
  if (!parts.length) return legacyMeta
  return parts.length > 0 ? parts.join(' • ') : 'Secure project file'
}

function formatFileMeta(file: ProjectFile) {
  const parts: string[] = []
  if (file.fileType) parts.push(file.fileType)
  if (file.fileSize && file.fileSize > 0) {
    const sizeInMb = file.fileSize / (1024 * 1024)
    parts.push(sizeInMb >= 1 ? `${sizeInMb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.fileSize / 1024))} KB`)
  }
  return parts.join(' • ') || 'Secure project file'
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value?: string | null
}) {
  return (
    <motion.article
      className="dashboardInfoCard"
      variants={fadeUpItem}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div className="dashboardInfoCard__icon">{icon}</div>
      <span className="dashboardInfoCard__label">{label}</span>
      <strong className="dashboardInfoCard__value">{value || 'Not available'}</strong>
    </motion.article>
  )
}

function ProfileDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value?: string | null
}) {
  return (
    <motion.div className="dashboardProfileDetail" variants={fadeUpItem}>
      <span className="dashboardProfileDetail__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="dashboardProfileDetail__copy">
        <span className="dashboardProfileDetail__label">{label}</span>
        <strong className="dashboardProfileDetail__value">{value || 'Not available'}</strong>
      </div>
    </motion.div>
  )
}

function ProjectStatusTab({ contactId, projectId }: { contactId: string; projectId?: string }) {
  const [statusData, setStatusData] = useState<ProjectStatusRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStatus() {
      setIsLoading(true)
      const res = await getProjectStatus(contactId, projectId)
      if (res?.success && res.projects.length > 0) {
        setStatusData(res.projects[0])
      }
      setIsLoading(false)
    }
    void loadStatus()
  }, [contactId, projectId])

  if (isLoading) return <p className="dashboard-loading">Loading project status...</p>
  if (!statusData) return <GlassEmptyState message="No active project status found." />

  const completion = Math.round(statusData.completionPercentage || 0)

  return (
    <motion.section
      className="dashboardSection"
      initial="hidden"
      animate="visible"
      variants={{ visible: staggerTransition }}
    >
      <div className="dashboardSection__heading">
        <div>
          <p className="dashboardSection__eyebrow">Project Status</p>
          <h2 className="dashboardSection__title">{statusData.projectName}</h2>
        </div>
        <span className="dashboardSection__chip">{statusData.projectStatus || 'Active'}</span>
      </div>

      <div className="dashboardStatusHero">
        <motion.article className="dashboardStatusHeroCard" variants={fadeUpItem}>
          <div className="dashboardStatusHeroCard__progressTop" aria-hidden="true">
            <motion.div
              className="dashboardStatusHeroCard__progressLine"
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="dashboardStatusHeroCard__header">
            <div>
              <p className="dashboardSection__eyebrow">Live Snapshot</p>
              <h3>Current phase overview</h3>
            </div>
            <span className="dashboardStatusHeroCard__chip">{statusData.projectStatus || 'In Progress'}</span>
          </div>
          <div className="dashboardStatusHeroCard__body">
            <strong>{completion}%</strong>
            <p>Phase completion</p>
          </div>
        </motion.article>
      </div>

      <div className="dashboardStatusLayout dashboardStatusLayout--metrics">
        <motion.article className="dashboardSpotlightCard dashboardSpotlightCard--status" variants={fadeUpItem}>
          <div className="dashboardSpotlightCard__head">
            <span>Overall Delivery Progress</span>
            <strong>{completion}%</strong>
          </div>
          <div className="dashboardProgressBar">
            <motion.div
              className="dashboardProgressBar__fill"
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="dashboardSpotlightCard__meta">
            <span>
              Budget: {statusData.budget ? `Rs ${statusData.budget.toLocaleString()}` : 'NA'}
            </span>
            <span>Timeline reviewed in real time</span>
          </div>
        </motion.article>

        <motion.div className="dashboardMetricGrid" variants={fadeUpItem}>
          <InfoCard icon={<FiBriefcase />} label="Status" value={statusData.projectStatus} />
          <InfoCard
            icon={<FiCreditCard />}
            label="Estimated Budget"
            value={statusData.budget ? `Rs ${statusData.budget.toLocaleString()}` : null}
          />
          <InfoCard icon={<FiCalendar />} label="Start Date" value={formatDate(statusData.startDate)} />
          <InfoCard icon={<FiCalendar />} label="Estimated End Date" value={formatDate(statusData.endDate)} />
        </motion.div>
      </div>
    </motion.section>
  )
}

function VendorTasksTab({ contactId, projectId }: { contactId: string; projectId?: string }) {
  const [vendors, setVendors] = useState<ProjectVendor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadVendors() {
      setIsLoading(true)
      const res = await getProjectStatus(contactId, projectId)
      if (res?.success && res.projects.length > 0) {
        setVendors(res.projects[0].vendors || [])
      }
      setIsLoading(false)
    }
    void loadVendors()
  }, [contactId, projectId])

  if (isLoading) return <p className="dashboard-loading">Loading vendor tracking...</p>
  if (vendors.length === 0) {
    return <GlassEmptyState message="No vendors are currently assigned to this project." />
  }

  return (
    <motion.section
      className="dashboardSection"
      initial="hidden"
      animate="visible"
      variants={{ visible: staggerTransition }}
    >
      <div className="dashboardSection__heading">
        <div>
          <p className="dashboardSection__eyebrow">Active Site Operations</p>
          <h2 className="dashboardSection__title">Vendor Execution Timeline</h2>
          <p className="dashboardSection__lead">
            Real-time progress tracking for specialized artisans and contractors across active work streams.
          </p>
        </div>
      </div>

      <div className="dashboardVendorGrid">
        {vendors.map((vendor, index) => {
          const vendorCompletion = Math.round(vendor.completionPercentage || 0)
          const initials = vendor.vendorName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()

          return (
            <motion.article
              key={`${vendor.vendorName}-${index}`}
              className="dashboardVendorCard dashboardVendorCard--static"
              variants={fadeUpItem}
            >
              <div className="dashboardVendorCard__content">
                <div className="dashboardVendorCard__top">
                  <span className="dashboardVendorCard__avatar">{initials || 'VN'}</span>
                  <div>
                    <h3>{vendor.vendorName}</h3>
                    <p>{vendor.vendorCategory || 'Assigned Vendor'}</p>
                  </div>
                  <span className="dashboardVendorCard__badge">
                    {vendorCompletion >= 100
                      ? 'Completed'
                      : vendorCompletion >= 60
                        ? 'On Schedule'
                        : vendorCompletion > 0
                          ? 'Active Phase'
                          : 'Not Started'}
                  </span>
                </div>

                <div className="dashboardVendorCard__progress">
                  <div className="dashboardVendorCard__progressMeta">
                    <span>{vendor.vendorCategory || 'Current progress'}</span>
                    <strong>{vendorCompletion}%</strong>
                  </div>
                  <div className="dashboardProgressBar dashboardProgressBar--thin">
                    <motion.div
                      className="dashboardProgressBar__fill dashboardProgressBar__fill--neon"
                      initial={{ width: 0 }}
                      animate={{ width: `${vendorCompletion}%` }}
                      transition={{ duration: 0.9, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div className="dashboardVendorCard__footer">
                    <span>Completion status</span>
                    <strong>{vendorCompletion >= 100 ? 'Completed' : 'In progress'}</strong>
                  </div>
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>
    </motion.section>
  )
}

function PaymentTermsTab({ projectName }: { projectName?: string }) {
  const [terms, setTerms] = useState<PaymentTerm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTerms() {
      if (!projectName) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const res = await getPaymentTerms(projectName)
      if (Array.isArray(res)) setTerms(res)
      setIsLoading(false)
    }
    void loadTerms()
  }, [projectName])

  if (isLoading) return <p className="dashboard-loading">Loading payment terms...</p>
  if (terms.length === 0) {
    return <GlassEmptyState message="No payment terms found for this project." />
  }

  return (
    <motion.section
      className="dashboardSection"
      initial="hidden"
      animate="visible"
      variants={{ visible: staggerTransition }}
    >
      <div className="dashboardSection__heading">
        <div>
          <p className="dashboardSection__eyebrow">Financial Schedule</p>
          <h2 className="dashboardSection__title">Payment schedule and milestone release</h2>
          <p className="dashboardSection__lead">
            Your bespoke payment structure with transparent milestone release across execution phases.
          </p>
        </div>
      </div>

      <div className="dashboardPaymentTimeline">
        {terms.map((term, index) => (
          <motion.div
            key={`${term.label || term.name || 'term'}-${index}`}
            className="dashboardPaymentTimeline__row"
            variants={fadeUpItem}
          >
            <div className={`dashboardPaymentTimeline__node ${term.paymentReceived ? 'is-paid' : 'is-pending'}`} />
            <motion.article
              className={`dashboardPaymentCard ${term.paymentReceived ? 'is-paid' : 'is-pending'}`}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <div className="dashboardPaymentCard__head">
                <div>
                  <span
                    className={`dashboardPaymentCard__status ${term.paymentReceived ? 'is-paid' : 'is-pending'}`}
                  >
                    {term.paymentReceived ? 'Received' : 'Pending'}
                  </span>
                  <h3>{term.label || term.name}</h3>
                  <p className="dashboardPaymentCard__microcopy">
                    {index === 0
                      ? 'Initial design and procurement release.'
                      : index === 1
                        ? 'Mid-project execution milestone.'
                        : 'Final delivery and handover release.'}
                  </p>
                </div>
                <div className="dashboardPaymentCard__aside">
                  <span>Due Date</span>
                  <strong>{term.paymentReceived ? 'Paid' : formatDate(term.dueDate) || 'Pending'}</strong>
                </div>
              </div>

              <div className="dashboardPaymentCard__body">
                <strong>{term.percentage ?? 0}% of contract</strong>
              </div>
            </motion.article>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

function DocumentsTab({ projectId }: { projectId?: string }) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [images, setImages] = useState<ProjectImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPreview, setSelectedPreview] = useState<
    | { type: 'file'; title: string; subtitle?: string; href: string; meta?: string; actionLabel?: string }
    | { type: 'image'; title: string; subtitle?: string; href: string; meta?: string; actionLabel?: string }
    | null
  >(null)

  useEffect(() => {
    async function loadMedia() {
      if (!projectId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)

      const filesRes = await getProjectFiles(projectId)

      if (Array.isArray(filesRes)) {
        setFiles(filesRes)
        setImages(
          filesRes
            .filter((file) => isImageFileType(file.fileType))
            .map((file) => ({
              documentId: file.documentId,
              versionId: file.versionId,
              title: file.title,
              imageUrl: file.downloadUrl,
              previewUrl: file.previewUrl || file.downloadUrl,
            })),
        )
      } else {
        setFiles([])
        setImages([])
      }

      setIsLoading(false)
    }
    void loadMedia()
  }, [projectId])

  useEffect(() => {
    if (!selectedPreview) return undefined

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPreview(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPreview])

  if (isLoading) return <p className="dashboard-loading">Loading project media...</p>
  if (files.length === 0 && images.length === 0) {
    return <GlassEmptyState message="No files or images have been uploaded to this project yet." />
  }

  return (
    <>
      <motion.section
        className="dashboardSection"
        initial="hidden"
        animate="visible"
        variants={{ visible: staggerTransition }}
      >
        <div className="dashboardSection__heading">
          <div>
            <p className="dashboardSection__eyebrow">Project Archive</p>
            <h2 className="dashboardSection__title">Documents, reports, and visual references</h2>
            <p className="dashboardSection__lead">
              Secure access to current-phase renders, floor plans, material studies, and client documentation.
            </p>
          </div>
        </div>

        {images.length > 0 ? (
          <div className="dashboardMediaBlock">
            <div className="dashboardSection__subhead">
              <h3>Project Photos</h3>
              <span>{images.length} items</span>
            </div>
            <div className="dashboardImageGrid">
              {images.map((img, index) => (
                <motion.button
                  key={`${img.imageUrl}-${index}`}
                  type="button"
                  className="dashboardImageCard"
                  variants={fadeUpItem}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  onClick={() =>
                    setSelectedPreview({
                      type: 'image',
                      title: img.title,
                      href: img.imageUrl,
                      subtitle: 'Project image',
                      meta: 'Private archive image',
                      actionLabel: 'Open full size',
                    })
                  }
                >
                  <div className="dashboardImageCard__preview">
                    <img src={img.imageUrl} alt={img.title} loading="lazy" />
                    <div className="dashboardImageCard__overlay">
                      <span className="dashboardImageCard__tag">Private Archive</span>
                      <strong>{img.title}</strong>
                    </div>
                  </div>
                  <div className="dashboardImageCard__body">
                    <span className="dashboardImageCard__icon">
                      <FiImage />
                    </span>
                    <div>
                      <strong>{img.title}</strong>
                      <p>Click to preview</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : null}

        {files.length > 0 ? (
          <div className="dashboardMediaBlock">
            <div className="dashboardSection__subhead">
              <h3>Project Documents</h3>
              <span>{files.length} items</span>
            </div>
            <div className="dashboardDocumentGrid">
              {files.map((file, index) => (
                <motion.article
                  key={`${file.downloadUrl}-${index}`}
                  className="dashboardDocumentCard"
                  variants={fadeUpItem}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <div className="dashboardDocumentCard__icon">
                    <FiFileText />
                  </div>
                  <div className="dashboardDocumentCard__body">
                    <strong>{file.title}</strong>
                    <p>{formatReadableFileMeta(file)}</p>
                  </div>
                  <div className="dashboardDocumentCard__actions">
                    <button
                      type="button"
                      className="dashboardDocumentCard__button"
                      onClick={() =>
                        setSelectedPreview({
                          type: 'file',
                          title: file.title,
                          href: file.downloadUrl,
                          subtitle: getFileTypeLabel(file.fileType),
                          meta: formatReadableFileMeta(file),
                          actionLabel: 'Open secure file',
                        })
                      }
                    >
                      Preview
                    </button>
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={file.title}
                      className="dashboardDocumentCard__download"
                    >
                      <FiDownload />
                    </a>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        ) : null}
      </motion.section>

      {typeof document !== 'undefined' ? createPortal(<AnimatePresence>
        {selectedPreview ? (
          <motion.div
            className="dashboardPreviewLayer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="dashboardPreview__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPreview(null)}
            />
            <motion.div
              className="dashboardPreview__shell"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="dashboardPreview"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dashboard-preview-title"
                aria-describedby="dashboard-preview-subtitle"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="dashboardPreview__header">
                <div className="dashboardPreview__headerCopy">
                  <p className="dashboardPreview__eyebrow">
                    {selectedPreview.type === 'image' ? 'Image Preview' : 'File Preview'}
                  </p>
                  <h3 id="dashboard-preview-title">{selectedPreview.title}</h3>
                  <p id="dashboard-preview-subtitle">{selectedPreview.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="dashboardPreview__close"
                  aria-label="Close preview"
                  onClick={() => setSelectedPreview(null)}
                >
                  ×
                  <FiX aria-hidden="true" />
                </button>
              </div>

              {selectedPreview.type === 'image' ? (
                <div className="dashboardPreview__stage dashboardPreview__stage--image">
                  <div className="dashboardPreview__metaBar">
                    <span>{selectedPreview.title}</span>
                    <span>{selectedPreview.meta || 'Private archive image'}</span>
                  </div>
                  <div className="dashboardPreview__image">
                    <img src={selectedPreview.href} alt={selectedPreview.title} />
                  </div>
                </div>
              ) : (
                <div className="dashboardPreview__stage dashboardPreview__stage--file">
                  <div className="dashboardPreview__metaBar">
                    <span>{selectedPreview.title}</span>
                    <span>{selectedPreview.meta || selectedPreview.subtitle || 'Secure file'}</span>
                  </div>
                  <div className="dashboardPreview__file">
                    <span className="dashboardPreview__fileIcon" aria-hidden="true">
                      <FiFileText />
                    </span>
                    <div className="dashboardPreview__fileCopy">
                      <strong>{selectedPreview.subtitle || 'Secure file'}</strong>
                      <p>This document opens in a separate secure tab for detailed review or download.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="dashboardPreview__footer">
                <div>
                  <strong>{selectedPreview.title}</strong>
                  <p>{selectedPreview.meta || selectedPreview.subtitle}</p>
                </div>
                <a
                  href={selectedPreview.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboardPreview__cta"
                >
                  {selectedPreview.actionLabel || 'Open'}
                </a>
              </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>, document.body) : null}
    </>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { activeDashboardTab, client: authClient, logout, setActiveDashboardTab } = useAuth()
  const deferredDashboardTab = useDeferredValue(activeDashboardTab)
  const [isTabPending, startTabTransition] = useTransition()
  const [portalData, setPortalData] = useState<ClientPortalResponse | null>(null)
  const [resolvedProject, setResolvedProject] = useState<ContactProjectLookup | null>(null)
  const [featuredProjectImage, setFeaturedProjectImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      const contactId = authClient?.contactId || localStorage.getItem('contactId')
      const leadId = authClient?.leadId || localStorage.getItem('leadId')
      const email = authClient?.email || null
      const lookupTargetId = contactId || leadId

      const [response, projectLookup] = await Promise.all([
        getClientPortalDetails({ contactId, leadId, email }),
        lookupTargetId ? getProjectByContact(lookupTargetId, email) : Promise.resolve(null),
      ])

      setResolvedProject(projectLookup)

      if (response.success) {
        setPortalData(response)
        setError('')
      } else {
        setError(response.message || 'Unable to load your dashboard.')
      }
      setIsLoading(false)
    }

    void loadDashboard()
  }, [authClient?.contactId, authClient?.email, authClient?.leadId])

  const client = portalData?.client
  const projects = portalData?.projects || []
  const firstProject = projects[0]
  const activeProjectId = firstProject?.id || resolvedProject?.id
  const activeProjectName = firstProject?.name || resolvedProject?.name
  const contactId = authClient?.contactId || localStorage.getItem('contactId') || ''
  const desktopNavItems = [
    { id: 'profile', label: 'Profile & Overview', icon: FiUserCheck },
    { id: 'status', label: 'Project Status', icon: FiCalendar },
    { id: 'vendor', label: 'Vendor Tasks', icon: FiBriefcase },
    { id: 'payment', label: 'Payment Terms', icon: FiCreditCard },
    { id: 'documents', label: 'Documents & Reports', icon: FiFileText },
  ] as const

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    navigate('/login', { replace: true })
  }

  const handleTabChange = (tabId: (typeof desktopNavItems)[number]['id']) => {
    startTabTransition(() => {
      setActiveDashboardTab(tabId)
    })
  }

  useEffect(() => {
    async function loadFeaturedProjectImage() {
      if (!activeProjectId) {
        setFeaturedProjectImage(null)
        return
      }

      const files = await getProjectFiles(activeProjectId)
      const firstImage = Array.isArray(files) ? files.find((file) => isImageFileType(file.fileType)) : null
      setFeaturedProjectImage(firstImage?.downloadUrl || firstImage?.previewUrl || null)
    }

    void loadFeaturedProjectImage()
  }, [activeProjectId])

  return (
    <main className="dashboardPage">
      <LogoutModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      <div className="dashboardPage__ambient" aria-hidden="true">
        <span className="dashboardPage__orb dashboardPage__orb--gold" />
        <span className="dashboardPage__orb dashboardPage__orb--blue" />
        <span className="dashboardPage__grid" />
      </div>

      <section className="dashboardShell">
        <header className="dashboardMobileBar">
          <button type="button" className="dashboardMobileBar__brand" onClick={() => handleTabChange('profile')}>
            <img src="/images/Logos/Arelia.png" alt="Arelia logo" className="dashboardMobileBar__brandLogo" />
            <span>ARELIA</span>
          </button>
          <div className="dashboardMobileBar__actions">
            <span className="dashboardMobileBar__clientLabel">Client</span>
            <button type="button" className="dashboardMobileBar__logout" onClick={() => setShowLogoutConfirm(true)}>
              <FiLogOut />
            </button>
          </div>
        </header>

        <aside className="dashboardRail">
          <div className="dashboardRail__brandWrap">
            <button type="button" className="dashboardRail__brand" onClick={() => handleTabChange('profile')}>
              <strong className="dashboardRail__brandTitle">ARELIA</strong>
              <span className="dashboardRail__brandSubtitle">Client Portal</span>
            </button>
          </div>

          <nav className="dashboardRail__nav" aria-label="Client portal sections">
            {desktopNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeDashboardTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dashboardRail__link${isActive ? ' is-active' : ''}`}
                  onClick={() => handleTabChange(item.id)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="dashboardRail__footer">
            <button type="button" className="dashboardRail__footerAction" onClick={() => setShowLogoutConfirm(true)}>
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="dashboardWorkspace">
          <header className="dashboardWorkspace__topbar">
            <div className="dashboardWorkspace__topbarCopy">
              <p className="dashboardWorkspace__eyebrow">
                {dashboardTabs.find((tab) => tab.id === deferredDashboardTab)?.label || 'Client Portal'}
              </p>
            </div>
          </header>

          {isLoading ? <div className="dashboardState">Loading your portal...</div> : null}
          {!isLoading && error ? <div className="dashboardError">{error}</div> : null}
          {!isLoading && !error && isTabPending ? <div className="dashboardState">Loading section...</div> : null}

          {!isLoading && !error ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={deferredDashboardTab}
                className="dashboardContent"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {deferredDashboardTab === 'profile' ? (
                  <>
                    <motion.header
                      className="dashboardHero"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="dashboardHero__lighting" aria-hidden="true" />
                      <div className="dashboardHero__imageMask" aria-hidden="true" />
                      <div className="dashboardHero__copy dashboardHero__copy--minimal">
                        <p className="dashboardHero__eyebrow">Client Portal</p>
                        <h1 className="dashboardHero__title">
                          {client?.name ? `Welcome back, ${client.name}` : 'Welcome back'}
                        </h1>
                        <p className="dashboardHero__subtitle">
                          Your private Arelia workspace for refined project oversight, milestones,
                          and concierge-level project communication.
                        </p>
                      </div>
                    </motion.header>

                    <motion.section
                      className="dashboardSection dashboardSection--profile"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: staggerTransition }}
                    >
                      <div className="dashboardSection__heading dashboardSection__heading--profile">
                        <div>
                          <p className="dashboardSection__eyebrow">Verified Details</p>
                          <h2 className="dashboardSection__title dashboardSection__title--profile">
                            Your private workspace
                          </h2>
                        </div>
                      </div>

                      <div className="dashboardOverviewStack">
                        {client ? (
                          <motion.div className="dashboardProfileCard" variants={fadeUpItem}>
                            <div className="dashboardSection__subhead dashboardSection__subhead--split">
                              <div>
                                <div className="dashboardSection__ruleHeading">
                                  <span />
                                  <p>Verified Details</p>
                                </div>
                                <h3>Client Profile</h3>
                                <p className="dashboardProfileCard__intro">
                                  Your verified contact details and workspace identity.
                                </p>
                              </div>
                            </div>
                            <div className="dashboardProfileGrid">
                              <ProfileDetail icon={<FiUser />} label="Name" value={client.name} />
                              <ProfileDetail icon={<FiMail />} label="Email" value={client.email} />
                              <ProfileDetail icon={<FiPhone />} label="Phone" value={client.phone} />
                              <ProfileDetail icon={<FiBriefcase />} label="Company" value={client.company} />
                            </div>
                          </motion.div>
                        ) : null}

                        <motion.button
                          type="button"
                          className="dashboardProjectsPanel dashboardProjectsPanel--nav"
                          variants={fadeUpItem}
                          whileHover={{ y: -2, transition: { duration: 0.2 } }}
                          onClick={() => handleTabChange('status')}
                        >
                          <div className="dashboardProjectsPanel__media" aria-hidden="true">
                            {featuredProjectImage ? (
                              <img src={featuredProjectImage} alt="" />
                            ) : (
                              <div className="dashboardProjectsPanel__placeholder" />
                            )}
                            <div className="dashboardProjectsPanel__scrim" />
                            <span className="dashboardProjectsPanel__badge">Active Phase</span>
                          </div>
                          <div className="dashboardProjectsPanel__copy">
                            <div className="dashboardSection__ruleHeading dashboardSection__ruleHeading--inverse">
                              <p>Project Access</p>
                              <span />
                            </div>
                            <h3>{activeProjectName || 'View Project Status'}</h3>
                            <div className="dashboardProjectsPanel__meta">
                              <span>Completion</span>
                              <strong>{projects.length || resolvedProject?.id ? 'Active project' : 'No project'}</strong>
                            </div>
                            <p className="dashboardProjectsPanel__description">
                              Access live progress, budget checkpoints, milestone updates, and the private project archive.
                            </p>
                          </div>
                          <span className="dashboardProjectsPanel__cta" aria-hidden="true">
                            <FiArrowRight />
                          </span>
                        </motion.button>
                      </div>
                    </motion.section>
                  </>
                ) : null}

                {deferredDashboardTab === 'status' ? (
                  <ProjectStatusTab contactId={contactId} projectId={activeProjectId} />
                ) : null}
                {deferredDashboardTab === 'vendor' ? (
                  <VendorTasksTab contactId={contactId} projectId={activeProjectId} />
                ) : null}
                {deferredDashboardTab === 'payment' ? (
                  <PaymentTermsTab projectName={activeProjectName} />
                ) : null}
                {deferredDashboardTab === 'documents' ? (
                  <DocumentsTab projectId={activeProjectId} />
                ) : null}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </section>

    </main>
  )
}

function formatDate(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
