/**
 * The page transition, copied from 2xa.studio (About → Projects there). A
 * dither cover fills the screen bottom to top while "Now arriving at: <name>"
 * scramble-types on it; under the cover the page (and the page theme) swaps;
 * after a hold the cover dithers away, bottom to top, revealing the new page.
 * Cover: ditherCover.ts. Title: scrambleTitle.ts. Timings: TRANSITION.
 *
 * Cover colour (user decision): the opposite of the page being left. Leaving
 * the light home it is dark (the station pages' colour, light text); leaving
 * a dark station page it is light (black text), whether the next page is
 * another station or home.
 *
 * Switching between projects is not a station change (§10.1), so it only
 * crossfades the project content; the list, map and page stay put.
 */
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { PROJECT, SPEECH, TRANSITION } from "../config/timings";
import { routeFor, STATIONS } from "../config/routes";
import { getRoute, type TransitionRunner } from "../lib/router";
import { preloadRoute } from "../lib/assets";
import { markPageHidden, markPageShown } from "../lib/pageReveal";
import { prefersReducedMotion } from "../lib/motion";
import { cover } from "./ditherCover";
import { title } from "./scrambleTitle";
import { say } from "../lib/speech";

/** The first trip from home to a station says how to get back (once). */
let toldHowHome = false;

const isProject = (path: string) => routeFor(path).station === "projects";

/** The words typed on the cover, as groups placed by transition.css. */
function titleFor(path: string): string[] {
  const route = routeFor(path);
  const station = STATIONS.find((s) => s.id === route.station);
  return ["Now arriving at:", station ? station.label : "Home"];
}

/** Cover tone for leaving `from`: opposite to its page theme. */
const toneLeaving = (from: string) => (routeFor(from).theme === "light" ? "dark" : "light");

/** The next page's images, or give up after PRELOAD_MAX_MS. */
function imagesReady(to: string): Promise<void> {
  return Promise.race([preloadRoute(to), new Promise<void>((r) => setTimeout(r, TRANSITION.PRELOAD_MAX_MS))]);
}

export const pageTransition: TransitionRunner = async (to, commit) => {
  const ready = imagesReady(to);
  if (isProject(getRoute()) && isProject(to)) return projectSwitch(ready, commit);

  const reduced = prefersReducedMotion();
  const leavingHome = routeFor(getRoute()).theme === "light";
  const tone = toneLeaving(getRoute());
  const tellHowHome = leavingHome && !toldHowHome;
  toldHowHome ||= tellHowHome;
  cover.setTone(tone);
  play("station.click");

  // The title runs on its own clock: its type-out outlasts the cover, like 2xa's.
  if (reduced) title.showStatic(titleFor(to));
  else void title.run(titleFor(to));

  await cover.show(reduced, tone === "dark" ? "--color-cover-dark" : "--color-cover-light");
  await ready;
  markPageHidden();
  commit(); // the map morph and name-block fade start here, under the cover

  // Input unlocks once the cover is nearly clear; the rest of the clear and
  // the title's type-out finish on their own.
  await new Promise<void>((unlock) => {
    void cover.hide(reduced, {
      delay: TRANSITION.HOLD,
      onClearStart: () => {
        markPageShown();
        if (tellHowHome) gsap.delayedCall(SPEECH.FIRST_VISIT_DELAY, say, ["Click the title to go home!"]);
      },
      onUnlock: () => {
        if (reduced) title.hide();
        unlock();
      },
    });
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
