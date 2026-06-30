import { AnimatePresence, motion } from "framer-motion";
import {
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiDownload,
  FiDroplet,
  FiEdit3,
  FiFileText,
  FiGrid,
  FiHeadphones,
  FiHome,
  FiImage,
  FiLayers,
  FiLogOut,
  FiMail,
  FiMenu,
  FiPhone,
  FiTool,
  FiUserCheck,
  FiX,
  FiZap,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { LogoutModal } from "../components/auth/LogoutModal";
import { dashboardTabs } from "../constants/dashboardTabs";
import { useAuth } from "../context/AuthContext";
import {
  createSupportCase,
  getClientPortalDetails,
  getPaymentTerms,
  getProjectByContact,
  getProjectFiles,
  getProjectStatus,
  getVendorTasks,
  type ClientPortalResponse,
  type ContactProjectLookup,
  type PaymentTerm,
  type ProjectFile,
  type ProjectImage,
  type ProjectStatusRecord,
  type ProjectVendor,
  type ProjectVendorTasksResponse,
} from "../services/salesforceApi";
import "./DashboardPage.css";

const staggerTransition = {
  staggerChildren: 0.08,
  delayChildren: 0.06,
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function GlassEmptyState({ message }: { message: string }) {
  return <div className="dashboardEmptyState">{message}</div>;
}

function getInitials(fullName?: string | null) {
  if (!fullName) return "CL";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "CL";
}

const projectPhases = [
  { id: "design", label: "Design & Planning", threshold: 0 },
  { id: "procurement", label: "Procurement", threshold: 20 },
  { id: "execution", label: "Execution", threshold: 45 },
  { id: "audit", label: "Quality Audit", threshold: 85 },
  { id: "handover", label: "Handover", threshold: 98 },
] as const;

function getActivePhaseIndex(completion: number) {
  let activeIndex = 0;
  projectPhases.forEach((phase, index) => {
    if (completion >= phase.threshold) activeIndex = index;
  });
  return activeIndex;
}

function getOrdinal(position: number) {
  const remainder = position % 100;
  if (remainder >= 11 && remainder <= 13) return `${position}th`;
  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}


function VendorCategoryIcon({ category }: { category?: string }) {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("electric")) return <FiZap />;
  if (normalized.includes("plumb") || normalized.includes("sanitary")) return <FiDroplet />;
  if (normalized.includes("carpentry") || normalized.includes("wood")) return <FiTool />;
  if (normalized.includes("paint")) return <FiEdit3 />;
  if (normalized.includes("floor") || normalized.includes("til")) return <FiGrid />;
  if (normalized.includes("ceiling") || normalized.includes("pop")) return <FiLayers />;
  return <FiBriefcase />;
}

function formatTaskStatusKey(status?: string) {
  return (status || "pending").toLowerCase().replace(/\s+/g, "-");
}

function isImageFileType(fileType?: string) {
  if (!fileType) return false;
  const normalized = fileType.trim().toUpperCase();
  return ["PNG", "JPG", "JPEG", "WEBP", "GIF", "BMP"].includes(normalized);
}

function formatReadableFileMeta(file: ProjectFile) {
  const legacyMeta = formatFileMeta(file);
  const parts: string[] = [];
  if (file.fileType) parts.push(file.fileType);
  if (file.fileSize && file.fileSize > 0) {
    const sizeInMb = file.fileSize / (1024 * 1024);
    parts.push(
      sizeInMb >= 1
        ? `${sizeInMb.toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.fileSize / 1024))} KB`,
    );
  }
  if (!parts.length) return legacyMeta;
  return parts.length > 0 ? parts.join(" • ") : "Secure project file";
}

function formatFileMeta(file: ProjectFile) {
  const parts: string[] = [];
  if (file.fileType) parts.push(file.fileType);
  if (file.fileSize && file.fileSize > 0) {
    const sizeInMb = file.fileSize / (1024 * 1024);
    parts.push(
      sizeInMb >= 1
        ? `${sizeInMb.toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.fileSize / 1024))} KB`,
    );
  }
  return parts.join(" • ") || "Secure project file";
}

type PortalNotificationType = "status" | "vendor" | "payment" | "paymentDue" | "documents";

type PortalNotification = {
  id: string;
  type: PortalNotificationType;
  message: string;
  timestamp: number;
  read: boolean;
};

type NotificationSnapshot = {
  projectStatus?: string;
  completionPercentage?: number;
  vendors: Record<string, number>;
  vendorCategories: Record<string, string>;
  paymentTerms: Record<string, boolean>;
  documentKeys: string[];
};

const NOTIFICATION_POLL_INTERVAL_MS = 3 * 60 * 1000;
const MAX_STORED_NOTIFICATIONS = 30;

function getNotificationStorageKeys(contactId: string) {
  return {
    snapshot: `portalNotifSnapshot:${contactId}`,
    list: `portalNotifications:${contactId}`,
  };
}

function readNotificationSnapshot(key: string): NotificationSnapshot | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as NotificationSnapshot) : null;
  } catch {
    return null;
  }
}

function writeNotificationSnapshot(key: string, snapshot: NotificationSnapshot) {
  window.localStorage.setItem(key, JSON.stringify(snapshot));
}

function readStoredNotifications(key: string): PortalNotification[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PortalNotification[]) : [];
  } catch {
    return [];
  }
}

function writeStoredNotifications(key: string, notifications: PortalNotification[]) {
  window.localStorage.setItem(
    key,
    JSON.stringify(notifications.slice(0, MAX_STORED_NOTIFICATIONS)),
  );
}

function buildNotificationSnapshot(
  project: ProjectStatusRecord | undefined,
  terms: PaymentTerm[],
  files: ProjectFile[],
): NotificationSnapshot {
  const vendors: Record<string, number> = {};
  const vendorCategories: Record<string, string> = {};
  project?.vendors.forEach((vendor) => {
    vendors[vendor.vendorName] = Math.round(vendor.completionPercentage || 0);
    if (vendor.vendorCategory) vendorCategories[vendor.vendorName] = vendor.vendorCategory;
  });

  const paymentTerms: Record<string, boolean> = {};
  terms.forEach((term) => {
    const key = term.label || term.name;
    if (key) paymentTerms[key] = Boolean(term.paymentReceived);
  });

  const documentKeys = files
    .map((file) => file.documentId || file.title)
    .filter(Boolean) as string[];

  return {
    projectStatus: project?.projectStatus,
    completionPercentage:
      project?.completionPercentage != null
        ? Math.round(project.completionPercentage)
        : undefined,
    vendors,
    vendorCategories,
    paymentTerms,
    documentKeys,
  };
}

function diffNotificationSnapshots(
  previous: NotificationSnapshot,
  next: NotificationSnapshot,
): Array<{ type: PortalNotificationType; message: string }> {
  const entries: Array<{ type: PortalNotificationType; message: string }> = [];

  if (
    next.completionPercentage != null &&
    previous.completionPercentage != null &&
    next.completionPercentage !== previous.completionPercentage
  ) {
    entries.push({
      type: "status",
      message: `Project progress updated to ${next.completionPercentage}%.`,
    });
  }

  if (
    next.projectStatus &&
    previous.projectStatus &&
    next.projectStatus !== previous.projectStatus
  ) {
    entries.push({
      type: "status",
      message: `Project status changed to "${next.projectStatus}".`,
    });
  }

  Object.entries(next.vendors).forEach(([vendorName, completion]) => {
    const prevCompletion = previous.vendors[vendorName];
    if (prevCompletion == null || prevCompletion === completion) return;
    const displayLabel = (next.vendorCategories ?? {})[vendorName] || vendorName;
    entries.push({
      type: "vendor",
      message:
        completion >= 100
          ? `${displayLabel} finished all assigned tasks.`
          : `${displayLabel} progress updated to ${completion}%.`,
    });
  });

  Object.entries(next.paymentTerms).forEach(([label, received]) => {
    const prevReceived = previous.paymentTerms[label];
    if (prevReceived === undefined || prevReceived === received || !received) return;
    entries.push({
      type: "payment",
      message: `Payment received for "${label}".`,
    });
  });

  const previousDocs = new Set(previous.documentKeys);
  const newDocCount = next.documentKeys.filter((key) => !previousDocs.has(key)).length;
  if (newDocCount > 0) {
    entries.push({
      type: "documents",
      message:
        newDocCount === 1
          ? "A new file was added to Documents & Reports."
          : `${newDocCount} new files were added to Documents & Reports.`,
    });
  }

  return entries;
}

