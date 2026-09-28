import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { PROJECT } from "../config/timings";

export interface ArtifactDef {
  id: string;
  /** Top-left in mockup px (1440×1024). */
  x: number;
  y: number;
  /** Which viewport edge x stays attached to on wider or narrower screens. */
  edge: "left" | "right";
  /** Parallax depth, 0 (still) to 1 (moves PARALLAX_MAX_PX). */
  depth: number;
  node: ReactNode;
}

/**
 * Floating design artifacts around a project page's edges (§10.2), with a
 * subtle mouse parallax. Adding one is one entry in the page's list. Only
 * transform is animated; parallax is off for reduced motion and touch.
 */
export default function Artifacts({ items }: { items: readonly ArtifactDef[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const els = Array.from(ref.current!.children) as HTMLElement[];
    const opts = { duration: PROJECT.PARALLAX_SMOOTHING, ease: PROJECT.PARALLAX_EASE };
    const movers = els.map((el, i) => ({
      x: gsap.quickTo(el, "x", opts),
      y: gsap.quickTo(el, "y", opts),
      depth: items[i].depth,
    }));
    // Viewport size and the mockup-px unit, cached: no layout reads per move.
    let w = 0;
    let h = 0;
    let unit = 1;
    const measure = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      unit = Math.min(w / 1440, h / 1024);
    };
    measure();
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const nx = (e.clientX / w) * 2 - 1;
      const ny = (e.clientY / h) * 2 - 1;
      for (const m of movers) {
        const d = -m.depth * PROJECT.PARALLAX_MAX_PX * unit;
        m.x(nx * d);
        m.y(ny * d);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", measure);
      gsap.killTweensOf(els);
    };
  }, [items]);

  return (
    <div ref={ref} className="artifacts" aria-hidden="true">
      {items.map((a) => (
        <div key={a.id} className={`artifact artifact--${a.edge}`} style={{ "--x": a.x, "--y": a.y } as React.CSSProperties}>
          {a.node}
        </div>
      ))}
    </div>
  );
}
