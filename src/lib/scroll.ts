/**
 * Smooth wheel scrolling (Lenis, added at the user's request). Module-level
 * singleton on the window scroller, driven by the GSAP ticker so scroll
 * frames and tweens land in the same frame. Touch stays native (iOS momentum,
 * and no fight with the obstacle Draggable). Reduced motion: no Lenis at all.
 */
import Lenis from "lenis";
import { gsap } from "./gsap";
import { prefersReducedMotion } from "./motion";
import { SCROLL } from "../config/timings";

let lenis: Lenis | null = null;

export function initScroll(): void {
  if (lenis || prefersReducedMotion()) return;
  lenis = new Lenis({
    autoRaf: false,
    lerp: SCROLL.LERP,
    wheelMultiplier: SCROLL.WHEEL_MULTIPLIER,
    syncTouch: false,
  });
  const l = lenis;
  gsap.ticker.add((time) => l.raf(time * 1000));
  if (import.meta.env.DEV) (window as unknown as { __lenis: Lenis }).__lenis = l;
}

/** Jump to the top with no glide (a plain window.scrollTo mid-glide would be
 *  pulled back toward Lenis's old target). */
export function resetScroll(): void {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

/** Stops any glide and swallows wheel input until unlockScroll(). */
export const lockScroll = () => lenis?.stop();
export const unlockScroll = () => lenis?.start();

/** Scroll position and how far the page can scroll (0 = it doesn't). */
export type ScrollState = { scroll: number; limit: number };

/** Calls back on every scroll frame. Lenis keeps `limit` cached (its own
 *  ResizeObserver), so this reads no layout; without Lenis (reduced motion)
 *  it falls back to a passive native listener. Returns an unsubscribe. */
export function onScroll(cb: (s: ScrollState) => void): () => void {
  if (lenis) return lenis.on("scroll", (l) => cb({ scroll: l.scroll, limit: l.limit }));
  const root = document.documentElement;
  const onNative = () => cb({ scroll: window.scrollY, limit: root.scrollHeight - window.innerHeight });
  window.addEventListener("scroll", onNative, { passive: true });
  return () => window.removeEventListener("scroll", onNative);
}
