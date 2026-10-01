/**
 * The station pages' vertical lines extend like a train leaving a station
 * (user request): constant acceleration up to top speed, a cruise, then
 * constant braking to a stop at the line's end. Short lines never reach top
 * speed (a triangle velocity profile instead of a trapezoid). The duration
 * comes from the length, so every line moves at the same speeds.
 *
 * The line is a thin element grown with scaleY from its top (compositor only).
 */
import { gsap } from "./gsap";
import { pxScale } from "./frame";
import { LINE } from "../config/timings";
import { prefersReducedMotion } from "./motion";
import { whenPageShown } from "./pageReveal";

interface Profile {
  /** Seconds. */
  duration: number;
  /** Progress (0..1 of the length) at time fraction t. */
  ease: (t: number) => number;
}

/** Motion profile for a line `length` mockup px long. */
export function trainProfile(length: number, accel: number = LINE.ACCEL_PX_S2, top: number = LINE.TOP_SPEED_PX_S): Profile {
  if (length <= 0) return { duration: 0, ease: (t) => t };
  // Peak speed: top speed, unless the line is too short to reach it.
  const v = Math.min(top, Math.sqrt(length * accel));
  const ta = v / accel; // time spent accelerating (and braking)
  const da = (v * ta) / 2; // distance covered accelerating (and braking)
  const tc = (length - 2 * da) / v; // cruise time
  const duration = 2 * ta + tc;
  const ease = (t: number) => {
    const s = t * duration;
    let d: number;
    if (s <= ta) d = 0.5 * accel * s * s;
    else if (s <= ta + tc) d = da + v * (s - ta);
    else {
      const r = Math.max(0, duration - s); // time left until the stop
      d = length - 0.5 * accel * r * r;
    }
    return d / length;
  };
  return { duration, ease };
}

/**
 * Drop `el` in (scaleY 0 → 1 from its top) once the page is on screen.
 * Returns a cleanup that kills the tween.
 */
export function trainDrop(el: HTMLElement): () => void {
  if (prefersReducedMotion()) {
    gsap.set(el, { scaleY: 1 });
    return () => {};
  }
  gsap.set(el, { scaleY: 0, transformOrigin: "50% 0%" });
  let tween: gsap.core.Tween | null = null;
  let alive = true;
  void whenPageShown().then(() => {
    if (!alive) return;
    const { duration, ease } = trainProfile(el.offsetHeight / pxScale());
    tween = gsap.to(el, { scaleY: 1, duration, ease, delay: LINE.DELAY });
  });
  return () => {
    alive = false;
    tween?.kill();
  };
}
