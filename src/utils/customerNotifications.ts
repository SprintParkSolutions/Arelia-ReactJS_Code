export type CustomerNotificationEntry = {
  type: "status" | "vendor" | "payment" | "paymentDue" | "documents" | "cases";
  message: string;
  documentUrl?: string;
  caseId?: string;
};

export function annotateNotificationWithProject(
  entry: CustomerNotificationEntry,
  projectName?: string,
): CustomerNotificationEntry {
  if (!projectName) return entry;

  const normalizedProjectName = projectName.trim();
  if (!normalizedProjectName) return entry;

  const hasProjectPrefix = entry.message.includes(`[${normalizedProjectName}]`);
  if (hasProjectPrefix) return entry;

  return {
    ...entry,
    message: `[${normalizedProjectName}] ${entry.message}`,
  };
}
