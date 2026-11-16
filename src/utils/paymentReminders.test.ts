import { describe, expect, it } from "vitest";
import { getPaymentReminder, paymentReminderDate } from "./paymentReminders";

const term = { id: "first", label: "First Instalment", dueDate: "2026-11-12", paymentReceived: false };

describe("payment reminders", () => {
  it("changes from due today to overdue at midnight in India", () => {
    const before = new Date("2026-11-12T18:29:59Z");
    const after = new Date("2026-11-12T18:30:00Z");
    expect(paymentReminderDate(before)).toBe("2026-11-12");
    expect(paymentReminderDate(after)).toBe("2026-11-13");
    expect(getPaymentReminder(term, before)).toBe('"First Instalment" payment is due today.');
    expect(getPaymentReminder(term, after)).toBe('"First Instalment" payment is overdue by 1 day.');
    expect(getPaymentReminder(term, new Date("2026-11-14T06:00:00Z"))).toBe('"First Instalment" payment is overdue by 2 days.');
  });

  it("does not remind for received payments or missing and invalid dates", () => {
    const now = new Date("2026-11-13T06:00:00Z");
    expect(getPaymentReminder({ ...term, paymentReceived: true }, now)).toBeNull();
    for (const dueDate of [undefined, "invalid", "2026-02-30"]) {
      expect(getPaymentReminder({ ...term, dueDate }, now)).toBeNull();
    }
  });

  it("preserves tomorrow and the 30 day advance reminder window", () => {
    expect(getPaymentReminder(term, new Date("2026-11-11T06:00:00Z"))).toContain("due tomorrow");
    expect(getPaymentReminder(term, new Date("2026-10-13T06:00:00Z"))).toContain("due in 30 days");
    expect(getPaymentReminder(term, new Date("2026-10-12T06:00:00Z"))).toBeNull();
  });
});
