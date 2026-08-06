import { describe, expect, it } from "vitest";
import { annotateNotificationWithProject } from "./customerNotifications";

describe("annotateNotificationWithProject", () => {
  it("prefixes project names into notification messages", () => {
    const entry = annotateNotificationWithProject(
      { type: "status", message: "Project status changed." },
      "Project A",
    );

    expect(entry.message).toBe("[Project A] Project status changed.");
  });

  it("avoids double-prefixing when the message already includes the project name", () => {
    const entry = annotateNotificationWithProject(
      { type: "status", message: "[Project B] Status changed." },
      "Project B",
    );

    expect(entry.message).toBe("[Project B] Status changed.");
  });
});
