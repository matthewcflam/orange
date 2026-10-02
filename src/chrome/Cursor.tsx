import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../lib/gsap";
import { CURSOR } from "../config/timings";
import { prefersReducedMotion } from "../lib/motion";
import "./cursor.css";

/** What counts as clickable: the ring shows over these. */
const CLICKABLE = 'a[href]:not([aria-current]), button:not(:disabled), [role="button"]';

/**
 * Replaces the native cursor with a dot that opens into a hollow ring over
 * anything clickable (Downloads/image 65 and 66). Mouse only: touch devices
 * keep the native behaviour. Follows the pointer exactly, with no lag.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const dotScale = CURSOR.DOT_PX / CURSOR.RING_PX;
    gsap.set(el, { scale: dotScale });
    const setX = gsap.quickSetter(el, "x", "px");
    const setY = gsap.quickSetter(el, "y", "px");
    const root = document.documentElement;
    let ring = false;
    let shown = false;

    const setRing = (on: boolean) => {
      if (on === ring) return;
      ring = on;
      gsap.to(el, {
        scale: on ? 1 : dotScale,
        backgroundColor: on ? "rgba(255,255,255,0)" : "rgba(255,255,255,1)",
        duration: prefersReducedMotion() ? 0 : CURSOR.GROW,
        ease: CURSOR.GROW_EASE,
        overwrite: true,
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setX(e.clientX);
      setY(e.clientY);
      if (!shown) {
        shown = true;
        el.style.visibility = "visible";
        root.classList.add("has-cursor");
      }
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setRing(e.target instanceof Element && e.target.closest(CLICKABLE) !== null);
    };
    // Left the window: hide until the next move.
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      shown = false;
      el.style.visibility = "hidden";
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      root.classList.remove("has-cursor");
      gsap.killTweensOf(el);
    };
  }, []);

  return createPortal(
    <div
      ref={ref}
      className="cursor"
      aria-hidden="true"
      style={{ "--cursor-ring": CURSOR.RING_PX, "--cursor-stroke": CURSOR.RING_STROKE_PX } as React.CSSProperties}
    />,
    document.body,
  );
}
