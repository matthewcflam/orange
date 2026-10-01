/**
 * TEMPORARY (milestone 3): the page transition between stations. Fades the
 * page out, commits, and fades it back in while the map morphs.
 *
 * Switching between projects is not a station change (§10.1), so it only
 * crossfades the project content; the list, map and page stay put.
 */
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { PROJECT, TEMP_NAV } from "../config/timings";
import { routeFor } from "../config/routes";
import { getRoute, type TransitionRunner } from "../lib/router";
import { preloadRoute } from "../lib/assets";
import { markPageHidden, markPageShown } from "../lib/pageReveal";
import { prefersReducedMotion } from "../lib/motion";

const isProject = (path: string) => routeFor(path).station === "projects";

/** The next page's images, or give up after PRELOAD_MAX_MS. */
function imagesReady(to: string): Promise<void> {
  return Promise.race([preloadRoute(to), new Promise<void>((r) => setTimeout(r, TEMP_NAV.PRELOAD_MAX_MS))]);
}

export const tempTransition: TransitionRunner = async (to, commit) => {
  const ready = imagesReady(to);
  if (isProject(getRoute()) && isProject(to)) return projectSwitch(ready, commit);

  // "who?" lives on the glass layer but belongs to the page.
  const page = document.querySelectorAll(".layer--page, .layer--glass");
  play("station.click");
  await gsap.to(page, { autoAlpha: 0, duration: TEMP_NAV.OUT });
  await ready;
  markPageHidden();
  commit();
  await gsap.to(page, {
    autoAlpha: 1,
    duration: TEMP_NAV.IN,
    delay: TEMP_NAV.MAP_MORPH * 0.5,
    onStart: markPageShown,
  });
};

/** TODO(open-question #3): placeholder project switch (§10.1). */
async function projectSwitch(ready: Promise<void>, commit: () => void) {
  const offset = prefersReducedMotion() ? 0 : PROJECT.SWITCH_OFFSET_PX;
  const swap = () => document.querySelector(".project__swap");
  play("project.select");
  await gsap.to(swap(), {
    autoAlpha: 0,
    y: -offset,
    duration: PROJECT.SWITCH_OUT,
    ease: PROJECT.SWITCH_EASE_OUT,
  });
  await ready;
  commit();
  await gsap.fromTo(
    swap(),
    { autoAlpha: 0, y: offset },
    { autoAlpha: 1, y: 0, duration: PROJECT.SWITCH_IN, ease: PROJECT.SWITCH_EASE_IN, clearProps: "transform" },
  );
}
