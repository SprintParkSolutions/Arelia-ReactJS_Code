import type { PaymentTerm } from "../services/salesforceApi";

// Payment due dates are calendar dates in the business timezone, not instants.
export function paymentReminderDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getPaymentReminder(term: PaymentTerm, now = new Date()): string | null {
  if (term.paymentReceived || !term.dueDate) return null;
  const dueDate = term.dueDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const dueTime = Date.parse(`${dueDate}T00:00:00Z`);
  if (!Number.isFinite(dueTime) || new Date(dueTime).toISOString().slice(0, 10) !== dueDate) return null;
  const days = Math.round((dueTime - Date.parse(`${paymentReminderDate(now)}T00:00:00Z`)) / 86400000);
  if (days > 30) return null;
  const label = term.label || term.name || "Payment";
  if (days < 0) {
    const overdue = Math.abs(days);
    return `"${label}" payment is overdue by ${overdue} ${overdue === 1 ? "day" : "days"}.`;
  }
  if (days === 0) return `"${label}" payment is due today.`;
  if (days === 1) return `"${label}" payment is due tomorrow.`;
  return `"${label}" payment is due in ${days} days.`;
}
