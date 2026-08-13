import { AnimatePresence, motion } from "framer-motion";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useMemo,
  useTransition,
  type ReactNode,
  type SubmitEvent,
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
  FiExternalLink,
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
  getProjectDetails,
  getProjectFiles,
  getProjectStatus,
  getSupportCases,
  getApprovedSiteVisitReport,
  getDesignApprovals,
  getSiteVisitAppointment,
  submitSiteVisitResponse,
  submitDesignApprovalDecision,
  submitProjectDetails,
  getVendorTasks,
  registerLead,
  type ClientPortalResponse,
  type ContactProjectLookup,
  type PaymentTerm,
  type ProjectFile,
  type ProjectDetails,
  type ProjectDetailsPayload,
  type ProjectImage,
  type ProjectStatusRecord,
  type ProjectVendor,
  type ProjectVendorTask,
  type ProjectVendorTasksResponse,
  type SupportCaseRecord,
  type SiteVisitAppointment,
  type SiteVisitReport,
  type DesignApproval,
} from "../services/salesforceApi";
import {
  annotateNotificationWithProject,
  type CustomerNotificationEntry,
} from "../utils/customerNotifications";
import "./DashboardPage.css";

const staggerTransition = {
  staggerChildren: 0.08,
  delayChildren: 0.06,
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

// Centered placeholder shown when a tab has no data to display yet.
function GlassEmptyState({ message }: { message: string }) {
  return <div className="dashboardEmptyState">{message}</div>;
}

const approvalOptions = [
  { id: "design", label: "3D Design Approvals", icon: FiCalendar },
  { id: "invoice", label: "Proforma Invoice Approvals", icon: FiFileText },
  { id: "budget", label: "Budget Review Approvals", icon: FiCreditCard },
] as const;

function ApprovalsTab({ opportunityId, contactId }: { opportunityId?: string; contactId?: string }) {
  const [activeApproval, setActiveApproval] = useState<(typeof approvalOptions)[number]["id"]>("design");
  const [designs, setDesigns] = useState<DesignApproval[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const activeLabel = approvalOptions.find((option) => option.id === activeApproval)?.label;

  useEffect(() => {
    if (!contactId || activeApproval !== "design") return;
    let cancelled = false;
    setIsLoading(true);
    setError("");
    void getDesignApprovals(contactId, opportunityId).then((result) => {
      if (cancelled) return;
      setDesigns(result.designs);
      if (!result.success) setError(result.message || "Unable to load designs.");
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeApproval, contactId, opportunityId]);

  const submitDecision = async (design: DesignApproval, status: "Approved" | "Changes Requested") => {
    if (!contactId) return;
    const remark = comments[design.id]?.trim() || "";
    if (status === "Changes Requested" && !remark) {
      setError("Please describe the changes you would like for this design.");
      return;
    }
    setSavingId(design.id);
    setError("");
    const result = await submitDesignApprovalDecision({ opportunityId: design.opportunityId, contactId, designId: design.id, status, comments: remark });
    if (result.success) {
      setDesigns((current) => current.map((item) => item.id === design.id ? {
        ...item,
        status,
        comments: remark || (status === "Approved" ? "Approved By Client" : ""),
        canApprove: false,
        canRequestChanges: false,
      } : item));
    } else {
      setError(result.message || "Unable to submit your decision.");
    }
    setSavingId(null);
  };

  return (
    <motion.section className="dashboardApprovals" initial="hidden" animate="visible" variants={{ visible: staggerTransition }}>
      <motion.header className="dashboardApprovals__header" variants={fadeUpItem}>
        <p className="dashboardSection__eyebrow">Approvals</p>
        <h1>Review &amp; Approve</h1>
        <p>Select a category to review items awaiting your approval.</p>
      </motion.header>
      <motion.div className="dashboardApprovals__tabs" role="tablist" aria-label="Approval categories" variants={fadeUpItem}>
        {approvalOptions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeApproval === id}
            className={`dashboardApprovals__tab${activeApproval === id ? " is-active" : ""}`}
            onClick={() => setActiveApproval(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </motion.div>
      {activeApproval === "design" ? (
        <motion.div className="dashboardApprovals__content" variants={fadeUpItem}>
          {!contactId ? <GlassEmptyState message="Please sign in with a customer contact account to view design approvals." /> : null}
          {isLoading ? <div className="dashboardState">Loading 3D designs...</div> : null}
          {error ? <div className="dashboardError" role="alert">{error}</div> : null}
          {!isLoading && contactId && designs.length === 0 && !error ? <GlassEmptyState message="No 3D design approvals are pending." /> : null}
          {designs.map((design) => {
            const isPending = design.canApprove || design.canRequestChanges;
            return (
              <article className="designApprovalCard" key={design.id}>
                <div className="designApprovalCard__head">
                  <div><span>{design.projectName || "Your project"}</span><h2>{design.title}</h2></div>
                  <span className={`designApprovalCard__status${isPending ? " is-pending" : ""}`}>{design.status}</span>
                </div>
                <div className="designApprovalCard__gallery">
                  {design.files.map((file) => file.isImage ? (
                    <a key={file.versionId} href={file.downloadUrl} target="_blank" rel="noreferrer">
                      <img src={file.downloadUrl} alt={file.title} loading="lazy" />
                      <span>{file.title}</span>
                    </a>
                  ) : (
                    <a className="designApprovalCard__file" key={file.versionId} href={file.downloadUrl} target="_blank" rel="noreferrer"><FiFileText /> {file.title}</a>
                  ))}
                  {design.files.length === 0 ? <div className="designApprovalCard__noFile">No design files attached.</div> : null}
                </div>
                {isPending ? (
                  <div className="designApprovalCard__decision">
                    <label htmlFor={`design-comments-${design.id}`}>Comments or requested changes</label>
                    <textarea id={`design-comments-${design.id}`} value={comments[design.id] || ""} onChange={(event) => setComments((current) => ({ ...current, [design.id]: event.target.value }))} placeholder="Describe any changes needed..." />
                    <div className="designApprovalCard__actions">
                      <button type="button" className="is-secondary" disabled={savingId === design.id || !design.canRequestChanges} onClick={() => void submitDecision(design, "Changes Requested")}>Request Changes</button>
                      <button type="button" className="is-primary" disabled={savingId === design.id || !design.canApprove} onClick={() => void submitDecision(design, "Approved")}><FiCheckCircle /> {savingId === design.id ? "Submitting..." : "Approve Design"}</button>
                    </div>
                  </div>
                ) : design.comments ? <p className="designApprovalCard__submittedComment">Your comments: {design.comments}</p> : null}
              </article>
            );
          })}
        </motion.div>
      ) : <motion.div variants={fadeUpItem}><GlassEmptyState message={`No ${activeLabel?.toLowerCase()} are pending.`} /></motion.div>}
    </motion.section>
  );
}

// Derives up to two uppercase initials from a client's full name for avatar badges.
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

// Maps a completion percentage to the current step in the project phase timeline.
function getActivePhaseIndex(completion: number) {
  let activeIndex = 0;
  projectPhases.forEach((phase, index) => {
    if (completion >= phase.threshold) activeIndex = index;
  });
  return activeIndex;
}

// Formats a 1-based position as an ordinal string (1st, 2nd, 3rd, 4th, ...).
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

// Picks an icon representing a vendor's trade from its free-text category label.
function VendorCategoryIcon({ category }: { category?: string }) {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("electric")) return <FiZap />;
  if (normalized.includes("plumb") || normalized.includes("sanitary"))
    return <FiDroplet />;
  if (normalized.includes("carpentry") || normalized.includes("wood"))
    return <FiTool />;
  if (normalized.includes("paint")) return <FiEdit3 />;
  if (normalized.includes("floor") || normalized.includes("til"))
    return <FiGrid />;
  if (normalized.includes("ceiling") || normalized.includes("pop"))
    return <FiLayers />;
  return <FiBriefcase />;
}

// Normalizes a vendor task status into a CSS-safe modifier key (e.g. "In Progress" -> "in-progress").
function formatTaskStatusKey(status?: string) {
  return (status || "pending").toLowerCase().replace(/\s+/g, "-");
}

function getVendorProgressStatus(completion: number) {
  if (completion >= 100) return "Completed";
  if (completion > 0) return "In progress";
  return "Not started";
}

// Determines whether a file's type should render in the image gallery vs the document list.
function isImageFileType(fileType?: string) {
  if (!fileType) return false;
  const normalized = fileType.trim().toUpperCase();
  return ["PNG", "JPG", "JPEG", "WEBP", "GIF", "BMP"].includes(normalized);
}

function isVideoFileType(fileType?: string) {
  if (!fileType) return false;
  const normalized = fileType.trim().toUpperCase();
  return ["MP4", "MOV", "AVI", "WEBM", "M4V"].includes(normalized);
}

// Builds the "type • size" caption shown under a document card, falling back to formatFileMeta.
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

// Original "type • size" caption formatter, kept as formatReadableFileMeta's fallback.
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

type PortalNotificationType =
  | "design"
  | "siteVisit"
  | "status"
  | "vendor"
  | "payment"
  | "paymentDue"
  | "documents"
  | "cases";

type PortalNotification = {
  id: string;
  type: PortalNotificationType;
  message: string;
  timestamp: number;
  read: boolean;
  documentUrl?: string;
  caseId?: string;
  projectId?: string;
  projectName?: string;
  leadId?: string;
};

type NotificationDocument = {
  key: string;
  title: string;
  downloadUrl: string;
};

type NotificationCase = {
  subject: string;
  status?: string;
};

type NotificationSnapshot = {
  projectStatus?: string;
  completionPercentage?: number;
  vendors: Record<string, number>;
  vendorCategories: Record<string, string>;
  vendorStatuses: Record<string, string>;
  vendorTasks: Record<string, { vendorName: string; taskName: string; status?: string }>;
  paymentTerms: Record<string, boolean>;
  documents: NotificationDocument[];
  cases: Record<string, NotificationCase>;
};

type NotificationVisibilityFilter = "unread" | "all";

const NOTIFICATION_POLL_INTERVAL_MS = 60 * 1000;
const MAX_STORED_NOTIFICATIONS = 30;
const NOTIFICATIONS_PER_PAGE = 10;
const SUPPORT_CASE_PROJECT_MAP_STORAGE_PREFIX = "supportCaseProjectMap";
const EMPTY_SITE_VISIT_NOTIFICATION_PATTERN =
  /^(?:Project \d+: )?A site visit appointment is waiting for your approval or reschedule request\.$/;

// Builds the per-contact-per-project localStorage keys used to persist the
// last-seen snapshot (for diffing) and the notification list itself. Scoping
// by project keeps a multi-project contact's notifications from bleeding
// between projects when they switch.
function getNotificationStorageKeys(contactId: string, projectId: string) {
  return {
    snapshot: `portalNotifSnapshot:${contactId}:${projectId}`,
    list: `portalNotifications:${contactId}:${projectId}`,
  };
}

function getCustomerNotificationStorageKeys(contactId: string) {
  return {
    list: `portalNotifications:${contactId}:all`,
  };
}

const SELECTED_PROJECT_STORAGE_PREFIX = "dashboardSelectedProjectId";

// Reads the last project a contact had selected, so a reload doesn't silently
// snap the dashboard back to their first project.
function readStoredSelectedProjectId(contactId: string): string | null {
  try {
    return window.localStorage.getItem(
      `${SELECTED_PROJECT_STORAGE_PREFIX}:${contactId}`,
    );
  } catch {
    return null;
  }
}

function writeStoredSelectedProjectId(
  contactId: string,
  projectId: string | null,
) {
  try {
    const key = `${SELECTED_PROJECT_STORAGE_PREFIX}:${contactId}`;
    if (projectId) window.localStorage.setItem(key, projectId);
    else window.localStorage.removeItem(key);
  } catch {
    /* ignore storage errors (private browsing, quota, etc.) */
  }
}

// Reads the last-seen notification snapshot for a contact, if any.
function readNotificationSnapshot(key: string): NotificationSnapshot | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as NotificationSnapshot) : null;
  } catch {
    return null;
  }
}

// Persists the latest notification snapshot so the next poll can diff against it.
function writeNotificationSnapshot(
  key: string,
  snapshot: NotificationSnapshot,
) {
  window.localStorage.setItem(key, JSON.stringify(snapshot));
}

// Reads a contact's stored notification list from localStorage.
function readStoredNotifications(key: string): PortalNotification[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PortalNotification[]) : [];
  } catch {
    return [];
  }
}

// Persists a contact's notification list, capped to MAX_STORED_NOTIFICATIONS.
function writeStoredNotifications(
  key: string,
  notifications: PortalNotification[],
) {
  window.localStorage.setItem(
    key,
    JSON.stringify(notifications.slice(0, MAX_STORED_NOTIFICATIONS)),
  );
}

