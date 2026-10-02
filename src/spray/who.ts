/**
 * When "who?" sprays (spec §7.2). Home remounts on every visit, so its engine
 * attaches here and this module decides:
 * - First arrival after the gate: the gate → home timeline calls
 *   introSpray() at GATE.WHO_DELAY.
 * - Deep link: the first visit home sprays once the page transition finishes.
 * - Once it has sprayed (user decision, resolves open question #2): every
 *   later visit shows the same finished picture straight away, no animation
 *   or sound. Leaving mid-spray keeps the finished picture too.
 * - Reduced motion: the finished picture, instantly and silently.
 */
import { prefersReducedMotion } from "../lib/motion";
import { whenIdle } from "../lib/router";
import type { SprayEngine, SprayPicture } from "./sprayEngine";

let engine: SprayEngine | null = null;
/** The gate intro owns the first spray until it reaches WHO_DELAY. */
let introPending = true;
let sprayedOnce = false;
/** The finished picture, saved when Home unmounts. */
let picture: SprayPicture | null = null;

function run(e: SprayEngine) {
  sprayedOnce = true;
  e.spray({ instant: prefersReducedMotion() });
}

/** Home mounted. Returns the detach function for unmount. */
export function attachWho(e: SprayEngine): () => void {
  engine = e;
  if (picture) {
    e.show(picture);
  } else if (!introPending) {
    void whenIdle().then(() => {
      if (engine === e) run(e);
    });
  }
  return () => {
    if (sprayedOnce) picture = e.finish();
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

/** Dev (/?spray-debug): spray again from scratch, e.g. after editing sprayPace.ts. */
export function respray(): void {
  if (!engine) return;
  sprayedOnce = true;
  engine.spray();
}