function formatRelativeTime(timestamp: number) {
  const diffMin = Math.round((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

function NotificationBell({
  notifications,
  isOpen,
  onToggle,
  onClose,
  onNotificationClick,
  onMarkAllRead,
  onClearAll,
  wrapperClassName = "dashboardWorkspace__notifications",
}: {
  notifications: PortalNotification[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNotificationClick: (notification: PortalNotification) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  wrapperClassName?: string;
}) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        className="dashboardWorkspace__notificationsTrigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Notifications"
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="dashboardWorkspace__notificationsBadge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              className="dashboardWorkspace__accountBackdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="dashboardWorkspace__notificationsMenu"
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="dashboardWorkspace__notificationsHeader">
                <strong>Notifications</strong>
                {notifications.length > 0 ? (
                  <div className="dashboardWorkspace__notificationsActions">
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        className="dashboardWorkspace__notificationsMarkAll"
                        onClick={onMarkAllRead}
                      >
                        Mark all read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="dashboardWorkspace__notificationsClear"
                      onClick={onClearAll}
                    >
                      Clear all
                    </button>
                  </div>
                ) : null}
              </div>

              {notifications.length === 0 ? (
                <p className="dashboardWorkspace__notificationsEmpty">
                  You're all caught up.
                </p>
              ) : (
                <ul className="dashboardWorkspace__notificationsList">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        className={`dashboardWorkspace__notificationItem${
                          notification.read ? "" : " is-unread"
                        }`}
                        onClick={() => onNotificationClick(notification)}
                      >
                        <span className="dashboardWorkspace__notificationIcon" aria-hidden="true">
                          <NotificationTypeIcon type={notification.type} />
                        </span>
                        <span className="dashboardWorkspace__notificationCopy">
                          <span>{notification.message}</span>
                          <small>{formatRelativeTime(notification.timestamp)}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NotificationTypeIcon({ type }: { type: PortalNotificationType }) {
  if (type === "vendor") return <FiBriefcase />;
  if (type === "payment") return <FiCreditCard />;
  if (type === "paymentDue") return <FiClock />;
  if (type === "documents") return <FiFileText />;
  return <FiCalendar />;
}

function AccountMenu({
  isOpen,
  onToggle,
  onClose,
  clientName,
  clientEmail,
  onLogoutRequest,
  wrapperClassName = "dashboardWorkspace__account",
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  clientName?: string | null;
  clientEmail?: string | null;
  onLogoutRequest: () => void;
  wrapperClassName?: string;
}) {
  const initials = getInitials(clientName);

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        className="dashboardWorkspace__accountTrigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Account menu"
      >
        {initials}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              className="dashboardWorkspace__accountBackdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="dashboardWorkspace__accountMenu"
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="dashboardWorkspace__accountInfo">
                <span className="dashboardWorkspace__accountAvatar" aria-hidden="true">
                  {initials}
                </span>
                <div className="dashboardWorkspace__accountCopy">
                  <strong>{clientName || "Client"}</strong>
                  <span>{clientEmail || "Not available"}</span>
                </div>
              </div>
              <button
                type="button"
                className="dashboardWorkspace__accountLogout"
                role="menuitem"
                onClick={onLogoutRequest}
              >
                <FiLogOut aria-hidden="true" />
                <span>Logout</span>
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <motion.article
      className="dashboardInfoCard"
      variants={fadeUpItem}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div className="dashboardInfoCard__icon">{icon}</div>
      <div className="dashboardInfoCard__copy">
        <span className="dashboardInfoCard__label">{label}</span>
        <strong className="dashboardInfoCard__value">
          {value || "Not available"}
        </strong>
      </div>
    </motion.article>
  );
}

type QuickLinkTarget = "profile" | "status" | "vendor" | "payment" | "documents";

const quickLinkDirectory: Array<{
  target: QuickLinkTarget;
  icon: typeof FiCalendar;
  label: string;
  description: string;
}> = [
  {
    target: "profile",
    icon: FiUserCheck,
    label: "Profile & Overview",
    description: "Back to your account snapshot",
  },
  {
    target: "status",
    icon: FiCalendar,
    label: "Project Status",
    description: "Review phase progress and key milestones",
  },
  {
    target: "vendor",
    icon: FiBriefcase,
    label: "Vendor Tasks",
    description: "Track artisan and contractor progress",
  },
  {
    target: "payment",
    icon: FiCreditCard,
    label: "Payment Terms",
    description: "Review your milestone payment schedule",
  },
  {
    target: "documents",
    icon: FiFileText,
    label: "Documents & Reports",
    description: "Browse renders, floor plans, and files",
  },
];

function QuickLinks({
  exclude,
  onNavigate,
}: {
  exclude: QuickLinkTarget;
  onNavigate: (tab: QuickLinkTarget) => void;
}) {
  const gridLinks = quickLinkDirectory.filter(
    (link) => link.target !== exclude && link.target !== "profile",
  );
  const showProfileLink = exclude !== "profile";

  return (
    <div className="dashboardQuickLinksWrap">
      <div className="dashboardQuickLinks">
        {gridLinks.map(({ target, icon: Icon, label, description }) => (
          <motion.button
            key={target}
            type="button"
            className="dashboardQuickLinks__item"
            variants={fadeUpItem}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            onClick={() => onNavigate(target)}
          >
            <span className="dashboardQuickLinks__icon" aria-hidden="true">
              <Icon />
            </span>
            <div className="dashboardQuickLinks__copy">
              <strong>{label}</strong>
              <p>{description}</p>
            </div>
            <FiArrowRight aria-hidden="true" />
          </motion.button>
        ))}
      </div>

      {showProfileLink ? (
        <motion.button
          type="button"
          className="dashboardQuickLinks__profileCta"
          variants={fadeUpItem}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          onClick={() => onNavigate("profile")}
        >
          <span>View Profile &amp; Overview</span>
          <FiArrowRight aria-hidden="true" />
        </motion.button>
      ) : null}
    </div>
  );
}

function ProjectStatusTab({
  contactId,
  projectId,
  projects,
  onNavigate,
}: {
  contactId: string;
  projectId?: string;
  projects: ProjectStatusRecord[];
  onNavigate: (tab: QuickLinkTarget) => void;
}) {
  const [statusData, setStatusData] = useState<ProjectStatusRecord | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      setIsLoading(true);

      // The contact's full project list is already fetched once at the
      // dashboard level — match the selected project from it directly
      // rather than re-querying mobileProjectStatus, which doesn't
      // reliably filter by projectId and would otherwise always return
      // the same (first) project regardless of selection.
      const matched = projects.find(
        (project) => (project.id || project.projectName) === projectId,
      );
      if (matched) {
        setStatusData(matched);
        setIsLoading(false);
        return;
      }

      const res = await getProjectStatus(contactId, projectId);
      if (res?.success && res.projects.length > 0) {
        setStatusData(res.projects[0]);
      }
      setIsLoading(false);
    }
    void loadStatus();
  }, [contactId, projectId, projects]);

  if (isLoading)
    return <p className="dashboard-loading">Loading project status...</p>;
  if (!statusData)
    return <GlassEmptyState message="No active project status found." />;

  const completion = Math.round(statusData.completionPercentage || 0);
  const activePhaseIndex = getActivePhaseIndex(completion);
  const totalProjectDays = getTotalProjectDays(
    statusData.startDate,
    statusData.endDate,
  );
  const remainingDaysLabel = getRemainingDaysLabel(
    statusData.endDate,
    completion >= 100,
  );

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
        <span className="dashboardSection__chip">
          {statusData.projectStatus || "Active"}
        </span>
      </div>

      <div className="dashboardPhaseTimeline">
        {projectPhases.map((phase, index) => {
          const state =
            index < activePhaseIndex
              ? "done"
              : index === activePhaseIndex
                ? "active"
                : "upcoming";
          return (
            <div
              key={phase.id}
              className={`dashboardPhaseTimeline__step is-${state}`}
            >
              <span
                className="dashboardPhaseTimeline__dot"
                aria-hidden="true"
              />
              <span className="dashboardPhaseTimeline__label">
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="dashboardStatusLayout dashboardStatusLayout--metrics">
        <motion.article
          className="dashboardSpotlightCard"
          variants={fadeUpItem}
        >
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

          {statusData.projectType ? (
            <motion.div
              className="dashboardSpotlightCard__projectType"
              initial={{ opacity: 0, scale: 0.85, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <FiHome aria-hidden="true" />
              <span>{statusData.projectType}</span>
            </motion.div>
          ) : null}

          <div className="dashboardSpotlightCard__meta">
            <span>
              Budget:{" "}
              {statusData.budget
                ? `Rs ${statusData.budget.toLocaleString()}`
                : "Not available"}
            </span>
            <span>Updated in real time</span>
          </div>
        </motion.article>

        <motion.div className="dashboardMetricGrid" variants={fadeUpItem}>
          <InfoCard
            icon={<FiBriefcase />}
            label="Status"
            value={statusData.projectStatus}
          />
          <InfoCard
            icon={<FiCreditCard />}
            label="Estimated Budget"
            value={
              statusData.budget
                ? `Rs ${statusData.budget.toLocaleString()}`
                : null
            }
          />
          <InfoCard
            icon={<FiCalendar />}
            label="Start Date"
            value={formatDate(statusData.startDate)}
          />
          <InfoCard
            icon={<FiCalendar />}
            label="Estimated End Date"
            value={formatDate(statusData.endDate)}
          />
          <InfoCard
            icon={<FiCalendar />}
            label="Total Project Days"
            value={totalProjectDays}
          />
          <InfoCard
            icon={<FiClock />}
            label="Remaining Days Pending"
            value={remainingDaysLabel}
          />
        </motion.div>
      </div>

      <QuickLinks exclude="status" onNavigate={onNavigate} />
    </motion.section>
  );
}

function VendorTaskModal({
  vendor,
  tasksInfo,
  onClose,
}: {
  vendor: ProjectVendor | null;
  tasksInfo: { loading: boolean; data: ProjectVendorTasksResponse | null } | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!vendor) return undefined;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [vendor, onClose]);

  if (typeof document === "undefined") return null;

  const vendorCompletion = vendor ? Math.round(vendor.completionPercentage || 0) : 0;

  return createPortal(
    <AnimatePresence>
      {vendor ? (
        <motion.div
          className="vendorTaskModal__layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="vendorTaskModal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div
            className="vendorTaskModal__viewport"
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
          >
            <motion.div
              className="vendorTaskModal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vendor-task-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.97, y: 10, filter: "blur(6px)" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="vendorTaskModal__glow" aria-hidden="true" />
              <button
                type="button"
                className="vendorTaskModal__close"
                aria-label="Close vendor tasks"
                onClick={onClose}
              >
                <FiX aria-hidden="true" />
              </button>

              <div className="vendorTaskModal__header">
                <span className="dashboardVendorCard__avatar" aria-hidden="true">
                  <VendorCategoryIcon category={vendor.vendorCategory} />
                </span>
                <div className="vendorTaskModal__headerCopy">
                  <span className="dashboardVendorCard__badge">
                    {vendorCompletion >= 100
                      ? "Completed"
                      : vendorCompletion >= 60
                        ? "On Schedule"
                        : vendorCompletion > 0
                          ? "Active Phase"
                          : "Not Started"}
                  </span>
                  <h2 id="vendor-task-modal-title" className="vendorTaskModal__title">
                    {vendor.vendorCategory || "Assigned Work"}
                  </h2>
                </div>
              </div>

              <div className="vendorTaskModal__progress">
                <div className="dashboardVendorCard__progressMeta">
                  <span>Progress</span>
                  <strong>{vendorCompletion}%</strong>
                </div>
                <div className="dashboardProgressBar dashboardProgressBar--thin">
                  <div
                    className="dashboardProgressBar__fill dashboardProgressBar__fill--neon"
                    style={{ width: `${vendorCompletion}%` }}
                  />
                </div>
              </div>

              <div className="vendorTaskModal__body">
                {tasksInfo?.loading ? (
                  <p className="dashboard-loading">Loading tasks...</p>
                ) : tasksInfo?.data?.tasks.length ? (
                  <>
                    {tasksInfo.data.summary ? (
                      <p className="dashboardVendorCard__tasksSummary">
                        {tasksInfo.data.summary.completedTasks} of{" "}
                        {tasksInfo.data.summary.totalTasks} tasks completed
                      </p>
                    ) : null}
                    <ul className="dashboardVendorTaskList">
                      {tasksInfo.data.tasks.map((task, taskIndex) => {
                        const statusKey = formatTaskStatusKey(task.status);
                        return (
                          <li
                            key={`${task.taskName}-${taskIndex}`}
                            className="dashboardVendorTaskList__item"
                          >
                            <div className="dashboardVendorTaskList__row">
                              <span
                                className={`dashboardVendorTaskList__status is-${statusKey}`}
                                aria-hidden="true"
                              />
                              <strong className="dashboardVendorTaskList__name">
                                {task.taskName}
                              </strong>
                            </div>
                            <div className="dashboardVendorTaskList__meta">
                              <span
                                className={`dashboardVendorTaskList__statusLabel is-${statusKey}`}
                              >
                                {task.status || "Not started"}
                              </span>
                              {task.dueDate ? (
                                <span className="dashboardVendorTaskList__date">
                                  Due {formatDate(task.dueDate)}
                                </span>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <p className="dashboardVendorCard__tasksEmpty">
                    No tasks recorded for this vendor yet.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function VendorTasksTab({
  contactId,
  projectId,
  projectName,
  projects,
  onNavigate,
}: {
  contactId: string;
  projectId?: string;
  projectName?: string;
  projects: ProjectStatusRecord[];
  onNavigate: (tab: QuickLinkTarget) => void;
}) {
  const [vendors, setVendors] = useState<ProjectVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVendor, setActiveVendor] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<
    Record<string, { loading: boolean; data: ProjectVendorTasksResponse | null }>
  >({});

  useEffect(() => {
    async function loadVendors() {
      setIsLoading(true);
      setActiveVendor(null);
      setTaskState({});

      const matched = projects.find(
        (project) => (project.id || project.projectName) === projectId,
      );
      if (matched) {
        setVendors(matched.vendors || []);
        setIsLoading(false);
        return;
      }

      const res = await getProjectStatus(contactId, projectId);
      if (res?.success && res.projects.length > 0) {
        setVendors(res.projects[0].vendors || []);
      }
      setIsLoading(false);
    }
    void loadVendors();
  }, [contactId, projectId, projects]);

  const openVendorTasks = (vendorName: string) => {
    setActiveVendor(vendorName);

    if (!taskState[vendorName] && projectId) {
      setTaskState((prev) => ({ ...prev, [vendorName]: { loading: true, data: null } }));
      void getVendorTasks(projectId, vendorName).then((res) => {
        setTaskState((prev) => ({ ...prev, [vendorName]: { loading: false, data: res } }));
      });
    }
  };

  const closeVendorTasks = () => setActiveVendor(null);

  if (isLoading)
    return <p className="dashboard-loading">Loading vendor tracking...</p>;
  if (vendors.length === 0) {
    return (
      <GlassEmptyState message="No vendors are currently assigned to this project." />
    );
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
          <p className="dashboardSection__eyebrow">On-Site Progress</p>
          <h2 className="dashboardSection__title">
            Vendor tasks and on-site progress
          </h2>
          <p className="dashboardSection__lead">
            Real-time progress tracking for every artisan and contractor
            working on your project.
          </p>
        </div>
        {projectName ? (
          <span className="dashboardSection__chip">{projectName}</span>
        ) : null}
      </div>

      <div className="dashboardVendorGrid">
        {vendors.map((vendor, index) => {
          const vendorCompletion = Math.round(vendor.completionPercentage || 0);

          return (
            <motion.article
              key={`${vendor.vendorName}-${index}`}
              className="dashboardVendorCard"
              variants={fadeUpItem}
            >
              <button
                type="button"
                className="dashboardVendorCard__trigger"
                onClick={() => openVendorTasks(vendor.vendorName)}
                aria-haspopup="dialog"
              >
                <div className="dashboardVendorCard__content">
                  <div className="dashboardVendorCard__top">
                    <span className="dashboardVendorCard__avatar" aria-hidden="true">
                      <VendorCategoryIcon category={vendor.vendorCategory} />
                    </span>
                    <span className="dashboardVendorCard__badge">
                      {vendorCompletion >= 100
                        ? "Completed"
                        : vendorCompletion >= 60
                          ? "On Schedule"
                          : vendorCompletion > 0
                            ? "Active Phase"
                            : "Not Started"}
                    </span>
                  </div>

                  <h3 className="dashboardVendorCard__title">
                    {vendor.vendorCategory || "Assigned Work"}
                  </h3>

                  <div className="dashboardVendorCard__progress">
                    <div className="dashboardVendorCard__progressMeta">
                      <span>Progress</span>
                      <strong>{vendorCompletion}%</strong>
                    </div>
                    <div className="dashboardProgressBar dashboardProgressBar--thin">
                      <motion.div
                        className="dashboardProgressBar__fill dashboardProgressBar__fill--neon"
                        initial={{ width: 0 }}
                        animate={{ width: `${vendorCompletion}%` }}
                        transition={{
                          duration: 0.9,
                          delay: index * 0.08,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                    <div className="dashboardVendorCard__footer">
                      <span>Completion status</span>
                      <strong>
                        {vendorCompletion >= 100 ? "Completed" : "In progress"}
                      </strong>
                    </div>
                  </div>

                  <span className="dashboardVendorCard__toggleHint">
                    <span>View tasks</span>
                    <FiArrowRight aria-hidden="true" />
                  </span>
                </div>
              </button>
            </motion.article>
          );
        })}
      </div>

      <VendorTaskModal
        vendor={vendors.find((vendor) => vendor.vendorName === activeVendor) || null}
        tasksInfo={activeVendor ? taskState[activeVendor] : undefined}
        onClose={closeVendorTasks}
      />

      <QuickLinks exclude="vendor" onNavigate={onNavigate} />
    </motion.section>
  );
}

function PaymentTermsTab({
  projectName,
  fallbackProjectName,
  contractBudget,
  onNavigate,
}: {
  projectName?: string;
  fallbackProjectName?: string;
  contractBudget?: number;
  onNavigate: (tab: QuickLinkTarget) => void;
}) {
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTerms() {
      if (!projectName) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const res = await getPaymentTerms(projectName);
      if (Array.isArray(res) && res.length > 0) {
        setTerms(res);
        setIsLoading(false);
        return;
      }

      // Salesforce's dashboard summary and project status endpoints can
      // format the same project's name slightly differently. Retry with
      // that alternate name before concluding there's really no schedule.
      if (fallbackProjectName && fallbackProjectName !== projectName) {
        const fallbackRes = await getPaymentTerms(fallbackProjectName);
        if (Array.isArray(fallbackRes) && fallbackRes.length > 0) {
          setTerms(fallbackRes);
          setIsLoading(false);
          return;
        }
      }

      setTerms(Array.isArray(res) ? res : []);
      setIsLoading(false);
    }
    void loadTerms();
  }, [projectName, fallbackProjectName]);

  if (isLoading)
    return <p className="dashboard-loading">Loading payment terms...</p>;
  if (!projectName) {
    return (
      <GlassEmptyState message="Select a project to view its payment terms." />
    );
  }
  if (terms.length === 0) {
    return (
      <GlassEmptyState
        message={`No payment terms have been added for "${projectName}" yet. Check back once your milestone schedule is set up.`}
      />
    );
  }

  const paidPercentage = terms
    .filter((term) => term.paymentReceived)
    .reduce((sum, term) => sum + (term.percentage ?? 0), 0);
  const paidCount = terms.filter((term) => term.paymentReceived).length;

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
          <h2 className="dashboardSection__title">
            Payment schedule and milestone release
          </h2>
          <p className="dashboardSection__lead">
            Your bespoke payment structure with transparent milestone release
            across execution phases.
          </p>
        </div>
        {projectName ? (
          <span className="dashboardSection__chip">{projectName}</span>
        ) : null}
      </div>

      <motion.article className="dashboardSpotlightCard" variants={fadeUpItem}>
        <div className="dashboardSpotlightCard__head">
          <span>Contract Paid to Date</span>
          <strong>{Math.round(paidPercentage)}%</strong>
        </div>

        <div className="dashboardPaymentSummaryBar__labels">
          {terms.map((term, index) => {
            const width = term.percentage ?? 0;
            return (
              <span
                key={`label-${term.label || term.name || index}`}
                className="dashboardPaymentSummaryBar__label"
                style={{ width: `${width}%` }}
              >
                {getOrdinal(index + 1)} · {width}%
              </span>
            );
          })}
        </div>

        <div className="dashboardPaymentSummaryBar">
          {terms.map((term, index) => {
            const width = term.percentage ?? 0;
            return (
              <motion.div
                key={`segment-${term.label || term.name || index}`}
                className={`dashboardPaymentSummaryBar__segment ${term.paymentReceived ? "is-paid" : "is-pending"}`}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{
                  duration: 0.9,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                title={`${getOrdinal(index + 1)} installment — ${width}% ${term.paymentReceived ? "received" : "pending"}`}
              />
            );
          })}
        </div>

        <div className="dashboardSpotlightCard__meta">
          <span>
            {paidCount} of {terms.length} milestones received
          </span>
          <span>{Math.round(100 - paidPercentage)}% remaining</span>
        </div>
      </motion.article>

      <h3 className="dashboardPaymentTimeline__heading">Milestone Details</h3>

      <div className="dashboardPaymentTimeline">
        {terms.map((term, index) => {
          const ordinal = getOrdinal(index + 1);
          const amount =
            contractBudget != null && term.percentage != null
              ? `₹ ${Math.round((contractBudget * term.percentage) / 100).toLocaleString("en-IN")}`
              : "—";

          return (
            <motion.div
              key={`${term.label || term.name || "term"}-${index}`}
              className="dashboardPaymentTimeline__row"
              variants={fadeUpItem}
            >
              <div
                className={`dashboardPaymentTimeline__node ${term.paymentReceived ? "is-paid" : "is-pending"}`}
              >
                <span className="dashboardPaymentTimeline__ordinal">
                  {ordinal}
                </span>
              </div>
              <motion.article
                className={`dashboardPaymentCard ${term.paymentReceived ? "is-paid" : "is-pending"}`}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="dashboardPaymentCard__main">
                  <span
                    className={`dashboardPaymentCard__phase ${term.paymentReceived ? "is-paid" : "is-pending"}`}
                  >
                    {term.paymentReceived ? "Completed" : "Pending"}
                  </span>
                  <h3>{term.label || term.name}</h3>
                  <p className="dashboardPaymentCard__subtitle">
                    {term.percentage ?? 0}% of contract value
                  </p>
                </div>

                <div className="dashboardPaymentCard__columns">
                  <div className="dashboardPaymentCard__col">
                    <span>Due Date</span>
                    <strong>
                      <FiCalendar aria-hidden="true" />
                      {formatDate(term.dueDate) || "Not set"}
                    </strong>
                  </div>
                  <div className="dashboardPaymentCard__col">
                    <span>Amount</span>
                    <strong>{amount}</strong>
                  </div>
                  <div className="dashboardPaymentCard__col">
                    <span>Status</span>
                    <span
                      className={`dashboardPaymentCard__status ${term.paymentReceived ? "is-paid" : "is-pending"}`}
                    >
                      {term.paymentReceived ? "Received" : "Upcoming"}
                    </span>
                  </div>
                </div>
              </motion.article>
            </motion.div>
          );
        })}
      </div>

      <QuickLinks exclude="payment" onNavigate={onNavigate} />
    </motion.section>
  );
}

function DocumentsTab({
  projectId,
  projectName,
  onNavigate,
}: {
  projectId?: string;
  projectName?: string;
  onNavigate: (tab: QuickLinkTarget) => void;
}) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<"photos" | "documents">(
    "photos",
  );
  const [selectedPreview, setSelectedPreview] = useState<{
    title: string;
    subtitle?: string;
    href: string;
    meta?: string;
  } | null>(null);

  useEffect(() => {
    async function loadMedia() {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const filesRes = await getProjectFiles(projectId);

      if (Array.isArray(filesRes)) {
        setFiles(filesRes.filter((file) => !isImageFileType(file.fileType)));
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
        );
      } else {
        setFiles([]);
        setImages([]);
      }

      setIsLoading(false);
    }
    void loadMedia();
  }, [projectId]);

  useEffect(() => {
    if (!selectedPreview) return undefined;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedPreview(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPreview]);

  if (isLoading)
    return <p className="dashboard-loading">Loading project media...</p>;
  if (files.length === 0 && images.length === 0) {
    return (
      <GlassEmptyState message="No files or images have been uploaded to this project yet." />
    );
  }

  const hasPhotos = images.length > 0;
  const hasDocuments = files.length > 0;
  const effectiveTab: "photos" | "documents" =
    hasPhotos && hasDocuments
      ? activeMediaTab
      : hasPhotos
        ? "photos"
        : "documents";

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
            <h2 className="dashboardSection__title">
              Documents, reports, and visual references
            </h2>
            <p className="dashboardSection__lead">
              Secure access to current-phase renders, floor plans, material
              studies, and client documentation.
            </p>
          </div>
          {projectName ? (
            <span className="dashboardSection__chip">{projectName}</span>
          ) : null}
        </div>

        {hasPhotos && hasDocuments ? (
          <div className="dashboardMediaToggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === "photos"}
              className={`dashboardMediaToggle__btn${effectiveTab === "photos" ? " is-active" : ""}`}
              onClick={() => setActiveMediaTab("photos")}
            >
              <span>Project Photos</span>
              <span className="dashboardMediaToggle__count">
                {images.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === "documents"}
              className={`dashboardMediaToggle__btn${effectiveTab === "documents" ? " is-active" : ""}`}
              onClick={() => setActiveMediaTab("documents")}
            >
              <span>Project Documents</span>
              <span className="dashboardMediaToggle__count">
                {files.length}
              </span>
            </button>
          </div>
        ) : null}

        {effectiveTab === "photos" ? (
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
                    title: img.title,
                    href: img.imageUrl,
                    subtitle: "Project image",
                    meta: "Private archive image",
                  })
                }
              >
                <div className="dashboardImageCard__preview">
                  <img src={img.imageUrl} alt={img.title} loading="lazy" />
                  <div className="dashboardImageCard__overlay">
                    <span className="dashboardImageCard__tag">
                      Private Archive
                    </span>
                    <strong>{img.title}</strong>
                  </div>
                </div>
                <div className="dashboardImageCard__body">
                  <span className="dashboardImageCard__icon">
                    <FiImage />
                  </span>
                  <p>Click to preview</p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
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
                <a
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={file.title}
                  className="dashboardDocumentCard__download"
                >
                  <FiDownload aria-hidden="true" />
                  <span>Download</span>
                </a>
              </motion.article>
            ))}
          </div>
        )}

        <QuickLinks exclude="documents" onNavigate={onNavigate} />
      </motion.section>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
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
                            Image Preview
                          </p>
                          <h3 id="dashboard-preview-title">
                            {selectedPreview.title}
                          </h3>
                          <p id="dashboard-preview-subtitle">
                            {selectedPreview.subtitle}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="dashboardPreview__close"
                          aria-label="Close preview"
                          onClick={() => setSelectedPreview(null)}
                        >
                          <FiX aria-hidden="true" />
                        </button>
                      </div>

                      <div className="dashboardPreview__stage dashboardPreview__stage--image">
                        <div className="dashboardPreview__metaBar">
                          <span>{selectedPreview.title}</span>
                          <span>
                            {selectedPreview.meta || "Private archive image"}
                          </span>
                        </div>
                        <div className="dashboardPreview__image">
                          <img
                            src={selectedPreview.href}
                            alt={selectedPreview.title}
                          />
                        </div>
                      </div>

                      <div className="dashboardPreview__footer">
                        <div>
                          <strong>{selectedPreview.title}</strong>
                          <p>{selectedPreview.meta}</p>
                        </div>
                        <a
                          href={selectedPreview.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={selectedPreview.title}
                          className="dashboardPreview__cta"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    activeDashboardTab,
    client: authClient,
    logout,
    setActiveDashboardTab,
  } = useAuth();
  const deferredDashboardTab = useDeferredValue(activeDashboardTab);
  const [isTabPending, startTabTransition] = useTransition();
  const [portalData, setPortalData] = useState<ClientPortalResponse | null>(
    null,
  );
  const [resolvedProject, setResolvedProject] =
    useState<ContactProjectLookup | null>(null);
  const [contactProjects, setContactProjects] = useState<
    ProjectStatusRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>(() => {
    const initialContactId =
      authClient?.contactId || localStorage.getItem("contactId") || "";
    return initialContactId
      ? readStoredNotifications(getNotificationStorageKeys(initialContactId).list)
      : [];
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen && !isNotificationPanelOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsNotificationPanelOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProfileMenuOpen, isNotificationPanelOpen]);

  useEffect(() => {
    async function loadDashboard() {
      const contactId =
        authClient?.contactId || localStorage.getItem("contactId");
      const leadId = authClient?.leadId || localStorage.getItem("leadId");
      const email = authClient?.email || null;
      const lookupTargetId = contactId || leadId;

      const [response, projectLookup, statusRes] = await Promise.all([
        getClientPortalDetails({ contactId, leadId, email }),
        lookupTargetId
          ? getProjectByContact(lookupTargetId, email)
          : Promise.resolve(null),
        // Projects list must come from the contact's own record only — a
        // leadId/email lookup can't be trusted to return the full set.
        contactId ? getProjectStatus(contactId) : Promise.resolve(null),
      ]);

      setResolvedProject(projectLookup);
      setContactProjects(statusRes?.success ? statusRes.projects : []);

      if (response.success) {
        setPortalData(response);
        setError("");
      } else {
        console.error("Dashboard load failed:", response.message);
        setError(
          "We couldn't load your dashboard right now. Please refresh the page or contact support if this continues.",
        );
      }
      setIsLoading(false);
    }

    void loadDashboard();
  }, [authClient?.contactId, authClient?.email, authClient?.leadId]);

  const client = portalData?.client;
  const projects =
    contactProjects.length > 0
      ? contactProjects.map((project) => ({
          id: project.id || project.projectName,
          name: project.projectName,
          status: project.projectStatus,
          startDate: project.startDate,
          endDate: project.endDate,
          completionPercentage: project.completionPercentage,
        }))
      : (portalData?.projects || []).map((project) => ({
          ...project,
          completionPercentage: undefined as number | undefined,
        }));
  const activeProject =
    projects.find((project) => project.id === selectedProjectId) ||
    projects[0];
  const activeProjectId = activeProject?.id || resolvedProject?.id;
  const activeProjectName = activeProject?.name || resolvedProject?.name;
  // mobileProjectStatus and the /mobile/dashboard summary can format the
  // same project's name slightly differently in Salesforce. Payment terms
  // are matched by exact name, so keep the dashboard summary's version
  // around as a fallback candidate if the primary name finds nothing.
  const dashboardProjectName = portalData?.projects?.[0]?.name;
  const activeProjectBudget = contactProjects.find(
    (project) => (project.id || project.projectName) === activeProjectId,
  )?.budget;
  const contactId =
    authClient?.contactId || localStorage.getItem("contactId") || "";

  // Polls the same data the individual tabs already fetch on their own, so a
  // status/vendor/payment/document change is surfaced as a notification even
  // if the client never visits that tab during this session.
  useEffect(() => {
    if (!contactId || !activeProjectId) return undefined;

    const keys = getNotificationStorageKeys(contactId);

    async function checkForUpdates() {
      const [statusRes, terms, files] = await Promise.all([
        getProjectStatus(contactId),
        activeProjectName ? getPaymentTerms(activeProjectName) : Promise.resolve(null),
        activeProjectId ? getProjectFiles(activeProjectId) : Promise.resolve(null),
      ]);

      const project = statusRes?.success
        ? statusRes.projects.find(
            (candidate) => (candidate.id || candidate.projectName) === activeProjectId,
          )
        : undefined;

      const termsList = Array.isArray(terms) ? terms : [];
      const filesList = Array.isArray(files) ? files : [];

      const nextSnapshot = buildNotificationSnapshot(project, termsList, filesList);
      const previousSnapshot = readNotificationSnapshot(keys.snapshot);
      writeNotificationSnapshot(keys.snapshot, nextSnapshot);

      // Change-based notifications (only when previous snapshot exists to compare against)
      const diffs = previousSnapshot
        ? diffNotificationSnapshots(previousSnapshot, nextSnapshot)
        : [];

      // Payment due-date notifications: fire once per calendar day per payment term
      const PAYMENT_DUE_DAYS = 30;
      const today = new Date().toISOString().slice(0, 10);
      const paymentDueSeenKey = `portalPaymentDueSeen:${contactId}`;
      let seenData: { date: string; seen: string[] } = { date: "", seen: [] };
      try {
        const raw = window.localStorage.getItem(paymentDueSeenKey);
        if (raw) seenData = JSON.parse(raw) as { date: string; seen: string[] };
      } catch { /* ignore parse errors */ }
      const seenToday = seenData.date === today ? seenData.seen : [];
      const paymentDueEntries: Array<{ type: PortalNotificationType; message: string }> = [];

      termsList.forEach((term) => {
        if (!term.dueDate || term.paymentReceived) return;
        const daysUntilDue = Math.ceil(
          (new Date(term.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        );
        if (daysUntilDue < 0 || daysUntilDue > PAYMENT_DUE_DAYS) return;
        const alertKey = `${term.label || term.name}:${term.dueDate}`;
        if (seenToday.includes(alertKey)) return;
        seenToday.push(alertKey);
        const label = term.label || term.name || "Payment";
        const message =
          daysUntilDue === 0
            ? `"${label}" payment is due today.`
            : daysUntilDue === 1
              ? `"${label}" payment is due tomorrow.`
              : `"${label}" payment is due in ${daysUntilDue} days.`;
        paymentDueEntries.push({ type: "paymentDue", message });
      });

      if (paymentDueEntries.length > 0) {
        window.localStorage.setItem(
          paymentDueSeenKey,
          JSON.stringify({ date: today, seen: seenToday }),
        );
      }

      const allEntries = [...diffs, ...paymentDueEntries];
      if (allEntries.length === 0) return;

      setNotifications((prev) => {
        const newEntries: PortalNotification[] = allEntries.map((entry, index) => ({
          id: `${Date.now()}-${index}`,
          type: entry.type,
          message: entry.message,
          timestamp: Date.now(),
          read: false,
        }));
        const merged = [...newEntries, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
        writeStoredNotifications(keys.list, merged);
        return merged;
      });
    }

    void checkForUpdates();
    const interval = window.setInterval(checkForUpdates, NOTIFICATION_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [contactId, activeProjectId, activeProjectName]);

  const desktopNavItems = [
    { id: "profile", label: "Profile & Overview", icon: FiUserCheck },
    { id: "status", label: "Project Status", icon: FiCalendar },
    { id: "vendor", label: "Vendor Tasks", icon: FiBriefcase },
    { id: "payment", label: "Payment Terms", icon: FiCreditCard },
    { id: "documents", label: "Documents & Reports", icon: FiFileText },
  ] as const;

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/login", { replace: true });
  };

  const handleTabChange = (tabId: (typeof desktopNavItems)[number]["id"]) => {
    startTabTransition(() => {
      setActiveDashboardTab(tabId);
    });
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClick = (notification: PortalNotification) => {
    setNotifications((prev) => {
      const updated = prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      );
      if (contactId) {
        writeStoredNotifications(getNotificationStorageKeys(contactId).list, updated);
      }
      return updated;
    });
    setIsNotificationPanelOpen(false);
    handleTabChange(notification.type === "paymentDue" ? "payment" : notification.type);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      if (contactId) {
        writeStoredNotifications(getNotificationStorageKeys(contactId).list, updated);
      }
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    if (contactId) {
      writeStoredNotifications(getNotificationStorageKeys(contactId).list, []);
    }
  };

  return (
    <main className="dashboardPage">
      <LogoutModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      <SupportCaseModal
        isOpen={isSupportModalOpen}
        contactId={contactId}
        projectId={activeProjectId}
        onClose={() => setIsSupportModalOpen(false)}
      />

      <div className="dashboardPage__ambient" aria-hidden="true">
        <span className="dashboardPage__orb dashboardPage__orb--gold" />
        <span className="dashboardPage__orb dashboardPage__orb--blue" />
        <span className="dashboardPage__grid" />
      </div>

      <section className="dashboardShell">
        <header className="dashboardMobileBar">
          <button
            type="button"
            className="dashboardMobileBar__menuToggle"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>

          <button
            type="button"
            className="dashboardMobileBar__brand"
            onClick={() => handleTabChange("profile")}
          >
            <img
              src="/images/Logos/Arelia.png"
              alt="Arelia logo"
              className="dashboardMobileBar__brandLogo"
            />
            <span className="dashboardMobileBar__brandText">
              <strong>ARELIA</strong>
              <small>Client Portal</small>
            </span>
          </button>

          <div className="dashboardMobileBar__actions">
            <NotificationBell
              wrapperClassName="dashboardMobileBar__notifications"
              notifications={notifications}
              isOpen={isNotificationPanelOpen}
              onToggle={() => setIsNotificationPanelOpen((value) => !value)}
              onClose={() => setIsNotificationPanelOpen(false)}
              onNotificationClick={handleNotificationClick}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onClearAll={handleClearAllNotifications}
            />

            <AccountMenu
              wrapperClassName="dashboardMobileBar__account"
              isOpen={isProfileMenuOpen}
              onToggle={() => setIsProfileMenuOpen((value) => !value)}
              onClose={() => setIsProfileMenuOpen(false)}
              clientName={client?.name}
              clientEmail={client?.email}
              onLogoutRequest={() => {
                setIsProfileMenuOpen(false);
                setShowLogoutConfirm(true);
              }}
            />
          </div>
        </header>

        <AnimatePresence>
          {isMobileMenuOpen ? (
            <>
              <motion.div
                className="dashboardMobileDrawer__backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.nav
                className="dashboardMobileDrawer"
                aria-label="Client portal sections"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {desktopNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeDashboardTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`dashboardMobileDrawer__link${isActive ? " is-active" : ""}`}
                      onClick={() => handleTabChange(item.id)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="dashboardMobileDrawer__link"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSupportModalOpen(true);
                  }}
                >
                  <FiHeadphones />
                  <span>Contact Support</span>
                </button>
                <button
                  type="button"
                  className="dashboardMobileDrawer__link dashboardMobileDrawer__link--logout"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </motion.nav>
            </>
          ) : null}
        </AnimatePresence>

        <aside className="dashboardRail">
          <div className="dashboardRail__brandWrap">
            <button
              type="button"
              className="dashboardRail__brand"
              onClick={() => handleTabChange("profile")}
            >
              <img
                src="/images/Logos/Arelia.png"
                alt="Arelia logo"
                className="dashboardRail__brandLogo"
              />
              <span className="dashboardRail__brandText">
                <strong className="dashboardRail__brandTitle">ARELIA</strong>
                <span className="dashboardRail__brandSubtitle">
                  Client Portal
                </span>
              </span>
            </button>
          </div>

          <nav
            className="dashboardRail__nav"
            aria-label="Client portal sections"
          >
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeDashboardTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dashboardRail__link${isActive ? " is-active" : ""}`}
                  onClick={() => handleTabChange(item.id)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className="dashboardRail__support"
            onClick={() => setIsSupportModalOpen(true)}
          >
            <span className="dashboardRail__supportIcon" aria-hidden="true">
              <FiHeadphones />
            </span>
            <strong>Need help?</strong>
            <p>Our team is here to assist</p>
            <span className="dashboardRail__supportCta">Contact Support</span>
          </button>
        </aside>

        <div className="dashboardWorkspace">
          <header className="dashboardWorkspace__topbar">
            <div className="dashboardWorkspace__topbarCopy">
              <p className="dashboardWorkspace__eyebrow">
                {dashboardTabs.find((tab) => tab.id === deferredDashboardTab)
                  ?.label || "Client Portal"}
              </p>
            </div>

            <div className="dashboardWorkspace__topbarActions">
              <NotificationBell
                notifications={notifications}
                isOpen={isNotificationPanelOpen}
                onToggle={() => setIsNotificationPanelOpen((value) => !value)}
                onClose={() => setIsNotificationPanelOpen(false)}
                onNotificationClick={handleNotificationClick}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onClearAll={handleClearAllNotifications}
              />

              <AccountMenu
                isOpen={isProfileMenuOpen}
                onToggle={() => setIsProfileMenuOpen((value) => !value)}
                onClose={() => setIsProfileMenuOpen(false)}
                clientName={client?.name}
                clientEmail={client?.email}
                onLogoutRequest={() => {
                  setIsProfileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
              />
            </div>
          </header>

          {isLoading ? (
            <div className="dashboardState">Loading your portal...</div>
          ) : null}
          {!isLoading && error ? (
            <div className="dashboardError">{error}</div>
          ) : null}
          {!isLoading && !error && isTabPending ? (
            <div className="dashboardState">Loading section...</div>
          ) : null}

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
                {deferredDashboardTab === "profile" ? (
                  <>
                    <motion.header
                      className="dashboardHero dashboardHero--profile"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div
                        className="dashboardHero__lighting"
                        aria-hidden="true"
                      />
                      <span
                        className="dashboardHero__streak dashboardHero__streak--one"
                        aria-hidden="true"
                      />
                      <span
                        className="dashboardHero__streak dashboardHero__streak--two"
                        aria-hidden="true"
                      />
                      <span
                        className="dashboardHero__streak dashboardHero__streak--three"
                        aria-hidden="true"
                      />

                      <div className="dashboardHero__identity">
                        <span
                          className="dashboardHero__avatar"
                          aria-hidden="true"
                        >
                          {getInitials(client?.name)}
                        </span>
                        <div className="dashboardHero__copy dashboardHero__copy--minimal">
                          <p className="dashboardHero__eyebrow">
                            Client Portal
                          </p>
                          <h1 className="dashboardHero__title">
                            Welcome back
                            {client?.name ? (
                              <>
                                ,
                                <span className="dashboardHero__titleName">
                                  {client.name}
                                </span>
                              </>
                            ) : null}
                          </h1>
                          <p className="dashboardHero__subtitle">
                            Your private Arelia workspace for refined project
                            oversight, milestones, and concierge-level project
                            communication.
                          </p>
                        </div>
                      </div>

                      {client ? (
                        <div className="dashboardHero__contactRow">
                          <div className="dashboardHero__contactItem">
                            <FiMail aria-hidden="true" />
                            <div>
                              <span>Email</span>
                              <strong>{client.email || "Not available"}</strong>
                            </div>
                          </div>
                          <div className="dashboardHero__contactItem">
                            <FiPhone aria-hidden="true" />
                            <div>
                              <span>Phone</span>
                              <strong>{client.phone || "Not available"}</strong>
                            </div>
                          </div>
                          <div className="dashboardHero__contactItem">
                            <FiBriefcase aria-hidden="true" />
                            <div>
                              <span>Company</span>
                              <strong>
                                {client.company || "Not available"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </motion.header>

                    <motion.section
                      className="dashboardSection dashboardSection--profile"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: staggerTransition }}
                    >
                      <div className="dashboardSection__heading dashboardSection__heading--profile">
                        <div>
                          <p className="dashboardSection__eyebrow">
                            Project Snapshot
                          </p>
                          <h2 className="dashboardSection__title dashboardSection__title--profile">
                            {projects.length > 1
                              ? "Your projects"
                              : "Your current project"}
                          </h2>
                        </div>
                        {projects.length > 1 ? (
                          <span className="dashboardSection__chip">
                            {projects.length} active projects
                          </span>
                        ) : null}
                      </div>

                      <div className="dashboardProjectRow">
                        <div className="dashboardProjectList">
                          {projects.length > 0 ? (
                            projects.map((project) => {
                              const isActive = project.id === activeProjectId;
                              const completion =
                                project.completionPercentage != null
                                  ? Math.round(project.completionPercentage)
                                  : null;
                              return (
                                <motion.button
                                  key={project.id}
                                  type="button"
                                  className={`dashboardProjectSpotlight${
                                    isActive ? " is-active" : ""
                                  }`}
                                  variants={fadeUpItem}
                                  whileHover={{
                                    x: 3,
                                    transition: { duration: 0.2 },
                                  }}
                                  onClick={() => {
                                    setSelectedProjectId(project.id);
                                    handleTabChange("status");
                                  }}
                                >
                                  <span
                                    className="dashboardProjectSpotlight__icon"
                                    aria-hidden="true"
                                  >
                                    <FiHome />
                                  </span>
                                  <div className="dashboardProjectSpotlight__copy">
                                    <div className="dashboardSection__ruleHeading dashboardSection__ruleHeading--inverse">
                                      <p>Project Overview</p>
                                      <span />
                                    </div>
                                    <div className="dashboardProjectSpotlight__titleRow">
                                      <h3>{project.name}</h3>
                                      <span className="dashboardProjectSpotlight__badge">
                                        {isActive
                                          ? "Selected"
                                          : project.status || "Active"}
                                      </span>
                                    </div>
                                    <p className="dashboardProjectSpotlight__description">
                                      Access live progress, budget
                                      checkpoints, milestone updates, and the
                                      private project archive.
                                    </p>
                                    {completion != null ? (
                                      <div className="dashboardProjectSpotlight__progress">
                                        <span>Completion</span>
                                        <strong>
                                          {completion >= 100
                                            ? "Completed"
                                            : "Ongoing"}
                                        </strong>
                                        <div className="dashboardProjectSpotlight__progressBarRow">
                                          <div className="dashboardProgressBar">
                                            <motion.div
                                              className="dashboardProgressBar__fill"
                                              initial={{ width: 0 }}
                                              animate={{
                                                width: `${completion}%`,
                                              }}
                                              transition={{
                                                duration: 1,
                                                ease: [0.22, 1, 0.36, 1],
                                              }}
                                            />
                                          </div>
                                          <span className="dashboardProjectSpotlight__percent">
                                            {completion}%
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="dashboardProjectSpotlight__meta">
                                        <span>Completion</span>
                                        <strong>Ongoing</strong>
                                      </div>
                                    )}
                                  </div>
                                </motion.button>
                              );
                            })
                          ) : (
                            <motion.button
                              type="button"
                              className="dashboardProjectSpotlight"
                              variants={fadeUpItem}
                              whileHover={{ x: 3, transition: { duration: 0.2 } }}
                              onClick={() => handleTabChange("status")}
                            >
                              <span
                                className="dashboardProjectSpotlight__icon"
                                aria-hidden="true"
                              >
                                <FiHome />
                              </span>
                              <div className="dashboardProjectSpotlight__copy">
                                <div className="dashboardSection__ruleHeading dashboardSection__ruleHeading--inverse">
                                  <p>Project Access</p>
                                  <span />
                                </div>
                                <div className="dashboardProjectSpotlight__titleRow">
                                  <h3>
                                    {resolvedProject?.name ||
                                      "View Project Status"}
                                  </h3>
                                  <span className="dashboardProjectSpotlight__badge">
                                    Active Phase
                                  </span>
                                </div>
                                <p className="dashboardProjectSpotlight__description">
                                  Access live progress, budget checkpoints,
                                  milestone updates, and the private project
                                  archive.
                                </p>
                                <div className="dashboardProjectSpotlight__meta">
                                  <span>Completion</span>
                                  <strong>
                                    {resolvedProject?.id
                                      ? "Ongoing"
                                      : "No project"}
                                  </strong>
                                </div>
                              </div>
                            </motion.button>
                          )}
                        </div>

                        <motion.div
                          className="dashboardProjectAside"
                          variants={fadeUpItem}
                        >
                          <div className="dashboardProjectAside__card">
                            <div className="dashboardProjectAside__row">
                              <span
                                className="dashboardProjectAside__icon"
                                aria-hidden="true"
                              >
                                <FiHome />
                              </span>
                              <div className="dashboardProjectAside__copy">
                                <strong>Stay informed</strong>
                                <p>Real-time document access in one place.</p>
                                {activeProjectName ? (
                                  <span className="dashboardProjectAside__scope">
                                    For {activeProjectName}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="dashboardProjectAside__link"
                              onClick={() => handleTabChange("documents")}
                            >
                              <span>View all Documents</span>
                              <FiArrowRight aria-hidden="true" />
                            </button>

                            <div
                              className="dashboardProjectAside__divider"
                              aria-hidden="true"
                            />

                            <button
                              type="button"
                              className="dashboardProjectSpotlight__cta"
                              onClick={() => handleTabChange("status")}
                            >
                              <span>View Project Status</span>
                              <FiArrowRight aria-hidden="true" />
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    </motion.section>
                  </>
                ) : null}

                {deferredDashboardTab === "status" ? (
                  <ProjectStatusTab
                    contactId={contactId}
                    projectId={activeProjectId}
                    projects={contactProjects}
                    onNavigate={handleTabChange}
                  />
                ) : null}
                {deferredDashboardTab === "vendor" ? (
                  <VendorTasksTab
                    contactId={contactId}
                    projectId={activeProjectId}
                    projectName={activeProjectName}
                    projects={contactProjects}
                    onNavigate={handleTabChange}
                  />
                ) : null}
                {deferredDashboardTab === "payment" ? (
                  <PaymentTermsTab
                    projectName={activeProjectName}
                    fallbackProjectName={dashboardProjectName}
                    contractBudget={activeProjectBudget}
                    onNavigate={handleTabChange}
                  />
                ) : null}
                {deferredDashboardTab === "documents" ? (
                  <DocumentsTab
                    projectId={activeProjectId}
                    projectName={activeProjectName}
                    onNavigate={handleTabChange}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dashboardSupportForm__field dashboardSupportForm__select">
      <span>{label}</span>
      <button
        type="button"
        className="dashboardSupportForm__selectTrigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>{value}</span>
        <FiChevronDown
          aria-hidden="true"
          className={isOpen ? "is-open" : ""}
        />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              className="dashboardSupportForm__selectBackdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="dashboardSupportForm__selectMenu"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`dashboardSupportForm__selectOption${option === value ? " is-active" : ""}`}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SupportCaseModal({
  isOpen,
  contactId,
  projectId,
  onClose,
}: {
  isOpen: boolean;
  contactId: string;
  projectId?: string;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("General");
  const [otherCategory, setOtherCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const resetAndClose = () => {
    setSubject("");
    setDescription("");
    setPriority("Medium");
    setCategory("General");
    setOtherCategory("");
    setError("");
    setCaseId(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subject.trim() || !description.trim()) {
      setError("Please fill in both subject and description.");
      return;
    }
    if (category === "Other" && !otherCategory.trim()) {
      setError("Please describe the category.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const res = await createSupportCase({
      contactId,
      projectId,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category,
      otherCategory: category === "Other" ? otherCategory.trim() : undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setCaseId(res.caseId || "submitted");
    } else {
      console.error("Support case submission failed:", res.message);
      setError(
        "We couldn't submit your request right now. Please try again, or email us directly if this continues.",
      );
    }
  };

  return typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          {isOpen ? (
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
                onClick={resetAndClose}
              />
              <motion.div
                className="dashboardPreview__shell"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.985 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="dashboardPreview dashboardSupportModal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="support-modal-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="dashboardPreview__header">
                    <div className="dashboardPreview__headerCopy">
                      <p className="dashboardPreview__eyebrow">
                        Client Support
                      </p>
                      <h3 id="support-modal-title">Contact Support</h3>
                    </div>
                    <button
                      type="button"
                      className="dashboardPreview__close"
                      aria-label="Close"
                      onClick={resetAndClose}
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </div>

                  <div className="dashboardSupportModal__body">
                    {caseId ? (
                      <div className="dashboardSupportModal__success">
                        <span
                          className="dashboardSupportModal__successIcon"
                          aria-hidden="true"
                        >
                          <FiCheckCircle />
                        </span>
                        <h4>Request submitted</h4>
                        <p>
                          Our team will get back to you shortly.
                        </p>
                        {caseId !== "submitted" ? (
                          <div className="dashboardSupportModal__caseCard">
                            <span>Reference Number</span>
                            <strong className="dashboardSupportModal__caseId">
                              {caseId}
                            </strong>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          className="dashboardProjectSpotlight__cta"
                          onClick={resetAndClose}
                        >
                          <span>Done</span>
                        </button>
                      </div>
                    ) : (
                      <form
                        className="dashboardSupportForm"
                        onSubmit={handleSubmit}
                      >
                        <label className="dashboardSupportForm__field">
                          <span>Subject</span>
                          <input
                            type="text"
                            value={subject}
                            onChange={(event) =>
                              setSubject(event.target.value)
                            }
                            placeholder="Briefly describe your issue"
                            required
                          />
                        </label>

                        <div className="dashboardSupportForm__row">
                          <FormSelect
                            label="Category"
                            value={category}
                            options={[
                              "General",
                              "Billing",
                              "Technical",
                              "Project",
                              "Other",
                            ]}
                            onChange={setCategory}
                          />

                          <FormSelect
                            label="Priority"
                            value={priority}
                            options={["Low", "Medium", "High"]}
                            onChange={setPriority}
                          />
                        </div>

                        {category === "Other" ? (
                          <label className="dashboardSupportForm__field">
                            <span>Please specify</span>
                            <input
                              type="text"
                              value={otherCategory}
                              onChange={(event) =>
                                setOtherCategory(event.target.value)
                              }
                              placeholder="What is this about?"
                            />
                          </label>
                        ) : null}

                        <label className="dashboardSupportForm__field">
                          <span>Description</span>
                          <textarea
                            value={description}
                            onChange={(event) =>
                              setDescription(event.target.value)
                            }
                            placeholder="Tell us more about how we can help"
                            rows={4}
                            required
                          />
                        </label>

                        {error ? (
                          <p className="dashboardSupportForm__error">
                            {error}
                          </p>
                        ) : null}

                        <button
                          type="submit"
                          className="dashboardProjectSpotlight__cta"
                          disabled={isSubmitting}
                        >
                          <span>
                            {isSubmitting
                              ? "Submitting..."
                              : "Submit Request"}
                          </span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )
    : null;
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pluralizeDays(count: number) {
  return `${count} day${count === 1 ? "" : "s"}`;
}

function getTotalProjectDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  return pluralizeDays(Math.max(0, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)));
}

function getRemainingDaysLabel(endDate?: string, isCompleted?: boolean) {
  if (isCompleted) return "Completed";
  if (!endDate) return undefined;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffDays = Math.round((end.getTime() - today.getTime()) / MS_PER_DAY);
  if (diffDays < 0) return `Overdue by ${pluralizeDays(Math.abs(diffDays))}`;
  if (diffDays === 0) return "Due today";
  return `${pluralizeDays(diffDays)} left`;
}
