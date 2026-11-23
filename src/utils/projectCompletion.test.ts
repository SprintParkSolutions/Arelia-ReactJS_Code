import { beforeEach, expect, it } from "vitest";
import { claimProjectCompletion, projectCompletionMessage, normalizeProjectCompletionNotification } from "./projectCompletion";

beforeEach(() => localStorage.clear());
it("claims completion once per customer/project, including after reopening", () => {
  const project = { id: "project-a", projectStatus: "In Progress" };
  expect(claimProjectCompletion("contact-a", project)).toBe(false);
  project.projectStatus = "Completed";
  expect(claimProjectCompletion("contact-a", project)).toBe(true);
  expect(claimProjectCompletion("contact-a", { ...project })).toBe(false);
  expect(claimProjectCompletion("contact-a", { ...project, projectStatus: "In Progress" })).toBe(false);
  expect(claimProjectCompletion("contact-a", project)).toBe(false);
  expect(claimProjectCompletion("contact-a", { ...project, id: "project-b" })).toBe(true);
  expect(claimProjectCompletion("contact-b", project)).toBe(true);
});
it("ignores absent status and customer/project identity", () => {
  expect(claimProjectCompletion("a", { id: "p" })).toBe(false);
  expect(claimProjectCompletion("", { id: "p", projectStatus: "Completed" })).toBe(false);
  expect(claimProjectCompletion("a", { id: "", projectStatus: "Completed" })).toBe(false);
});

it("includes the project name and repairs saved question marks without losing history", () => {
  const saved = { message: "Project Successfully Completed ??\nCongratulations!", projectName: "Project 1", read: true, timestamp: 123 };
  const repaired = normalizeProjectCompletionNotification(saved);
  expect(repaired.message).toBe(projectCompletionMessage("Project 1"));
  expect(repaired.message).toContain("[Project 1] Project Successfully Completed \u{1F389}");
  expect(repaired).toMatchObject({ read: true, timestamp: 123 });
  expect(normalizeProjectCompletionNotification(repaired)).toEqual(repaired);
  const other = { message: "Project status changed", projectName: "Project 1" };
  expect(normalizeProjectCompletionNotification(other)).toBe(other);
});

it("updates previously saved project-prefixed exclamation headings", () => {
  const saved = { message: "[Project 1] Project Successfully Completed !!\nCongratulations!", projectName: "Project 1", read: true };
  expect(normalizeProjectCompletionNotification(saved)).toEqual({ ...saved, message: projectCompletionMessage("Project 1") });
});
