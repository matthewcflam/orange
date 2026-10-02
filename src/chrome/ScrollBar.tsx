import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "../lib/gsap";
import { onScroll } from "../lib/scroll";
import { prefersReducedMotion } from "../lib/motion";
import { SCROLLBAR } from "../config/timings";
import "./scrollbar.css";

/**
 * A thin scroll thumb in place of the native scrollbar (hidden on mouse
 * devices in global.css, so a page that scrolls never narrows the layout).
 * Display only: it fades in while scrolling and out after SCROLLBAR.IDLE, and
 * never shows on a page that doesn't scroll. Per frame it writes one
 * transform and reads no layout.
 */
export default function ScrollBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const setY = gsap.quickSetter(el, "y", "px");
    const reduced = prefersReducedMotion();
    let vh = window.innerHeight;
    let thumb = -1;
    let shown = false;

    const fade = (on: boolean) => {
      if (on === shown) return;
      shown = on;
      gsap.to(el, {
        opacity: on ? SCROLLBAR.OPACITY : 0,
        duration: reduced ? 0 : on ? SCROLLBAR.FADE_IN : SCROLLBAR.FADE_OUT,
        ease: on ? "power2.out" : "power2.in",
        overwrite: true,
      });
    };
    const hideLater = gsap.delayedCall(SCROLLBAR.IDLE, () => fade(false)).pause();

    const onResize = () => (vh = window.innerHeight);
    window.addEventListener("resize", onResize, { passive: true });

    const off = onScroll(({ scroll, limit }) => {
      if (limit <= 0) {
        hideLater.pause();
        fade(false);
        return;
      }
      const track = vh - 2 * SCROLLBAR.INSET_PX;
      const h = Math.round(Math.max(SCROLLBAR.MIN_THUMB_PX, (track * vh) / (limit + vh)));
      // Only changes with the page's height, not per frame.
      if (h !== thumb) {
        thumb = h;
        el.style.height = `${h}px`;
      }
      const p = Math.min(1, Math.max(0, scroll / limit));
      setY(SCROLLBAR.INSET_PX + p * (track - thumb));
      fade(true);
      hideLater.restart(true);
    });

    return () => {
      off();
      hideLater.kill();
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf(el);
    };
  }, []);

  return createPortal(
    <div
      ref={ref}
      className="scrollbar"
      aria-hidden="true"
      style={{ "--scrollbar-w": SCROLLBAR.WIDTH_PX, "--scrollbar-inset": SCROLLBAR.INSET_PX } as React.CSSProperties}
    />,
    document.body,
  );
}
