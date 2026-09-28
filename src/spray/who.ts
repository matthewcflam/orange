/**
 * When "who?" sprays (spec §7.2). Home remounts on every visit, so its engine
 * attaches here and this module decides:
 * - First arrival after the gate: the gate → home timeline calls
 *   introSpray() at GATE.WHO_DELAY.
 * - Later arrivals: once the page transition finishes, respray faster.
 *   TODO(open-question #2): placeholder is a faster respray on every return.
 *   whenIdle() resolves after Palimpsest's tunnel exit.
 * - Reduced motion: the finished picture, instantly and silently.
 */
import { SPRAY } from "../config/timings";
import { prefersReducedMotion } from "../lib/motion";
import { whenIdle } from "../lib/router";
import type { SprayEngine } from "./sprayEngine";

let engine: SprayEngine | null = null;
/** The gate intro owns the first spray until it reaches WHO_DELAY. */
let introPending = true;
let sprayedOnce = false;

function run(e: SprayEngine) {
  const speed = sprayedOnce ? SPRAY.RESPRAY_SPEED : 1;
  sprayedOnce = true;
  e.spray({ speed, instant: prefersReducedMotion() });
}

/** Home mounted. Returns the detach function for unmount. */
export function attachWho(e: SprayEngine): () => void {
  engine = e;
  if (!introPending) {
    void whenIdle().then(() => {
      if (engine === e) run(e);
    });
  }
  return () => {
    if (engine === e) engine = null;
  };
}

/** Gate → home, at GATE.WHO_DELAY. If Home is gone by then, the next visit sprays in full. */
export function introSpray(): void {
  introPending = false;
  if (engine) run(engine);
}

/** Deep link: the intro never reaches home, so the first visit sprays on its own. */
export function skipIntroSpray(): void {
  introPending = false;
}