// Flattens the current project/vendor/payment/document/case state into a
// comparable snapshot; diffNotificationSnapshots compares two of these to
// decide which notifications to raise on the next poll.
function buildNotificationSnapshot(
  project: ProjectStatusRecord | undefined,
  vendorTasksByVendor: Record<string, ProjectVendorTask[]>,
  terms: PaymentTerm[],
  files: ProjectFile[],
  supportCases: SupportCaseRecord[],
): NotificationSnapshot {
  const vendors: Record<string, number> = {};
  const vendorCategories: Record<string, string> = {};
  const vendorStatuses: Record<string, string> = {};
  project?.vendors.forEach((vendor) => {
    vendors[vendor.vendorName] = Math.round(vendor.completionPercentage || 0);
    if (vendor.vendorCategory)
      vendorCategories[vendor.vendorName] = vendor.vendorCategory;
    if (vendor.status) vendorStatuses[vendor.vendorName] = vendor.status;
  });

  const vendorTasks: Record<
    string,
    { vendorName: string; taskName: string; status?: string }
  > = {};
  Object.entries(vendorTasksByVendor).forEach(([vendorName, tasks]) => {
    tasks.forEach((task) => {
      const taskKey = `${vendorName}::${task.taskName}`;
      vendorTasks[taskKey] = {
        vendorName,
        taskName: task.taskName,
        status: task.status,
      };
    });
  });

  const paymentTerms: Record<string, boolean> = {};
  terms.forEach((term) => {
    const key = term.label || term.name;
    if (key) paymentTerms[key] = Boolean(term.paymentReceived);
  });

  const documents: NotificationDocument[] = files
    .map((file) => {
      const key = file.documentId || file.title;
      if (!key) return undefined;
      return { key, title: file.title, downloadUrl: file.downloadUrl };
    })
    .filter(Boolean) as NotificationDocument[];

  const cases: Record<string, NotificationCase> = {};
  // Only include support cases that are relevant to this project. If the
  // case is tied to a specific project (projectId or projectName), ensure it
  // matches the provided project; otherwise exclude it to avoid the same case
  // appearing for every project owned by the same contact.
  const relevantCases = supportCases.filter((item) => {
    if (!item) return false;
    if (!project) return false;
    if (item.projectId && project.id) return item.projectId === project.id;
    if (item.projectName) return item.projectName === project.projectName;
    return false;
  });
  relevantCases.forEach((item) => {
    cases[item.caseId] = { subject: item.subject, status: item.status };
  });

  return {
    projectStatus: project?.projectStatus,
    completionPercentage:
      project?.completionPercentage != null
        ? Math.round(project.completionPercentage)
        : undefined,
    vendors,
    vendorCategories,
    vendorStatuses,
    vendorTasks,
    paymentTerms,
    documents,
    cases,
  };
}

// Unions two document lists by key, keeping every previously-seen document
// even if this poll's fetch didn't return it, so it can never look "new" again.
function mergeNotificationDocuments(
  previous: NotificationDocument[],
  fresh: NotificationDocument[],
): NotificationDocument[] {
  const byKey = new Map(previous.map((doc) => [doc.key, doc]));
  fresh.forEach((doc) => byKey.set(doc.key, doc));
  return Array.from(byKey.values());
}

type NotificationEntry = CustomerNotificationEntry & {
  projectId?: string;
  projectName?: string;
};

// Compares two notification snapshots and produces one notification entry
// per meaningful change: progress/status updates, vendor progress, payments
// received, new documents, and new/updated support cases.
function diffNotificationSnapshots(
  previous: NotificationSnapshot,
  next: NotificationSnapshot,
  projectName?: string,
): NotificationEntry[] {
  const entries: NotificationEntry[] = [];

  if (
    next.completionPercentage != null &&
    previous.completionPercentage != null &&
    next.completionPercentage !== previous.completionPercentage
  ) {
    entries.push({
      type: "status",
      message: `Project progress updated from ${previous.completionPercentage}% to ${next.completionPercentage}%.`,
    });
  }

  if (
    next.projectStatus &&
    previous.projectStatus &&
    next.projectStatus !== previous.projectStatus
  ) {
    entries.push({
      type: "status",
      message: `Project status changed from "${previous.projectStatus}" to "${next.projectStatus}".`,
    });
  }

  Object.entries(next.vendors).forEach(([vendorName, completion]) => {
    const prevCompletion = previous.vendors[vendorName];
    if (prevCompletion == null || prevCompletion === completion) return;
    const displayLabel =
      (next.vendorCategories ?? {})[vendorName] || vendorName;
    const previousStatus = getVendorProgressStatus(prevCompletion);
    const nextStatus = getVendorProgressStatus(completion);
    entries.push({
      type: "vendor",
      message:
        completion >= 100
          ? `${displayLabel} finished all assigned tasks. Status: ${nextStatus}.`
          : previousStatus !== nextStatus
            ? `${displayLabel} status changed from ${previousStatus} to ${nextStatus} (${prevCompletion}% to ${completion}%).`
            : `${displayLabel} progress updated from ${prevCompletion}% to ${completion}%. Status: ${nextStatus}.`,
    });
  });

  Object.entries(next.vendorStatuses).forEach(([vendorName, status]) => {
    const previousStatus = previous.vendorStatuses[vendorName];
    if (!status || previousStatus == null || previousStatus === status) return;
    const displayLabel =
      (next.vendorCategories ?? {})[vendorName] || vendorName;
    entries.push({
      type: "vendor",
      message: `${displayLabel} assignment status changed from "${previousStatus}" to "${status}".`,
    });
  });

  Object.entries(next.vendorTasks).forEach(([taskKey, taskInfo]) => {
    const previousTask = previous.vendorTasks[taskKey];
    if (!previousTask) return;
    if (!taskInfo.status || previousTask.status === taskInfo.status) return;
    const displayLabel =
      (next.vendorCategories ?? {})[taskInfo.vendorName] || taskInfo.vendorName;
    entries.push({
      type: "vendor",
      message: `${displayLabel} task "${taskInfo.taskName}" changed from "${previousTask.status || "Unknown"}" to "${taskInfo.status}".`,
    });
  });

  Object.entries(next.paymentTerms).forEach(([label, received]) => {
    const prevReceived = previous.paymentTerms[label];
    if (prevReceived === undefined || prevReceived === received || !received)
      return;
    entries.push({
      type: "payment",
      message: `Payment received for "${label}".`,
    });
  });

  const previousDocKeys = new Set(previous.documents.map((doc) => doc.key));
  const newDocs = next.documents.filter((doc) => !previousDocKeys.has(doc.key));
  if (newDocs.length === 1) {
    entries.push({
      type: "documents",
      message: `"${newDocs[0].title}" was added to Documents & Reports.`,
      documentUrl: newDocs[0].downloadUrl,
    });
  } else if (newDocs.length > 1) {
    entries.push({
      type: "documents",
      message: `${newDocs.length} new files were added to Documents & Reports: ${newDocs
        .map((doc) => doc.title)
        .join(", ")}.`,
    });
  }

  Object.entries(next.cases).forEach(([caseId, caseInfo]) => {
    const prevCase = previous.cases[caseId];
    if (!prevCase) {
      entries.push({
        type: "cases",
        message: caseInfo.status
          ? `New case "${caseInfo.subject}" was created (Status: ${caseInfo.status}).`
          : `New case "${caseInfo.subject}" was created.`,
        caseId,
      });
      return;
    }
    if (caseInfo.status && prevCase.status !== caseInfo.status) {
      entries.push({
        type: "cases",
        message: `Case "${caseInfo.subject}" status changed from "${prevCase.status || "Unknown"}" to "${caseInfo.status}".`,
        caseId,
      });
    }
  });

  return entries.map((entry) =>
    annotateNotificationWithProject(entry, projectName),
  );
}

