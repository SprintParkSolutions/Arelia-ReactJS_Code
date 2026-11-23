import type { ProjectStatusRecord } from "../services/salesforceApi";

export const PROJECT_COMPLETION_MESSAGE = "Project Successfully Completed \u{1F389}\nCongratulations! Your project has been successfully completed. Thank you for trusting Arelia and allowing us to bring your vision to life. We truly appreciate your cooperation and support throughout the journey.";

export function projectCompletionMessage(projectName?: string): string {
  const name = projectName?.trim();
  return `${name ? `[${name}] ` : ""}${PROJECT_COMPLETION_MESSAGE}`;
}

// Repair browser-saved messages without changing their read state or replaying confetti.
export function normalizeProjectCompletionNotification<T extends { message: string; projectName?: string }>(entry: T): T {
  const prefix = entry.projectName?.trim() ? `[${entry.projectName.trim()}] ` : "";
  const message = prefix && entry.message.startsWith(prefix)
    ? entry.message.slice(prefix.length)
    : entry.message;
  if (!message.startsWith("Project Successfully Completed")) return entry;
  return { ...entry, message: projectCompletionMessage(entry.projectName) };
}

// Keep this marker separate from notification history: deleting a notification
// must not replay the celebration. Scope it to the customer and Salesforce ID.
export function claimProjectCompletion(
  contactId: string,
  project: Pick<ProjectStatusRecord, "id" | "projectStatus">,
): boolean {
  if (!contactId || !project.id || project.projectStatus?.trim().toLowerCase() !== "completed") return false;
  const key = `portalProjectCompletedSeen:${contactId}:${project.id}`;
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "true");
    return true;
  } catch {
    // Without persistent storage, polling would otherwise replay the effect.
    return false;
  }
}
