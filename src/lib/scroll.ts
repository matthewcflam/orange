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
