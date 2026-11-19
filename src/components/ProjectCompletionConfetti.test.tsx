import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProjectCompletionConfetti } from "./ProjectCompletionConfetti";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it("cleans up confetti and does not replay the same celebration on rerender", () => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  const view = render(<ProjectCompletionConfetti celebration={0} />);
  expect(document.querySelector(".projectCompletionConfetti")).toBeNull();
  view.rerender(<ProjectCompletionConfetti celebration={1} />);
  expect(document.querySelectorAll(".projectCompletionConfetti i")).toHaveLength(72);
  act(() => vi.advanceTimersByTime(5500));
  expect(document.querySelector(".projectCompletionConfetti")).toBeNull();
  view.rerender(<ProjectCompletionConfetti celebration={1} />);
  expect(document.querySelector(".projectCompletionConfetti")).toBeNull();
});
it("respects reduced motion", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render(<ProjectCompletionConfetti celebration={1} />);
  expect(document.querySelector(".projectCompletionConfetti")).toBeNull();
});