// Formats a timestamp as "Just now" / "Xm ago" / "Xh ago" / "Xd ago" for the notification list.
function formatRelativeTime(timestamp: number) {
  const diffMin = Math.round((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

// Formats a timestamp into the local date string (e.g. "02 Jul 2026").
function formatTimestamp(timestamp: number) {
  try {
    return formatDate(new Date(timestamp).toISOString()) || undefined;
  } catch {
    return undefined;
  }
}

function readSupportCaseProjectMap(contactId: string) {
  try {
    const raw = window.localStorage.getItem(
      `${SUPPORT_CASE_PROJECT_MAP_STORAGE_PREFIX}:${contactId}`,
    );
    return raw
      ? (JSON.parse(raw) as Record<
          string,
          { projectId?: string; projectName?: string }
        >)
      : {};
  } catch {
    return {};
  }
}

function writeSupportCaseProjectMap(
  contactId: string,
  map: Record<string, { projectId?: string; projectName?: string }>,
) {
  try {
    window.localStorage.setItem(
      `${SUPPORT_CASE_PROJECT_MAP_STORAGE_PREFIX}:${contactId}`,
      JSON.stringify(map),
    );
  } catch {
    /* ignore storage errors */
  }
}

function formatNotificationCount(count: number) {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

function normalizeProjectMatchValue(value?: string | null) {
  return (value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/-+$/g, "")
    .toLowerCase();
}

// Bell trigger + dropdown panel listing notifications, with mark-all-read and clear-all actions.
function NotificationBell({
  notifications,
  isOpen,
  onToggle,
  onClose,
  onNotificationClick,
  onMarkAllRead,
  onDeleteNotification,
  wrapperClassName = "dashboardWorkspace__notifications",
}: {
  notifications: PortalNotification[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNotificationClick: (notification: PortalNotification) => void;
  onMarkAllRead: () => void;
  onDeleteNotification?: (id: string) => void;
  wrapperClassName?: string;
}) {
  const [activeFilter, setActiveFilter] =
    useState<NotificationVisibilityFilter>("unread");
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const filteredNotifications =
    activeFilter === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;
  const hasUnreadNotifications = unreadCount > 0;
  const emptyMessage =
    activeFilter === "unread"
      ? "No unread notifications right now."
      : "You're all caught up.";

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
                    {onDeleteNotification ? null : null}
                  </div>
                ) : null}
              </div>

              {notifications.length > 0 ? (
                <div className="dashboardNotificationsFilter">
                  <button
                    type="button"
                    className={`dashboardNotificationsFilter__chip${
                      activeFilter === "unread" ? " is-active" : ""
                    }`}
                    onClick={() => setActiveFilter("unread")}
                  >
                    Unread
                    {hasUnreadNotifications ? (
                      <span className="dashboardNotificationsFilter__count">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className={`dashboardNotificationsFilter__chip${
                      activeFilter === "all" ? " is-active" : ""
                    }`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All notifications
                    <span className="dashboardNotificationsFilter__count">
                      {notifications.length}
                    </span>
                  </button>
                </div>
              ) : null}

              {filteredNotifications.length === 0 ? (
                <p className="dashboardWorkspace__notificationsEmpty">
                  {emptyMessage}
                </p>
              ) : (
                <ul className="dashboardWorkspace__notificationsList">
                  {filteredNotifications.map((notification) => (
                      <li key={notification.id} className="dashboardWorkspace__notificationRow">
                        <button
                          type="button"
                          className={`dashboardWorkspace__notificationItem${
                            notification.read ? "" : " is-unread"
                          }`}
                          onClick={() => onNotificationClick(notification)}
                        >
                          <span
                            className="dashboardWorkspace__notificationIcon"
                            aria-hidden="true"
                          >
                            <NotificationTypeIcon type={notification.type} />
                          </span>
                          <span className="dashboardWorkspace__notificationCopy">
                            <span>{notification.message}</span>
                            <small>
                              {formatRelativeTime(notification.timestamp)}
                              {" \u00B7 "}
                              {formatTimestamp(notification.timestamp)}
                            </small>
                          </span>
                        </button>
                        {onDeleteNotification ? (
                          <button
                            type="button"
                            className="dashboardWorkspace__notificationDelete"
                            aria-label="Delete notification"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(notification.id);
                            }}
                          />
                        ) : null}
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

// Picks the icon shown next to a notification based on its type.
function NotificationTypeIcon({ type }: { type: PortalNotificationType }) {
  if (type === "design") return <FiCheckCircle />;
  if (type === "vendor") return <FiBriefcase />;
  if (type === "payment") return <FiCreditCard />;
  if (type === "paymentDue") return <FiClock />;
  if (type === "documents") return <FiFileText />;
  if (type === "cases") return <FiHeadphones />;
  return <FiCalendar />;
}

// Avatar trigger + dropdown with client name/email and a logout action.
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
                <span
                  className="dashboardWorkspace__accountAvatar"
                  aria-hidden="true"
                >
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

// Small icon + label/value tile used on the Profile & Overview tab.
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

type QuickLinkTarget =
  | "profile"
  | "siteVisit"
  | "projectDetails"
  | "status"
  | "vendor"
  | "payment"
  | "documents"
  | "cases"
  | "notifications";

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
    target: "siteVisit",
    icon: FiCalendar,
    label: "Site Visit Appointment & Report",
    description: "Review or reschedule your site visit",
  },
  {
    target: "projectDetails",
    icon: FiHome,
    label: "Project Details",
    description: "Submit or review your project requirements",
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
  {
    target: "cases",
    icon: FiHeadphones,
    label: "Support Cases",
    description: "Track the status of requests you've raised",
  },
];

// Row of shortcut buttons to the other dashboard tabs, shown at the bottom of each tab (minus the current one).
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

// Project Status tab: phase timeline, completion percentage, and vendor summary for the active project.
function SiteVisitTab({
  leadId,
  primaryLeadId,
  opportunityId,
  contactId,
}: {
  leadId?: string;
  primaryLeadId?: string;
  opportunityId?: string;
  contactId?: string;
}) {
  const [appointment, setAppointment] = useState<SiteVisitAppointment | null>(null);
  const [reports, setReports] = useState<Array<{
    leadId: string;
    report: SiteVisitReport;
    projectNumber: number;
    totalProjects: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(true);
  const [reportMessage, setReportMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTimeSlot, setRequestedTimeSlot] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setIsReportLoading(true);
    let storedLeadIds: string[] = [];
    try {
      const stored = JSON.parse(
        localStorage.getItem(`areliaProjectLeadIds:${primaryLeadId}`) || "[]",
      );
      if (Array.isArray(stored)) {
        storedLeadIds = stored.filter((id): id is string => typeof id === "string");
      }
    } catch {
      /* Ignore malformed legacy project IDs. */
    }
    void getSiteVisitAppointment(leadId, opportunityId, contactId).then(async (appointmentResult) => {
      if (cancelled) return;
      setAppointment(appointmentResult);

      const resolvedLeadId = appointmentResult.leadId || primaryLeadId || leadId;
      const resolvedOpportunityId = appointmentResult.opportunityId || opportunityId;
      const reportLeadTargets = Array.from(
        new Set([resolvedLeadId, ...storedLeadIds].filter((id): id is string => Boolean(id))),
      );
      const reportTargets = reportLeadTargets.length > 0 ? reportLeadTargets : [undefined];

      const reportResults = await Promise.all(
        reportTargets.map(async (relatedLeadId, projectIndex) => ({
          leadId: relatedLeadId || resolvedOpportunityId || "opportunity",
          projectNumber: projectIndex + 1,
          result: await getApprovedSiteVisitReport(
            relatedLeadId,
            undefined,
            resolvedOpportunityId,
            contactId,
          ),
        })),
      );

      if (cancelled) return;
      setReports(
        reportResults
          .flatMap(({ leadId: reportLeadId, projectNumber, result }) => {
            const availableReports = result.reports && result.reports.length > 0
              ? result.reports
              : result.report
                ? [result.report]
                : [];

            return availableReports.map((report) => ({
              leadId: report.leadId || reportLeadId,
              report,
              projectNumber,
              totalProjects: reportTargets.length,
            }));
          }),
      );
      setReportMessage(
        reportResults.find(({ result }) => !result.reportAvailable)?.result.message || "",
      );
      setError(
        appointmentResult.success
          ? ""
          : appointmentResult.message || "Unable to load the appointment.",
      );
      setIsLoading(false);
      setIsReportLoading(false);
    });
    return () => { cancelled = true; };
  }, [contactId, leadId, opportunityId, primaryLeadId]);

  const submitResponse = async (response: "Approved" | "Reschedule Requested") => {
    setIsSaving(true);
    setError("");
    try {
      const result = await submitSiteVisitResponse({
        ...(leadId ? { leadId } : {}),
        ...(opportunityId ? { opportunityId } : {}),
        ...(contactId ? { contactId } : {}),
        response,
        ...(response === "Reschedule Requested"
          ? { requestedDate, requestedTimeSlot }
          : {}),
      });
      if (!result.success) {
        setError(result.message || "Unable to save your response.");
        return;
      }
      setAppointment((current) => ({
        ...result,
        availableTimeSlots: current?.availableTimeSlots || [],
        appointmentSentDate: current?.appointmentSentDate,
      }));
      setIsRescheduling(false);
    } catch {
      setError("Could not reach Salesforce. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const today = new Date();
  const minDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  const normalizedAppointmentStatus = appointment?.appointmentStatus?.trim().toLowerCase();
  const isAwaitingCustomerResponse =
    normalizedAppointmentStatus === "pending" ||
    normalizedAppointmentStatus === "appointment rescheduled";
  const isApproved =
    normalizedAppointmentStatus === "approved" &&
    appointment?.appointmentConfirmed === true;
  const isRescheduled =
    normalizedAppointmentStatus === "rescheduled" &&
    Boolean(appointment?.requestedDate) &&
    Boolean(appointment?.requestedTimeSlot);
  const hasConfirmedResponse = isApproved || isRescheduled;
  const debugValues = [
    { label: "Input leadId", value: leadId },
    { label: "Input primaryLeadId", value: primaryLeadId },
    { label: "Input opportunityId", value: opportunityId },
    { label: "Input contactId", value: contactId },
    { label: "Backend appointment leadId", value: appointment?.leadId },
    { label: "Backend appointment opportunityId", value: appointment?.opportunityId },
    { label: "First report leadId", value: reports[0]?.report?.leadId },
    { label: "First report opportunityId", value: reports[0]?.report?.opportunityId },
  ];
  const previewDate = isRescheduled
    ? appointment?.requestedDate
    : appointment?.appointmentDate;
  const previewSlot = isRescheduled
    ? appointment?.requestedTimeSlot
    : appointment?.appointmentTimeSlot;

  return (
    <motion.section className="siteVisit" initial="hidden" animate="visible" variants={{ visible: staggerTransition }}>
      <motion.header className="siteVisit__header" variants={fadeUpItem}>
        <p className="dashboardSection__eyebrow">Your appointment</p>
        <h1>Site Visit Appointment &amp; Report</h1>
        <p>Review the visit proposed by your Arelia team and confirm or request another time.</p>
      </motion.header>

      <motion.div className="siteVisitReport" variants={fadeUpItem}>
        <div className="siteVisitReport__heading">
          <div>
            <p className="dashboardSection__eyebrow">Debug values</p>
            <h2>Resolved IDs</h2>
          </div>
        </div>
        <div className="siteVisitReport__summary">
          {debugValues.map(({ label, value }) => (
            <SiteVisitReportField key={label} label={label} value={value || "null"} />
          ))}
        </div>
      </motion.div>

      {isLoading ? <div className="dashboardState">Loading appointment details...</div> : null}
      {!isLoading && error ? <div className="dashboardError">{error}</div> : null}
      {!isLoading && !error && !appointment?.appointmentAvailable ? (
        <GlassEmptyState message="No site visit appointment has been scheduled yet." />
      ) : null}

      {!isLoading && appointment?.appointmentAvailable ? (
        <motion.div className="siteVisit__card" variants={fadeUpItem}>
          {isAwaitingCustomerResponse ? (
            <>
              <div className="siteVisit__details">
                <div><span>Appointment sent</span><strong>{formatDate(appointment.appointmentSentDate) || "Not available"}</strong></div>
                <div><span>Visit date</span><strong>{formatDate(appointment.appointmentDate) || "Not available"}</strong></div>
                <div><span>Time slot</span><strong>{appointment.appointmentTimeSlot || "Not available"}</strong></div>
              </div>

              {!isRescheduling ? (
                <div className="siteVisit__actions">
                  <button className="siteVisit__primary" type="button" disabled={isSaving} onClick={() => void submitResponse("Approved")}>
                    <FiCheckCircle /> {isSaving ? "Saving..." : "Approve"}
                  </button>
                  <button className="siteVisit__secondary" type="button" disabled={isSaving} onClick={() => setIsRescheduling(true)}>
                    <FiCalendar /> Reschedule
                  </button>
                </div>
              ) : (
                <form className="siteVisit__form" onSubmit={(event) => { event.preventDefault(); void submitResponse("Reschedule Requested"); }}>
                  <label>
                    <span>Preferred date</span>
                    <input type="date" min={minDate} value={requestedDate} onChange={(event) => setRequestedDate(event.target.value)} required />
                  </label>
                  <label>
                    <span>Available time slot</span>
                    <select value={requestedTimeSlot} onChange={(event) => setRequestedTimeSlot(event.target.value)} required>
                      <option value="">Select a time slot</option>
                      {appointment.availableTimeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </label>
                  <div className="siteVisit__actions">
                    <button className="siteVisit__primary" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save new appointment"}</button>
                    <button className="siteVisit__secondary" type="button" disabled={isSaving} onClick={() => setIsRescheduling(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </>
          ) : hasConfirmedResponse ? (
            <div className="siteVisit__confirmation">
              <span className="siteVisit__confirmationIcon"><FiCheckCircle /></span>
              <div>
                <p>{isRescheduled ? "Response submitted" : "Appointment approved"}</p>
                <h2>{formatDate(previewDate) || "Date unavailable"}</h2>
                <strong><FiClock /> {previewSlot || "Time unavailable"}</strong>
              </div>
            </div>
          ) : (
            <>
              <div className="siteVisit__details">
                <div><span>Appointment sent</span><strong>{formatDate(appointment.appointmentSentDate) || "Not available"}</strong></div>
                <div><span>Visit date</span><strong>{formatDate(appointment.appointmentDate) || "Not available"}</strong></div>
                <div><span>Time slot</span><strong>{appointment.appointmentTimeSlot || "Not available"}</strong></div>
              </div>
              <p className="siteVisit__notice">
                This appointment is not currently awaiting a customer response.
              </p>
            </>
          )}
        </motion.div>
      ) : null}

      {isReportLoading ? (
        <div className="siteVisitReport"><div className="dashboardState">Loading approved reports...</div></div>
      ) : reports.length > 0 ? (
        <div className="siteVisitReportList">
          {reports.map(({ leadId: reportLeadId, report, projectNumber, totalProjects }) => (
            <SiteVisitReportCard
              key={`${reportLeadId}:${report.reportId}`}
              report={report}
              projectNumber={projectNumber}
              totalProjects={totalProjects}
            />
          ))}
        </div>
      ) : (
        <div className="siteVisitReport">
          <p className="siteVisitReport__empty">{reportMessage || "No Site Visit Report is available for this project yet."}</p>
        </div>
      )}
    </motion.section>
  );
}

function SiteVisitReportCard({
  report,
  projectNumber,
  totalProjects,
}: {
  report: SiteVisitReport;
  projectNumber: number;
  totalProjects: number;
}) {
  return (
    <motion.div className="siteVisitReport" variants={fadeUpItem}>
      <div className="siteVisitReport__heading">
        <div>
          <p className="dashboardSection__eyebrow">Management approved</p>
          <h2>{totalProjects > 1 ? `Project ${projectNumber} Site Visit Report` : "Site Visit Report"}</h2>
        </div>
        {report.status ? <span className="dashboardSection__chip">{report.status}</span> : null}
      </div>
      <div className="siteVisitReport__summary">
        <SiteVisitReportField label="Report" value={report.reportName} />
        <SiteVisitReportField label="Visit type" value={report.siteVisitType} />
        <SiteVisitReportField label="Project stage" value={report.projectStage} />
        <SiteVisitReportField label="Visit date" value={formatDate(report.siteVisitDate)} />
        <SiteVisitReportField label="Time slot" value={report.siteVisitTimeSlot} />
        <SiteVisitReportField label="Supervisor" value={report.supervisorName} />
        <SiteVisitReportField label="Site address" value={report.siteAddress} />
        <SiteVisitReportField label="Rooms" value={report.roomsCount != null ? String(report.roomsCount) : undefined} />
        <SiteVisitReportField label="Site area" value={report.siteAreaSqFt != null ? `${report.siteAreaSqFt.toLocaleString("en-IN")} sq ft` : undefined} />
        <SiteVisitReportField label="Usable area" value={report.usableAreaSqFt != null ? `${report.usableAreaSqFt.toLocaleString("en-IN")} sq ft` : undefined} />
        <SiteVisitReportField label="Estimated cost" value={report.totalEstimatedCost != null ? `₹${report.totalEstimatedCost.toLocaleString("en-IN")}` : undefined} />
        <SiteVisitReportField label="Estimated completion" value={formatDate(report.estimatedCompletionDate) || (report.estimatedCompletionMonths != null ? `${report.estimatedCompletionMonths} months` : undefined)} />
      </div>
      {report.description || report.estimatedBudgetDescription ? (
        <div className="siteVisitReport__notes">
          {report.description ? <div><span>Description</span><p>{report.description}</p></div> : null}
          {report.estimatedBudgetDescription ? <div><span>Budget notes</span><p>{report.estimatedBudgetDescription}</p></div> : null}
        </div>
      ) : null}
      <div className="siteVisitReport__documents">
        <h3>Report documents</h3>
        {report.documents.length > 0 ? (
          <div className="siteVisitReport__documentGrid">
            {report.documents.map((document) => (
              <article key={document.versionId} className="siteVisitReport__document">
                <span className="siteVisitReport__documentIcon">{document.isImage ? <FiImage /> : <FiFileText />}</span>
                <div><strong>{document.title}</strong><small>{[document.fileExtension?.toUpperCase(), document.contentSize ? formatFileSize(document.contentSize) : ""].filter(Boolean).join(" · ")}</small></div>
                <div className="siteVisitReport__documentActions">
                  <a href={document.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <FiExternalLink /> Open
                  </a>
                  <button
                    type="button"
                    onClick={() => void downloadSiteVisitDocument(
                      document.downloadUrl,
                      document.title,
                      document.fileExtension,
                    )}
                  >
                    <FiDownload /> Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="siteVisitReport__empty">No documents are attached to this report.</p>}
      </div>
    </motion.div>
  );
}

function SiteVisitReportField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function downloadSiteVisitDocument(url: string, title: string, extension?: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Document download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const normalizedExtension = extension?.replace(/^\./, "");
    anchor.href = objectUrl;
    anchor.download = normalizedExtension && !title.toLowerCase().endsWith(`.${normalizedExtension.toLowerCase()}`)
      ? `${title}.${normalizedExtension}`
      : title;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Unable to download Site Visit Report document:", error);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

const PROJECT_TYPES = ["Home", "Office", "Only Project Plan"] as const;
const PLAN_LEVELS = ["Standard", "Premium", "Luxury"] as const;
const PROJECT_SCOPES: Record<string, string[]> = {
  Home: [
    "Full Home Interiors", "Home Decor", "Kitchen", "Bed Room", "Hall Interior",
    "1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK",
  ],
  Office: [
    "Conference Hall", "Fully Office Interiors", "Office Decor", "Office Space",
    "Dining Hall", "Cabins",
  ],
  "Only Project Plan": [
    "Full Home Interiors", "Home Decor", "Kitchen", "Bed Room", "Hall Interior",
    "Conference Hall", "Fully Office Interiors", "Office Decor", "Office Space",
    "Dining Hall", "Cabins", "1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK",
  ],
};

const EMPTY_PROJECT_DETAILS_FORM: Omit<ProjectDetailsPayload, "leadId"> = {
  siteSpace: "",
  typeOfProject: "",
  projectScope: "",
  planLevel: "",
  customerBudget: "",
  siteLocation: "",
  projectDescription: "",
};

function ProjectDetailsTab({
  leadId,
  opportunityId,
  contactId,
  customer,
  addProjectRequestKey,
}: {
  leadId?: string;
  opportunityId?: string;
  contactId?: string;
  customer?: { name?: string; email?: string; phone?: string } | null;
  addProjectRequestKey: number;
}) {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [form, setForm] = useState(EMPTY_PROJECT_DETAILS_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [error, setError] = useState("");

  const applyFormDetails = (result?: ProjectDetails) => {
    setForm({
      siteSpace: result?.siteSpace || "",
      typeOfProject: result?.typeOfProject || "",
      projectScope: result?.projectScope || "",
      planLevel: result?.planLevel || "",
      customerBudget: result?.customerBudget || "",
      siteLocation: result?.siteLocation || "",
      projectDescription: result?.projectDescription || "",
    });
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    const storageKey = `areliaProjectLeadIds:${leadId}`;
    let storedLeadIds: string[] = [];
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(stored)) storedLeadIds = stored.filter((id): id is string => typeof id === "string");
    } catch { /* Ignore malformed legacy storage. */ }
    const projectLeadIds = Array.from(
      new Set([leadId, ...storedLeadIds].filter((id): id is string => Boolean(id))),
    );
    const projectTargets = projectLeadIds.length > 0 ? projectLeadIds : [undefined];
    void Promise.all(projectTargets.map((id, index) =>
      getProjectDetails(id, index === 0 ? opportunityId : undefined, contactId),
    ))
      .then((results) => {
        if (cancelled) return;
        const successful = results.filter((result) => result.success);
        if (successful.length === 0) {
          setError(results[0]?.message || "Unable to load project details.");
          return;
        }
        setProjects(successful);
        const primary = successful.find((result) => result.leadId === leadId) || successful[0];
        if (!primary.projectSubmitted) applyFormDetails(primary);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach Salesforce. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [contactId, leadId, opportunityId]);

  useEffect(() => {
    if (addProjectRequestKey <= 0) return;
    setIsAddingProject(true);
    applyFormDetails();
    setError("");
  }, [addProjectRequestKey]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "typeOfProject" ? { projectScope: "" } : {}),
    }));
    setError("");
  };

  const primaryDetails = projects.find((item) => item.leadId === leadId) || projects[0];
  const resolvedCustomerName =
    customer?.name ||
    [primaryDetails?.firstName, primaryDetails?.lastName].filter(Boolean).join(" ");
  const resolvedCustomerEmail = customer?.email || primaryDetails?.email || "";
  const resolvedCustomerPhone = customer?.phone || primaryDetails?.phone || "";

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      let targetLeadId = leadId;
      if (isAddingProject) {
        const nameParts = (resolvedCustomerName || "Customer").trim().split(/\s+/);
        const lastName = nameParts.length > 1 ? nameParts.pop() || "Customer" : "Customer";
        const firstName = nameParts.join(" ") || resolvedCustomerName || "Customer";
        const leadResult = await registerLead(
          firstName,
          lastName,
          resolvedCustomerEmail,
          resolvedCustomerPhone.replace(/\D/g, "").slice(-10),
          "Self",
          undefined,
          undefined,
          leadId,
        );
        if (!leadResult.success || !leadResult.leadId) {
          setError(leadResult.message || "Unable to create the new project record.");
          return;
        }
        targetLeadId = leadResult.leadId;
      }

      const result = await submitProjectDetails({
        ...(targetLeadId ? { leadId: targetLeadId } : {}),
        ...(!isAddingProject && opportunityId ? { opportunityId } : {}),
        ...(!isAddingProject && contactId ? { contactId } : {}),
        ...form,
      });
      if (!result.success) {
        if (result.projectSubmitted) {
          const latest = await getProjectDetails(targetLeadId);
          if (latest.success) setProjects((current) => [...current.filter((item) => item.leadId !== targetLeadId), latest]);
        }
        setError(result.message || "Unable to submit project details.");
        return;
      }
      const identitySource = projects.find((item) => item.leadId === leadId);
      const submittedProject: ProjectDetails = {
        ...form,
        success: true,
        message: result.message,
        leadId: result.leadId || targetLeadId,
        projectSubmitted: true,
        firstName: identitySource?.firstName || resolvedCustomerName.trim().split(/\s+/).slice(0, -1).join(" "),
        lastName: identitySource?.lastName || resolvedCustomerName.trim().split(/\s+/).slice(-1)[0],
        email: identitySource?.email || resolvedCustomerEmail,
        phone: identitySource?.phone || resolvedCustomerPhone,
      };
      setProjects((current) => [...current.filter((item) => item.leadId !== targetLeadId), submittedProject]);
      if (isAddingProject) {
        const storageKey = `areliaProjectLeadIds:${leadId}`;
        const currentIds = projects.map((item) => item.leadId).filter((id): id is string => Boolean(id));
        localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set([...currentIds, targetLeadId]))));
      }
      setIsAddingProject(false);
      applyFormDetails();
    } catch {
      setError("Could not reach Salesforce. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scopeOptions = PROJECT_SCOPES[form.typeOfProject] || [];
  const customerName = resolvedCustomerName;
  const showForm = isAddingProject || Boolean(primaryDetails && !primaryDetails.projectSubmitted);
  const submittedProjects = projects.filter((item) => item.projectSubmitted);

  if (isLoading) return <div className="dashboardState">Loading project details...</div>;

  return (
    <motion.section className="projectDetails" initial="hidden" animate="visible" variants={{ visible: staggerTransition }}>
      <motion.header className="projectDetails__header" variants={fadeUpItem}>
        <p className="dashboardSection__eyebrow">Your requirements</p>
        <h1>Project Details</h1>
        <p>{showForm ? "Tell us about your space, plans, and expectations." : "Review the project requirements you submitted."}</p>
      </motion.header>

      {error ? <div className="dashboardError projectDetails__error">{error}</div> : null}

      {showForm ? (
        <motion.form className="projectDetails__form" onSubmit={handleSubmit} variants={fadeUpItem}>
          <div className="projectDetails__identity">
            <ProjectDetailPreview label="Customer" value={customerName} />
            <ProjectDetailPreview label="Email" value={resolvedCustomerEmail} />
            <ProjectDetailPreview label="Phone" value={resolvedCustomerPhone} />
          </div>
          <div className="projectDetails__fields">
            <label><span>Total site space (sq. ft.)</span><input type="number" min="1" step="any" value={form.siteSpace} onChange={(event) => updateField("siteSpace", event.target.value)} placeholder="Enter area" required /></label>
            <label><span>Type of project</span><select value={form.typeOfProject} onChange={(event) => updateField("typeOfProject", event.target.value)} required><option value="">Select project type</option>{PROJECT_TYPES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span>Project scope</span><select value={form.projectScope} onChange={(event) => updateField("projectScope", event.target.value)} disabled={!form.typeOfProject} required><option value="">Select project scope</option>{scopeOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span>Plan level</span><select value={form.planLevel} onChange={(event) => updateField("planLevel", event.target.value)} required><option value="">Select plan level</option>{PLAN_LEVELS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span>Budget (INR)</span><input type="number" min="1" step="any" value={form.customerBudget} onChange={(event) => updateField("customerBudget", event.target.value)} placeholder="Enter budget" required /></label>
            <label className="projectDetails__wide"><span>Full site address</span><textarea value={form.siteLocation} onChange={(event) => updateField("siteLocation", event.target.value)} placeholder="Full address of the project site" required /></label>
            <label className="projectDetails__wide"><span>Project notes / expectations</span><textarea value={form.projectDescription} onChange={(event) => updateField("projectDescription", event.target.value)} placeholder="Tell us about your space and expectations" required /></label>
          </div>
          <div className="projectDetails__submitRow">
            <p>Once submitted, these details cannot be edited.</p>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit project details"}<FiArrowRight /></button>
          </div>
        </motion.form>
      ) : null}

      {submittedProjects.length > 0 ? (
        <div className="projectDetails__projectList">
          {submittedProjects.map((details, index) => (
            <motion.div className="projectDetails__preview" variants={fadeUpItem} key={details.leadId || index}>
              <div className="projectDetails__success">
                <span><FiCheckCircle /></span>
                <div><strong>Project {index + 1} details submitted</strong><p>This response is locked and cannot be edited.</p></div>
              </div>
              <div className="projectDetails__previewGrid">
                <ProjectDetailPreview label="Customer" value={[details.firstName, details.lastName].filter(Boolean).join(" ") || customerName} />
                <ProjectDetailPreview label="Email" value={details.email} />
                <ProjectDetailPreview label="Phone" value={details.phone} />
                <ProjectDetailPreview label="Site space" value={details.siteSpace ? `${details.siteSpace} sq. ft.` : undefined} />
                <ProjectDetailPreview label="Type of project" value={details.typeOfProject} />
                <ProjectDetailPreview label="Project scope" value={details.projectScope} />
                <ProjectDetailPreview label="Plan level" value={details.planLevel} />
                <ProjectDetailPreview label="Customer budget" value={details.customerBudget ? `₹${Number(details.customerBudget).toLocaleString("en-IN")}` : undefined} />
                <ProjectDetailPreview label="Site location" value={details.siteLocation} wide />
                <ProjectDetailPreview label="Project description" value={details.projectDescription} wide />
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}

function ProjectDetailPreview({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) {
  return <div className={`projectDetails__previewItem${wide ? " projectDetails__previewItem--wide" : ""}`}><span>{label}</span><strong>{value || "Not available"}</strong></div>;
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
              transition={{
                delay: 0.75,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
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

// Modal listing a single vendor's tasks and task-level media (photos/videos/files).
function VendorTaskModal({
  vendor,
  tasksInfo,
  onClose,
}: {
  vendor: ProjectVendor | null;
  tasksInfo:
    | { loading: boolean; data: ProjectVendorTasksResponse | null }
    | undefined;
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

  const vendorCompletion = vendor
    ? Math.round(vendor.completionPercentage || 0)
    : 0;

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
                <span
                  className="dashboardVendorCard__avatar"
                  aria-hidden="true"
                >
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
                  <h2
                    id="vendor-task-modal-title"
                    className="vendorTaskModal__title"
                  >
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

// Vendor Tasks tab: grid of vendor cards, each opening a VendorTaskModal for task detail.
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
    Record<
      string,
      { loading: boolean; data: ProjectVendorTasksResponse | null }
    >
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
      setTaskState((prev) => ({
        ...prev,
        [vendorName]: { loading: true, data: null },
      }));
      void getVendorTasks(projectId, vendorName).then((res) => {
        setTaskState((prev) => ({
          ...prev,
          [vendorName]: { loading: false, data: res },
        }));
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
            Real-time progress tracking for every artisan and contractor working
            on your project.
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
                    <span
                      className="dashboardVendorCard__avatar"
                      aria-hidden="true"
                    >
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
        vendor={
          vendors.find((vendor) => vendor.vendorName === activeVendor) || null
        }
        tasksInfo={activeVendor ? taskState[activeVendor] : undefined}
        onClose={closeVendorTasks}
      />

      <QuickLinks exclude="vendor" onNavigate={onNavigate} />
    </motion.section>
  );
}

// Payment Terms tab: milestone payment schedule with paid/due status per term.
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
  const navigate = useNavigate();

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
                </div>

                <div className="dashboardPaymentCard__columns">
                  <div className="dashboardPaymentCard__col">
                    <span>Percentage</span>
                    <strong>{term.percentage ?? 0}%</strong>
                  </div>
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
                  {term.id ? (
                    <div className="dashboardPaymentCard__col">
                      <span>&nbsp;</span>
                      {term.paymentReceived ? (
                        <button
                          type="button"
                          className="dashboardPaymentCard__payButton dashboardPaymentCard__payButton--ghost"
                          onClick={() => navigate(`/payment/receipt/${term.id}`)}
                        >
                          View Receipt
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="dashboardPaymentCard__payButton"
                          onClick={() => navigate(`/payment/${term.id}`)}
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  ) : null}
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

// Documents & Reports tab: project photo gallery and document list, with
// support for scrolling to and highlighting a specific file (from a
// "new document" notification click).
function DocumentsTab({
  projectId,
  projectName,
  onNavigate,
  highlightDocumentUrl,
  onHighlightHandled,
}: {
  projectId?: string;
  projectName?: string;
  onNavigate: (tab: QuickLinkTarget) => void;
  highlightDocumentUrl?: string | null;
  onHighlightHandled?: () => void;
}) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [videos, setVideos] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState<
    "photos" | "videos" | "documents"
  >(
    "photos",
  );
  const [selectedPreview, setSelectedPreview] = useState<{
    title: string;
    subtitle?: string;
    href: string;
    openHref?: string;
    downloadHref?: string;
    meta?: string;
    mediaType: "image" | "video";
  } | null>(null);
  const [videoPlaybackFailed, setVideoPlaybackFailed] = useState(false);
  const documentCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const highlightedDocKey =
    highlightDocumentUrl &&
    files.some((file) => file.downloadUrl === highlightDocumentUrl)
      ? highlightDocumentUrl
      : null;
  const openPreview = (preview: {
    title: string;
    subtitle?: string;
    href: string;
    openHref?: string;
    downloadHref?: string;
    meta?: string;
    mediaType: "image" | "video";
  }) => {
    setVideoPlaybackFailed(false);
    setSelectedPreview(preview);
  };
  const closePreview = () => {
    setVideoPlaybackFailed(false);
    setSelectedPreview(null);
  };

  useEffect(() => {
    async function loadMedia() {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const filesRes = await getProjectFiles(projectId);

      if (Array.isArray(filesRes)) {
        setFiles(
          filesRes.filter(
            (file) =>
              !isImageFileType(file.fileType) && !isVideoFileType(file.fileType),
          ),
        );
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
        setVideos(
          filesRes.filter((file) => isVideoFileType(file.fileType)),
        );
      } else {
        setFiles([]);
        setImages([]);
        setVideos([]);
      }

      setIsLoading(false);
    }
    void loadMedia();
  }, [projectId]);

  // Tell the parent we've consumed this highlight request so it clears the
  // prop; this is the legitimate effect part - notifying an external owner.
  useEffect(() => {
    if (highlightDocumentUrl && files.length > 0) {
      onHighlightHandled?.();
    }
  }, [highlightDocumentUrl, files, onHighlightHandled]);

  useEffect(() => {
    if (!highlightedDocKey) return undefined;
    const node = documentCardRefs.current[highlightedDocKey];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    return undefined;
  }, [highlightedDocKey]);

  useEffect(() => {
    if (!selectedPreview) return undefined;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreview();
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
  if (files.length === 0 && images.length === 0 && videos.length === 0) {
    return (
      <GlassEmptyState message="No files, images, or videos have been uploaded to this project yet." />
    );
  }

  const hasPhotos = images.length > 0;
  const hasVideos = videos.length > 0;
  const hasDocuments = files.length > 0;
  const mediaTabs = [
    hasPhotos ? "photos" : null,
    hasVideos ? "videos" : null,
    hasDocuments ? "documents" : null,
  ].filter(Boolean) as Array<"photos" | "videos" | "documents">;
  const effectiveTab: "photos" | "videos" | "documents" =
    mediaTabs.includes(activeMediaTab) ? activeMediaTab : mediaTabs[0];

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

        {mediaTabs.length > 1 ? (
          <div className="dashboardMediaToggle" role="tablist">
            {hasPhotos ? (
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
            ) : null}
            {hasVideos ? (
              <button
                type="button"
                role="tab"
                aria-selected={effectiveTab === "videos"}
                className={`dashboardMediaToggle__btn${effectiveTab === "videos" ? " is-active" : ""}`}
                onClick={() => setActiveMediaTab("videos")}
              >
                <span>Project Videos</span>
                <span className="dashboardMediaToggle__count">
                  {videos.length}
                </span>
              </button>
            ) : null}
            {hasDocuments ? (
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
            ) : null}
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
                  openPreview({
                    title: img.title,
                    href: img.imageUrl,
                    openHref: img.imageUrl,
                    downloadHref: img.imageUrl,
                    subtitle: "Project image",
                    meta: "Private archive image",
                    mediaType: "image",
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
        ) : effectiveTab === "videos" ? (
          <div className="dashboardVideoGrid">
            {videos.map((video, index) => (
              <motion.article
                key={`${video.downloadUrl}-${index}`}
                className="dashboardDocumentCard dashboardVideoCard"
                variants={fadeUpItem}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="dashboardVideoCard__preview">
                  <video
                    src={video.previewUrl || video.downloadUrl}
                    controls
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                  />
                </div>
                <div className="dashboardVideoCard__body">
                  <div className="dashboardDocumentCard__body dashboardVideoCard__copy">
                    <strong>{video.title}</strong>
                    <p>{formatReadableFileMeta(video)}</p>
                  </div>
                </div>
                <div className="dashboardVideoCard__actions">
                  <a
                    href={video.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={video.title}
                    className="dashboardDocumentCard__download"
                  >
                    <FiDownload aria-hidden="true" />
                    <span>Download</span>
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="dashboardDocumentGrid">
            {files.map((file, index) => (
              <motion.article
                key={`${file.downloadUrl}-${index}`}
                ref={(node: HTMLElement | null) => {
                  documentCardRefs.current[file.downloadUrl] = node;
                }}
                className={`dashboardDocumentCard${
                  highlightedDocKey === file.downloadUrl
                    ? " dashboardDocumentCard--highlighted"
                    : ""
                }`}
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
                    onClick={closePreview}
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
                            {selectedPreview.mediaType === "video"
                              ? "Video Preview"
                              : "Image Preview"}
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
                          onClick={closePreview}
                        >
                          <FiX aria-hidden="true" />
                        </button>
                      </div>

                      <div className="dashboardPreview__stage dashboardPreview__stage--image">
                        <div className="dashboardPreview__metaBar">
                          <span>{selectedPreview.title}</span>
                          <span>
                            {selectedPreview.meta ||
                              (selectedPreview.mediaType === "video"
                                ? "Private archive video"
                                : "Private archive image")}
                          </span>
                        </div>
                        <div className="dashboardPreview__image">
                          {selectedPreview.mediaType === "video" ? (
                            <>
                              <video
                                className="dashboardPreview__video"
                                controls
                                autoPlay
                                playsInline
                                preload="metadata"
                                onError={() => setVideoPlaybackFailed(true)}
                              >
                                <source
                                  src={selectedPreview.href}
                                  type="video/mp4"
                                />
                                <source src={selectedPreview.href} />
                              </video>
                              {videoPlaybackFailed ? (
                                <div className="dashboardPreview__videoFallback">
                                  <strong>Inline playback is not available for this video.</strong>
                                  <p>
                                    You can still open it in a new tab or download it directly.
                                  </p>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <img
                              src={selectedPreview.href}
                              alt={selectedPreview.title}
                            />
                          )}
                        </div>
                      </div>

                      <div className="dashboardPreview__footer">
                        <div>
                          <strong>{selectedPreview.title}</strong>
                          <p>{selectedPreview.meta}</p>
                        </div>
                        <a
                          href={
                            selectedPreview.mediaType === "video"
                              ? selectedPreview.openHref || selectedPreview.href
                              : selectedPreview.downloadHref || selectedPreview.href
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dashboardPreview__cta"
                        >
                          {selectedPreview.mediaType === "video"
                            ? "Open Video"
                            : "Download"}
                        </a>
                        {selectedPreview.mediaType === "video" ? (
                          <a
                            href={selectedPreview.downloadHref || selectedPreview.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={selectedPreview.title}
                            className="dashboardPreview__cta"
                          >
                            Download Video
                          </a>
                        ) : null}
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

// Normalizes a case status into a CSS-safe modifier key (e.g. "In Progress" -> "in-progress").
function slugifyStatus(value?: string) {
  return (value || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// Full-page Notifications tab: lists all notifications with absolute dates.
function NotificationsTab({
  notifications,
  onNotificationClick,
  onMarkAllRead,
  onNavigate,
  onDeleteNotification,
}: {
  notifications: PortalNotification[];
  onNotificationClick: (n: PortalNotification) => void;
  onMarkAllRead: () => void;
  onNavigate: (tab: QuickLinkTarget) => void;
  onDeleteNotification?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] =
    useState<NotificationVisibilityFilter>("unread");
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );
  const visibleNotifications =
    activeFilter === "unread" ? unreadNotifications : notifications;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleNotifications;
    return visibleNotifications.filter((n) => {
      const parts = [n.message, n.projectName || "", n.type || ""].join(" ").toLowerCase();
      return parts.includes(q) || (n.caseId || "").toLowerCase().includes(q);
    });
  }, [visibleNotifications, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / NOTIFICATIONS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const unreadCount = unreadNotifications.length;
  const readCount = Math.max(0, notifications.length - unreadCount);
  const emptyTitle =
    activeFilter === "unread"
      ? "No unread notifications right now."
      : "No notifications yet.";
  const emptyDescription = query
    ? "Try another search term, project name, or case number."
    : activeFilter === "unread"
      ? "You're caught up. Switch to All notifications to review earlier updates."
      : "New project updates, files, payments, and case alerts will appear here.";

  return (
    <motion.section
      className="dashboardSection"
      initial="hidden"
      animate="visible"
      variants={{ visible: staggerTransition }}
    >
      <div className="dashboardSection__heading">
        <div>
          <p className="dashboardSection__eyebrow">Notifications</p>
          <h2 className="dashboardSection__title">Recent activity</h2>
          <p className="dashboardSection__lead">
            Unread notifications are shown first by default, with full history available anytime.
          </p>
        </div>
        <div className="dashboardSection__chip dashboardSection__chip--button">
          <button type="button" onClick={onMarkAllRead}>Mark all read</button>
        </div>
      </div>

      <div className="dashboardNotificationsTab__toolbar">
        <div className="dashboardNotificationsTab__summary">
          <div className="dashboardNotificationsTab__metric">
            <span className="dashboardNotificationsTab__metricLabel">Unread</span>
            <strong>{unreadCount}</strong>
          </div>
          <div className="dashboardNotificationsTab__metric">
            <span className="dashboardNotificationsTab__metricLabel">Read</span>
            <strong>{readCount}</strong>
          </div>
          <div className="dashboardNotificationsTab__metric">
            <span className="dashboardNotificationsTab__metricLabel">Total</span>
            <strong>{notifications.length}</strong>
          </div>
        </div>

        <div className="dashboardNotificationsTab__controls">
          <div className="dashboardNotificationsFilter">
            <button
            type="button"
            className={`dashboardNotificationsFilter__chip${
              activeFilter === "unread" ? " is-active" : ""
            }`}
            onClick={() => {
              setActiveFilter("unread");
              setPage(0);
            }}
          >
              Unread
              {unreadCount > 0 ? (
                <span className="dashboardNotificationsFilter__count">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            <button
            type="button"
            className={`dashboardNotificationsFilter__chip${
              activeFilter === "all" ? " is-active" : ""
            }`}
            onClick={() => {
              setActiveFilter("all");
              setPage(0);
            }}
          >
              All notifications
              <span className="dashboardNotificationsFilter__count">
                {notifications.length}
              </span>
            </button>
          </div>
          <input
            aria-label="Search notifications"
            className="dashboardNotificationsTab__search"
            placeholder="Search notifications, project, or case id..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div
          className="dashboardNotificationsTab__empty"
          variants={fadeUpItem}
        >
          <div className="dashboardNotificationsTab__emptyIcon" aria-hidden="true">
            <FiBell />
          </div>
          <div className="dashboardNotificationsTab__emptyCopy">
            <strong>
              {query ? "No notifications match your search." : emptyTitle}
            </strong>
            <p>{emptyDescription}</p>
          </div>
        </motion.div>
      ) : (
        <>
          <ul className="dashboardWorkspace__notificationsList dashboardNotificationsTab__list">
            {filtered
              .slice(safePage * NOTIFICATIONS_PER_PAGE, (safePage + 1) * NOTIFICATIONS_PER_PAGE)
              .map((notification) => (
                <li key={notification.id} className="dashboardWorkspace__notificationRow">
                  <button
                    type="button"
                    className={`dashboardWorkspace__notificationItem${notification.read ? '' : ' is-unread'}`}
                    onClick={() => onNotificationClick(notification)}
                  >
                    <span className="dashboardWorkspace__notificationIcon" aria-hidden="true">
                      <NotificationTypeIcon type={notification.type} />
                    </span>
                    <span className="dashboardWorkspace__notificationCopy">
                      <span>{notification.message}</span>
                      <small>{formatRelativeTime(notification.timestamp)} · {formatTimestamp(notification.timestamp)}</small>
                    </span>
                    <span className="dashboardNotificationsTab__notificationAction" aria-hidden="true">
                      <FiArrowRight />
                    </span>
                  </button>
                  {onDeleteNotification ? (
                    <button
                      type="button"
                      className="dashboardWorkspace__notificationDelete"
                      aria-label="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotification(notification.id);
                      }}
                    />
                  ) : null}
                </li>
              ))}
          </ul>
          {totalPages > 1 ? (
            <div className="dashboardNotificationsTab__pagination">
              <button type="button" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>Prev</button>
              <span>{safePage * NOTIFICATIONS_PER_PAGE + 1}-{Math.min((safePage + 1) * NOTIFICATIONS_PER_PAGE, filtered.length)} of {filtered.length}</span>
              <button type="button" onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))} disabled={safePage === totalPages - 1}>Next</button>
            </div>
          ) : null}
        </>
      )}

      <QuickLinks exclude={"profile"} onNavigate={onNavigate} />
    </motion.section>
  );
}

// Buckets a case's granular Salesforce status (New, In Progress, Escalated, ...)
// into the simple Open/Closed view customers filter by.
function isClosedCaseStatus(status?: string) {
  return ["closed", "resolved"].includes(slugifyStatus(status));
}

type CaseStatusFilter = "All" | "Open" | "Closed";

// Support Cases tab: lists the client's cases with a status filter, and
// supports scrolling to and highlighting a specific case (from a case
// notification click).
function CasesTab({
  contactId,
  projects,
  onNavigate,
  highlightCaseId,
  onHighlightHandled,
  onOpenSupportModal,
  refreshKey,
}: {
  contactId: string;
  projects: Array<{ id: string; name: string }>;
  onNavigate: (tab: QuickLinkTarget) => void;
  highlightCaseId?: string | null;
  onHighlightHandled?: () => void;
  onOpenSupportModal: () => void;
  refreshKey: number;
}) {
  const [cases, setCases] = useState<SupportCaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CaseStatusFilter>("All");
  const [projectFilter, setProjectFilter] = useState("all");
  const caseCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const effectiveHighlightedCaseId =
    highlightCaseId && cases.some((item) => item.caseId === highlightCaseId)
      ? highlightCaseId
      : null;

  useEffect(() => {
    async function loadCases() {
      if (!contactId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const result = await getSupportCases(contactId);
      const storedProjectMap = readSupportCaseProjectMap(contactId);
      const list = (result || [])
        .map((item) => {
          const storedProject = storedProjectMap[item.caseId];
          return {
            ...item,
            projectId: item.projectId || storedProject?.projectId,
            projectName: item.projectName || storedProject?.projectName,
          };
        })
        .slice()
        .sort((left, right) => {
        const leftTime = left.createdDate
          ? new Date(left.createdDate).getTime()
          : 0;
        const rightTime = right.createdDate
          ? new Date(right.createdDate).getTime()
          : 0;
        return rightTime - leftTime;
        });

      const nextStoredProjectMap = { ...storedProjectMap };
      list.forEach((item) => {
        if (item.caseId && (item.projectId || item.projectName)) {
          nextStoredProjectMap[item.caseId] = {
            projectId: item.projectId,
            projectName: item.projectName,
          };
        }
      });
      writeSupportCaseProjectMap(contactId, nextStoredProjectMap);
      setCases(list);
      setIsLoading(false);
    }
    void loadCases();
  }, [contactId, refreshKey]);

  // Tell the parent we've consumed this highlight request so it clears the
  // prop; this is the legitimate effect part - notifying an external owner.
  useEffect(() => {
    if (highlightCaseId && cases.length > 0) {
      onHighlightHandled?.();
    }
  }, [highlightCaseId, cases, onHighlightHandled]);

  useEffect(() => {
    if (!effectiveHighlightedCaseId) return undefined;
    const node = caseCardRefs.current[effectiveHighlightedCaseId];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    return undefined;
  }, [effectiveHighlightedCaseId]);

  if (isLoading)
    return <p className="dashboard-loading">Loading your cases...</p>;

  const openCases = cases.filter((item) => !isClosedCaseStatus(item.status));
  const closedCases = cases.filter((item) => isClosedCaseStatus(item.status));
  const statusOptions: Array<{ key: CaseStatusFilter; count: number }> = [
    { key: "All", count: cases.length },
    { key: "Open", count: openCases.length },
    { key: "Closed", count: closedCases.length },
  ];
  const visibleCasesByStatus =
    statusFilter === "All" ? cases : statusFilter === "Open" ? openCases : closedCases;
  const findMatchingProject = (item: SupportCaseRecord) => {
    const normalizedProjectId = normalizeProjectMatchValue(item.projectId);
    const normalizedProjectName = normalizeProjectMatchValue(item.projectName);
    return projects.find((project) => {
      const projectIdMatch =
        normalizedProjectId &&
        normalizeProjectMatchValue(project.id) === normalizedProjectId;
      const projectNameMatch =
        normalizedProjectName &&
        normalizeProjectMatchValue(project.name) === normalizedProjectName;
      const projectIdLooksLikeName =
        normalizedProjectId &&
        normalizeProjectMatchValue(project.name) === normalizedProjectId;
      return Boolean(projectIdMatch || projectNameMatch || projectIdLooksLikeName);
    });
  };
  const resolvedProjectName = (item: SupportCaseRecord) =>
    item.projectName ||
    findMatchingProject(item)?.name ||
    "Project not assigned";
  const projectOptions = [
    { id: "all", name: "All projects" },
    ...projects.map((project) => ({ id: project.id, name: project.name })),
  ];
  const visibleCases = visibleCasesByStatus.filter((item) => {
    if (projectFilter === "all") return true;
    const matchedProject = findMatchingProject(item);
    return matchedProject?.id === projectFilter;
  });

  return (
    <motion.section
      className="dashboardSection"
      initial="hidden"
      animate="visible"
      variants={{ visible: staggerTransition }}
    >
      <div className="dashboardSection__heading">
        <div>
          <p className="dashboardSection__eyebrow">Client Support</p>
          <h2 className="dashboardSection__title">Your support cases</h2>
          <p className="dashboardSection__lead">
            Track every request you&apos;ve raised with our team, along with its
            current status, category, and priority.
          </p>
        </div>
        <button
          type="button"
          className="dashboardSection__chip dashboardSection__chip--button"
          onClick={onOpenSupportModal}
        >
          <FiHeadphones aria-hidden="true" />
          <span>New Case</span>
        </button>
      </div>

      {cases.length === 0 ? (
        <GlassEmptyState message="You haven't raised any support cases yet." />
      ) : (
        <>
          <div className="dashboardMediaToggle" role="tablist">
            {statusOptions.map(({ key, count }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={statusFilter === key}
                className={`dashboardMediaToggle__btn${statusFilter === key ? " is-active" : ""}`}
                onClick={() => setStatusFilter(key)}
              >
                <span>{key}</span>
                <span className="dashboardMediaToggle__count">{count}</span>
              </button>
            ))}
          </div>

          <div className="dashboardCaseFilters">
            <div className="dashboardCaseFilters__summary">
              <strong>Total Cases: {visibleCases.length}</strong>
              <span>
                {projectFilter === "all"
                  ? "cases shown across all projects"
                  : `cases shown for ${
                      projectOptions.find((project) => project.id === projectFilter)
                        ?.name || "selected project"
                    }`}
              </span>
            </div>
            <FormSelect
              label="Project Filter"
              value={projectFilter}
              options={projectOptions.map((project) => ({
                label: project.name,
                value: project.id,
              }))}
              onChange={setProjectFilter}
              className="dashboardCaseFilters__project"
            />
          </div>

          <div className="dashboardCaseGrid">
            {visibleCases.map((item) => (
              <motion.article
                key={item.caseId}
                ref={(node: HTMLElement | null) => {
                  caseCardRefs.current[item.caseId] = node;
                }}
                className={`dashboardCaseCard${
                  effectiveHighlightedCaseId === item.caseId
                    ? " dashboardCaseCard--highlighted"
                    : ""
                }`}
                variants={fadeUpItem}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="dashboardCaseCard__header">
                  <span className="dashboardCaseCard__eyebrow">
                    Case #{item.caseNumber || "—"}
                  </span>
                  <span
                    className={`dashboardCaseCard__status dashboardCaseCard__status--${slugifyStatus(item.status)}`}
                  >
                    {item.status || "Unknown"}
                  </span>
                </div>
                <h3 className="dashboardCaseCard__title">{item.subject}</h3>
                <p className="dashboardCaseCard__projectName">
                  {resolvedProjectName(item)}
                </p>
                <div className="dashboardCaseCard__descriptionBlock">
                  <span className="dashboardCaseCard__descriptionLabel">Description</span>
                  <p className="dashboardCaseCard__description">
                    {item.description || "No description provided."}
                  </p>
                </div>
                <div className="dashboardCaseCard__meta">
                  <span>
                    <FiFileText aria-hidden="true" />
                    {item.caseId}
                  </span>
                  {item.category ? (
                    <span>
                      <FiLayers aria-hidden="true" />
                      {item.category}
                    </span>
                  ) : null}
                  {item.priority ? (
                    <span
                      className={`dashboardCaseCard__priority dashboardCaseCard__priority--${item.priority.toLowerCase()}`}
                    >
                      <FiZap aria-hidden="true" />
                      {item.priority}
                    </span>
                  ) : null}
                  {item.createdDate ? (
                    <span>
                      <FiCalendar aria-hidden="true" />
                      {formatDate(item.createdDate)}
                    </span>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </div>
        </>
      )}

      <QuickLinks exclude="cases" onNavigate={onNavigate} />
    </motion.section>
  );
}

// Top-level client portal page: loads the client's profile/projects, polls
// for changes to surface notifications, and renders the active tab
// (profile, status, vendor, payment, documents, cases) inside the shared
// nav/notification/account chrome.
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
  const [contactProjects, setContactProjects] = useState<ProjectStatusRecord[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCasesRefreshKey, setSupportCasesRefreshKey] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [addProjectRequestKey, setAddProjectRequestKey] = useState(0);
  const [highlightDocumentUrl, setHighlightDocumentUrl] = useState<
    string | null
  >(null);
  const [highlightCaseId, setHighlightCaseId] = useState<string | null>(null);
  const [activeSiteVisitLeadId, setActiveSiteVisitLeadId] = useState<string | null>(
    () => authClient?.leadId || localStorage.getItem("leadId"),
  );
  const [notifications, setNotifications] = useState<PortalNotification[]>(
    () => {
      const initialNotificationOwnerId =
        authClient?.contactId ||
        localStorage.getItem("contactId") ||
        authClient?.leadId ||
        localStorage.getItem("leadId") ||
        "";
      if (!initialNotificationOwnerId) return [];
      return readStoredNotifications(
        getCustomerNotificationStorageKeys(initialNotificationOwnerId).list,
      );
    },
  );
  const [selectedProjectId, setSelectedProjectIdState] = useState<
    string | null
  >(() => {
    const initialContactId =
      authClient?.contactId || localStorage.getItem("contactId") || "";
    return initialContactId
      ? readStoredSelectedProjectId(initialContactId)
      : null;
  });
  // Persists the chosen project so a page reload keeps showing it instead of
  // silently falling back to the contact's first project.
  const setSelectedProjectId = (projectId: string | null) => {
    setSelectedProjectIdState(projectId);
    const currentContactId =
      authClient?.contactId || localStorage.getItem("contactId") || "";
    if (currentContactId) {
      writeStoredSelectedProjectId(currentContactId, projectId);
    }
  };

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
  }

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
  const resolvedClientName = client?.name || authClient?.name || "";
  const resolvedClientEmail = client?.email || authClient?.email || "";
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
    projects.find((project) => project.id === selectedProjectId) || projects[0];
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
  const profileContactId =
    client?.type === "Contact" && client.id.startsWith("003") ? client.id : "";
  const contactId =
    authClient?.contactId ||
    localStorage.getItem("contactId") ||
    profileContactId;
  const notificationLeadId =
    authClient?.leadId || localStorage.getItem("leadId") || "";
  const effectiveLeadId = portalData?.sourceLeadId || notificationLeadId || "";
  const notificationStorageOwnerId = contactId || effectiveLeadId;

  // Auth data may resolve after the first render. Reload the complete stored
  // history once the customer's stable storage identity becomes available.
  useEffect(() => {
    if (!notificationStorageOwnerId) return undefined;
    const hydration = window.setTimeout(() => {
      const storageKey = getCustomerNotificationStorageKeys(
        notificationStorageOwnerId,
      ).list;
      const storedNotifications = readStoredNotifications(storageKey);
      const validNotifications = storedNotifications.filter(
        (notification) =>
          notification.type !== "siteVisit" ||
          !EMPTY_SITE_VISIT_NOTIFICATION_PATTERN.test(notification.message),
      );
      if (validNotifications.length !== storedNotifications.length) {
        writeStoredNotifications(storageKey, validNotifications);
      }
      setNotifications(validNotifications);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, [notificationStorageOwnerId]);

  // Surface each new appointment that needs a customer decision. The
  // appointment signature is persisted so polling and page reloads cannot
  // create duplicate notifications for the same proposed date/time.
  useEffect(() => {
    if (!effectiveLeadId || !notificationStorageOwnerId) return undefined;

    async function checkSiteVisitAppointment() {
      let storedLeadIds: string[] = [];
      try {
        const stored = JSON.parse(
          window.localStorage.getItem(`areliaProjectLeadIds:${effectiveLeadId}`) || "[]",
        );
        if (Array.isArray(stored)) {
          storedLeadIds = stored.filter((id): id is string => typeof id === "string");
        }
      } catch {
        /* Ignore malformed legacy project IDs. */
      }

      const relatedLeadIds = Array.from(new Set([effectiveLeadId, ...storedLeadIds]));
      const appointments = await Promise.all(
        relatedLeadIds.map(async (leadId) => ({
          leadId,
          appointment: await getSiteVisitAppointment(leadId),
        })),
      );

      const newNotifications: PortalNotification[] = [];
      appointments.forEach(({ leadId, appointment }, index) => {
        const normalizedStatus = appointment.appointmentStatus?.trim().toLowerCase();
        const hasScheduledDateAndTime = Boolean(
          appointment.appointmentDate && appointment.appointmentTimeSlot,
        );
        const needsResponse =
          appointment.success &&
          appointment.appointmentAvailable &&
          appointment.actionRequired &&
          hasScheduledDateAndTime &&
          (normalizedStatus === "pending" ||
            normalizedStatus === "appointment rescheduled");
        if (!needsResponse) return;

        const signature = [
          normalizedStatus,
          appointment.appointmentSentDate,
          appointment.appointmentDate,
          appointment.appointmentTimeSlot,
        ].join("|");
        const seenKey = `portalSiteVisitNotification:${notificationStorageOwnerId}:${leadId}`;
        if (window.localStorage.getItem(seenKey) === signature) return;
        window.localStorage.setItem(seenKey, signature);

        const visitDate = formatDate(appointment.appointmentDate);
        const schedule = [visitDate, appointment.appointmentTimeSlot]
          .filter(Boolean)
          .join(" at ");
        const projectLabel = relatedLeadIds.length > 1 ? `Project ${index + 1}: ` : "";
        const message = schedule
          ? `${projectLabel}A site visit appointment for ${schedule} is waiting for your approval or reschedule request.`
          : `${projectLabel}A site visit appointment is waiting for your approval or reschedule request.`;
        newNotifications.push({
          id: `site-visit-${leadId}-${Date.now()}`,
          type: "siteVisit",
          message,
          timestamp: Date.now(),
          read: false,
          leadId,
        });
      });

      if (newNotifications.length === 0) return;
      setNotifications((previous) => {
        const next = [...newNotifications, ...previous].slice(0, MAX_STORED_NOTIFICATIONS);
        writeStoredNotifications(
          getCustomerNotificationStorageKeys(notificationStorageOwnerId).list,
          next,
        );
        return next;
      });
    }

    void checkSiteVisitAppointment();
    const interval = window.setInterval(
      () => void checkSiteVisitAppointment(),
      NOTIFICATION_POLL_INTERVAL_MS,
    );
    return () => window.clearInterval(interval);
  }, [effectiveLeadId, notificationStorageOwnerId]);

  // Architecture Designs remain in Salesforce as the source of truth. A
  // per-design marker prevents a Sent record from generating duplicate bell
  // notifications across polling cycles or page reloads.
  useEffect(() => {
    if (!contactId || !notificationStorageOwnerId) return undefined;

    async function checkDesignApprovals() {
      const result = await getDesignApprovals(contactId);
      if (!result.success) return;

      const pending = result.designs.filter(
        (design) => design.canApprove || design.canRequestChanges,
      );
      const additions: PortalNotification[] = [];
      for (const design of pending) {
        const seenKey = `portalDesignNotification:${notificationStorageOwnerId}:${design.id}`;
        if (window.localStorage.getItem(seenKey) === design.status) continue;
        window.localStorage.setItem(seenKey, design.status);
        additions.push({
          id: `design-${design.id}`,
          type: "design",
          message: `${design.projectName || "Your project"}: a 3D design is ready for your approval or review changes request.`,
          timestamp: design.createdDate ? new Date(design.createdDate).getTime() : Date.now(),
          read: false,
          projectId: design.opportunityId,
          projectName: design.projectName,
        });
      }
      if (additions.length === 0) return;
      setNotifications((previous) => {
        const next = [...additions, ...previous].slice(0, MAX_STORED_NOTIFICATIONS);
        writeStoredNotifications(
          getCustomerNotificationStorageKeys(notificationStorageOwnerId).list,
          next,
        );
        return next;
      });
    }

    void checkDesignApprovals();
    const interval = window.setInterval(
      () => void checkDesignApprovals(),
      NOTIFICATION_POLL_INTERVAL_MS,
    );
    return () => window.clearInterval(interval);
  }, [contactId, notificationStorageOwnerId]);

  // Polls the same data the individual tabs already fetch on their own, so a
  // status/vendor/payment/document change is surfaced as a notification even
  // if the client never visits that tab during this session.
  const notificationProjectKey = useMemo(
    () => contactProjects.map((project) => project.id || project.projectName).join("|"),
    [contactProjects],
  );

  useEffect(() => {
    if (!contactId || contactProjects.length === 0) return undefined;

    async function checkForUpdates() {
      const [statusRes, supportCases] = await Promise.all([
        getProjectStatus(contactId),
        getSupportCases(contactId),
      ]);

      const projectsList = statusRes?.success ? statusRes.projects : [];
      const casesList = Array.isArray(supportCases) ? supportCases : [];
      const allEntries: NotificationEntry[] = [];

      await Promise.all(
        contactProjects.map(async (project) => {
          const projectId = project.id || project.projectName;
          const projectName = project.projectName;
          const keys = getNotificationStorageKeys(contactId, projectId);

          const [terms, files] = await Promise.all([
            projectName ? getPaymentTerms(projectName) : Promise.resolve(null),
            projectId ? getProjectFiles(projectId) : Promise.resolve(null),
          ]);

          const matchingProject = projectsList.find(
            (candidate) =>
              (candidate.id || candidate.projectName) === projectId,
          );

          const termsList = Array.isArray(terms) ? terms : [];
          const filesList = Array.isArray(files) ? files : [];
          const vendorTasksByVendor: Record<string, ProjectVendorTask[]> = {};

          if (projectId && matchingProject?.vendors?.length) {
            const vendorTaskResults = await Promise.all(
              matchingProject.vendors.map(async (vendor) => {
                const vendorResponse = await getVendorTasks(
                  projectId,
                  vendor.vendorName,
                );
                return [
                  vendor.vendorName,
                  Array.isArray(vendorResponse?.tasks)
                    ? vendorResponse.tasks
                    : [],
                ] as const;
              }),
            );

            vendorTaskResults.forEach(([vendorName, tasks]) => {
              vendorTasksByVendor[vendorName] = tasks;
            });
          }

          const previousSnapshot = readNotificationSnapshot(keys.snapshot);
          const freshSnapshot = buildNotificationSnapshot(
            matchingProject,
            vendorTasksByVendor,
            termsList,
            filesList,
            casesList,
          );

          // Salesforce's file/case list endpoints can return an incomplete
          // result for a single poll (a slow related-list query, a flaky
          // endpoint, a project still resolving) even though nothing actually
          // changed. If we replaced the snapshot outright with that poll's
          // fetch, an entry missing from just one poll would vanish from the
          // baseline and then look brand new the next time the API returned it
          // — reviving notifications the client had already cleared. Instead we
          // merge each poll's fresh data into the running baseline: fresh values
          // win when present, but nothing already seen is ever dropped, so a
          // vendor/payment/document/case can only be flagged "new" once, ever.
          const nextSnapshot: NotificationSnapshot = {
            projectStatus:
              freshSnapshot.projectStatus ?? previousSnapshot?.projectStatus,
            completionPercentage:
              freshSnapshot.completionPercentage ??
              previousSnapshot?.completionPercentage,
            vendors: {
              ...(previousSnapshot?.vendors || {}),
              ...freshSnapshot.vendors,
            },
            vendorCategories: {
              ...(previousSnapshot?.vendorCategories || {}),
              ...freshSnapshot.vendorCategories,
            },
            vendorStatuses: {
              ...(previousSnapshot?.vendorStatuses || {}),
              ...freshSnapshot.vendorStatuses,
            },
            vendorTasks: {
              ...(previousSnapshot?.vendorTasks || {}),
              ...freshSnapshot.vendorTasks,
            },
            paymentTerms: {
              ...(previousSnapshot?.paymentTerms || {}),
              ...freshSnapshot.paymentTerms,
            },
            documents: mergeNotificationDocuments(
              previousSnapshot?.documents || [],
              freshSnapshot.documents,
            ),
            cases: { ...(previousSnapshot?.cases || {}), ...freshSnapshot.cases },
          };
          writeNotificationSnapshot(keys.snapshot, nextSnapshot);

          const diffs = previousSnapshot
            ? diffNotificationSnapshots(
                previousSnapshot,
                nextSnapshot,
                projectName,
              ).map((entry) => ({
                ...entry,
                projectId,
                projectName,
              }))
            : [];

          const PAYMENT_DUE_DAYS = 30;
          const today = new Date().toISOString().slice(0, 10);
          const paymentDueSeenKey = `portalPaymentDueSeen:${contactId}:${projectId}`;
          let seenData: { date: string; seen: string[] } = { date: "", seen: [] };
          try {
            const raw = window.localStorage.getItem(paymentDueSeenKey);
            if (raw) seenData = JSON.parse(raw) as { date: string; seen: string[] };
          } catch {
            /* ignore parse errors */
          }
          const seenToday = seenData.date === today ? seenData.seen : [];
          const paymentDueEntries: NotificationEntry[] = [];

          termsList.forEach((term) => {
            if (!term.dueDate || term.paymentReceived) return;
            const daysUntilDue = Math.ceil(
              (new Date(term.dueDate).getTime() - Date.now()) /
                (24 * 60 * 60 * 1000),
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
            paymentDueEntries.push(
              {
                ...annotateNotificationWithProject(
                  { type: "paymentDue", message },
                  projectName,
                ),
                projectId,
                projectName,
              },
            );
          });

          if (paymentDueEntries.length > 0) {
            window.localStorage.setItem(
              paymentDueSeenKey,
              JSON.stringify({ date: today, seen: seenToday }),
            );
          }

          allEntries.push(...diffs, ...paymentDueEntries);
        }),
      );

      if (allEntries.length === 0) return;

      setNotifications((prev) => {
        const newEntries: PortalNotification[] = allEntries.map(
          (entry, index) => ({
            id: `${Date.now()}-${index}`,
            type: entry.type,
            message: entry.message,
            documentUrl: entry.documentUrl,
            caseId: entry.caseId,
            projectId: entry.projectId,
            projectName: entry.projectName,
            timestamp: Date.now(),
            read: false,
          }),
        );
        const merged = [...newEntries, ...prev].slice(
          0,
          MAX_STORED_NOTIFICATIONS,
        );
        writeStoredNotifications(
          getCustomerNotificationStorageKeys(contactId).list,
          merged,
        );
        return merged;
      });
    }

    void checkForUpdates();
    const interval = window.setInterval(() => {
      void checkForUpdates();
    }, NOTIFICATION_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [contactId, contactProjects, notificationProjectKey]);

  const desktopNavItems = [
    { id: "profile", label: "Profile & Overview", icon: FiUserCheck },
    { id: "projectDetails", label: "Project Details", icon: FiHome },
    { id: "siteVisit", label: "Site Visit Appointment & Report", icon: FiCalendar },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "approvals", label: "Approvals", icon: FiCheckCircle },
    { id: "status", label: "Project Status", icon: FiCalendar },
    { id: "vendor", label: "Vendor Tasks", icon: FiBriefcase },
    { id: "payment", label: "Payment Terms", icon: FiCreditCard },
    { id: "documents", label: "Documents & Reports", icon: FiFileText },
    { id: "cases", label: "Support Cases", icon: FiHeadphones },
  ] as const;

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/login", { replace: true });
  };

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const unreadNotificationLabel = formatNotificationCount(
    unreadNotificationCount,
  );

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
      if (notificationStorageOwnerId) {
        writeStoredNotifications(
          getCustomerNotificationStorageKeys(notificationStorageOwnerId).list,
          updated,
        );
      }
      return updated;
    });
    if (notification.projectId) {
      setSelectedProjectId(notification.projectId);
    }
    if (notification.type === "siteVisit" && notification.leadId) {
      setActiveSiteVisitLeadId(notification.leadId);
    }
    setIsNotificationPanelOpen(false);
    if (notification.type === "documents" && notification.documentUrl) {
      setHighlightDocumentUrl(notification.documentUrl);
      handleTabChange("documents");
      return;
    }
    if (notification.type === "cases" && notification.caseId) {
      setHighlightCaseId(notification.caseId);
      handleTabChange("cases");
      return;
    }
    handleTabChange(
      notification.type === "paymentDue"
        ? "payment"
        : notification.type === "design"
          ? "approvals"
        : notification.type === "siteVisit"
          ? "siteVisit"
          : notification.type,
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== notificationId);
      if (notificationStorageOwnerId) {
        writeStoredNotifications(
          getCustomerNotificationStorageKeys(notificationStorageOwnerId).list,
          updated,
        );
      }
      return updated;
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      if (notificationStorageOwnerId) {
        writeStoredNotifications(
          getCustomerNotificationStorageKeys(notificationStorageOwnerId).list,
          updated,
        );
      }
      return updated;
    });
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
        projectName={activeProjectName}
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
        }))}
        onCaseCreated={() =>
          setSupportCasesRefreshKey((current) => current + 1)
        }
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
                onDeleteNotification={handleDeleteNotification}
              />

            <AccountMenu
              wrapperClassName="dashboardMobileBar__account"
              isOpen={isProfileMenuOpen}
              onToggle={() => setIsProfileMenuOpen((value) => !value)}
              onClose={() => setIsProfileMenuOpen(false)}
              clientName={resolvedClientName}
              clientEmail={resolvedClientEmail}
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
                  const notificationBadge =
                    item.id === "notifications" ? unreadNotificationLabel : null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`dashboardMobileDrawer__link${isActive ? " is-active" : ""}`}
                      onClick={() => handleTabChange(item.id)}
                    >
                      <Icon />
                      <span className="dashboardMobileDrawer__linkLabel">
                        {item.label}
                      </span>
                      {notificationBadge ? (
                        <span className="dashboardNavBadge">
                          {notificationBadge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="dashboardMobileDrawer__link dashboardMobileDrawer__link--support"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSupportModalOpen(true);
                  }}
                >
                  <FiPhone />
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
              const notificationBadge =
                item.id === "notifications" ? unreadNotificationLabel : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dashboardRail__link${isActive ? " is-active" : ""}`}
                  onClick={() => handleTabChange(item.id)}
                >
                  <Icon />
                  <span className="dashboardRail__linkLabel">{item.label}</span>
                  {notificationBadge ? (
                    <span className="dashboardNavBadge">
                      {notificationBadge}
                    </span>
                  ) : null}
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
                onDeleteNotification={handleDeleteNotification}
              />

              <AccountMenu
                isOpen={isProfileMenuOpen}
                onToggle={() => setIsProfileMenuOpen((value) => !value)}
                onClose={() => setIsProfileMenuOpen(false)}
              clientName={resolvedClientName}
              clientEmail={resolvedClientEmail}
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
                          {getInitials(resolvedClientName)}
                        </span>
                        <div className="dashboardHero__copy dashboardHero__copy--minimal">
                          <p className="dashboardHero__eyebrow">
                            Client Portal
                          </p>
                          <h1 className="dashboardHero__title">
                            Welcome back
                            {resolvedClientName ? (
                              <>
                                ,
                                <span className="dashboardHero__titleName">
                                  {resolvedClientName}
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
                        <div className="dashboardSection__profileActions">
                          {projects.length > 1 ? (
                            <span className="dashboardSection__chip">
                              {projects.length} active projects
                            </span>
                          ) : null}
                          {authClient?.leadId ? (
                            <button
                              type="button"
                              className="dashboardAddProjectButton"
                              onClick={() => {
                                setAddProjectRequestKey((value) => value + 1);
                                handleTabChange("projectDetails");
                              }}
                            >
                              <FiHome /> Add Project
                            </button>
                          ) : null}
                        </div>
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
                                    selectProject(project.id);
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
                                      Access live progress, budget checkpoints,
                                      milestone updates, and the private project
                                      archive.
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
                              whileHover={{
                                x: 3,
                                transition: { duration: 0.2 },
                              }}
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

                {deferredDashboardTab === "siteVisit" ? (
                  <SiteVisitTab
                    key={activeSiteVisitLeadId || effectiveLeadId || activeProjectId || contactId || "site-visit"}
                    leadId={activeSiteVisitLeadId || effectiveLeadId || undefined}
                    primaryLeadId={effectiveLeadId || activeSiteVisitLeadId || undefined}
                    opportunityId={activeProjectId}
                    contactId={contactId}
                  />
                ) : null}

                {deferredDashboardTab === "projectDetails" ? (
                  <ProjectDetailsTab
                    leadId={effectiveLeadId || undefined}
                    opportunityId={activeProjectId}
                    contactId={contactId}
                    customer={client}
                    addProjectRequestKey={addProjectRequestKey}
                  />
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
                    highlightDocumentUrl={highlightDocumentUrl}
                    onHighlightHandled={() => setHighlightDocumentUrl(null)}
                  />
                ) : null}
                {deferredDashboardTab === "notifications" ? (
                  <NotificationsTab
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                    onDeleteNotification={handleDeleteNotification}
                    onNavigate={handleTabChange}
                  />
                ) : null}
                {deferredDashboardTab === "approvals" ? (
                  <ApprovalsTab opportunityId={activeProjectId} contactId={contactId} />
                ) : null}
                {deferredDashboardTab === "cases" ? (
                  <CasesTab
                    contactId={contactId}
                    projects={projects.map((project) => ({
                      id: project.id,
                      name: project.name,
                    }))}
                    onNavigate={handleTabChange}
                    highlightCaseId={highlightCaseId}
                    onHighlightHandled={() => setHighlightCaseId(null)}
                    onOpenSupportModal={() => setIsSupportModalOpen(true)}
                    refreshKey={supportCasesRefreshKey}
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

// Labeled select control used in the support case form (category/priority).
function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  options: Array<string | { label: string; value: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { label: option, value: option }
      : option,
  );
  const selectedOption = normalizedOptions.find(
    (option) => option.value === value,
  );

  return (
    <div
      className={`dashboardSupportForm__field dashboardSupportForm__select${
        className ? ` ${className}` : ""
      }`}
    >
      <span>{label}</span>
      <button
        type="button"
        className="dashboardSupportForm__selectTrigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label || placeholder || "Select"}</span>
        <FiChevronDown aria-hidden="true" className={isOpen ? "is-open" : ""} />
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
              {normalizedOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`dashboardSupportForm__selectOption${
                    option.value === value ? " is-active" : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// "Contact Support" modal: form to submit a new support case, then shows the returned case reference number.
function SupportCaseModal({
  isOpen,
  contactId,
  projectId,
  projectName,
  projects,
  onCaseCreated,
  onClose,
}: {
  isOpen: boolean;
  contactId: string;
  projectId?: string;
  projectName?: string;
  projects: Array<{ id: string; name: string }>;
  onCaseCreated?: () => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("General");
  const [otherCategory, setOtherCategory] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);
  const defaultProjectId = projectId || projects[0]?.id || "";
  const effectiveSelectedProjectId = selectedProjectId || defaultProjectId;

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
    setSelectedProjectId("");
    setError("");
    setCaseId(null);
    onClose();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!subject.trim() || !description.trim()) {
      setError("Please fill in both subject and description.");
      return;
    }
    if (category === "Other" && !otherCategory.trim()) {
      setError("Please describe the category.");
      return;
    }
    if (!effectiveSelectedProjectId) {
      setError("Please select a project for this support case.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const res = await createSupportCase({
      contactId,
      projectId: effectiveSelectedProjectId,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category,
      otherCategory: category === "Other" ? otherCategory.trim() : undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      setCaseId(res.caseId || "submitted");
      if (contactId && res.caseId) {
        const storedProjectMap = readSupportCaseProjectMap(contactId);
        const selectedProject = projects.find(
          (project) => project.id === effectiveSelectedProjectId,
        );
        writeSupportCaseProjectMap(contactId, {
          ...storedProjectMap,
          [res.caseId]: {
            projectId: effectiveSelectedProjectId,
            projectName: selectedProject?.name || projectName,
          },
        });
      }
      onCaseCreated?.();
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
                          Check your email for confirmation - our team will
                          contact you soon.
                        </p>
                        <p className="dashboardSupportModal__successMeta">
                          {projects.find((project) => project.id === effectiveSelectedProjectId)
                            ?.name || projectName || "Selected project"}
                          {" · "}Case #{caseId}
                        </p>
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
                        <FormSelect
                          label="Project"
                          value={effectiveSelectedProjectId}
                          options={projects.map((project) => ({
                            label: project.name,
                            value: project.id,
                          }))}
                          onChange={setSelectedProjectId}
                          placeholder="Select a project"
                        />

                        <label className="dashboardSupportForm__field">
                          <span>Subject</span>
                          <input
                            type="text"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
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
                          <p className="dashboardSupportForm__error">{error}</p>
                        ) : null}

                        <button
                          type="submit"
                          className="dashboardProjectSpotlight__cta"
                          disabled={isSubmitting}
                        >
                          <span>
                            {isSubmitting ? "Submitting..." : "Submit Request"}
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

// Formats an ISO/date string as "DD Mon YYYY"; returns the raw value if it can't be parsed.
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

// Pluralizes a day count ("1 day" vs "5 days").
function pluralizeDays(count: number) {
  return `${count} day${count === 1 ? "" : "s"}`;
}

// Computes the total span of a project's start/end dates as a "N days" label.
function getTotalProjectDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return undefined;
  return pluralizeDays(
    Math.max(0, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)),
  );
}

// Labels the time left until a project's end date ("Completed", "Due today", "N days left", etc.).
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
