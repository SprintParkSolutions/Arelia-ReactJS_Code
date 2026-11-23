import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import "./ProjectCompletionConfetti.css";

export function ProjectCompletionConfetti({ celebration }: { celebration: number }) {
  if (!celebration || typeof window === "undefined") return null;
  return <ConfettiBurst key={celebration} />;
}

function ConfettiBurst() {
  const [visible, setVisible] = useState(
    () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setVisible(false), 5500);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;
  return createPortal(
    <div className="projectCompletionConfetti" aria-hidden="true">
      {Array.from({ length: 72 }, (_, index) => (
        <i key={index} style={{
          "--x": `${(index * 37) % 101}vw`,
          "--drift": `${((index * 19) % 240) - 120}px`,
          "--delay": `${(index % 12) * 0.09}s`,
          "--duration": `${3.2 + (index % 7) * 0.18}s`,
          "--turn": `${360 + (index % 5) * 180}deg`,
          "--color": ["#d7b475", "#e7cfa4", "#f2ece0", "#a88549"][index % 4],
        } as CSSProperties} />
      ))}
    </div>, document.body,
  );
}
