/**
 * TEMPORARY (milestone 3): stand-in for Palimpsest until milestone 6. Fades
 * the page out, commits, and fades it back in while the map morphs.
 */
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { TEMP_NAV } from "../config/timings";
import type { TransitionRunner } from "../lib/router";

export const tempTransition: TransitionRunner = (_to, commit) =>
  new Promise((resolve) => {
    const page = document.querySelector(".layer--page");
    play("station.click");
    gsap
      .timeline({ onComplete: resolve, onInterrupt: resolve })
      .to(page, { autoAlpha: 0, duration: TEMP_NAV.OUT })
      .add(commit)
      .to(page, { autoAlpha: 1, duration: TEMP_NAV.IN, delay: TEMP_NAV.MAP_MORPH * 0.5 });
  });
