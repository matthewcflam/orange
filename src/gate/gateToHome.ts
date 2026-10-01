/**
 * Gate → Home (spec §6.5). One timeline, positions in seconds from the click,
 * all from GATE in timings.ts. Built when gatePhase becomes "leaving": by then
 * the page (Home's smiley) is mounted but hidden, the map is mounted with
 * visibility: hidden, and the gate options are still showing. The options
 * vanish at the click (user change: the grey-square paint-over was removed).
 */
import { gsap } from "../lib/gsap";
import { GATE, SCREEN_DOOR } from "../config/timings";
import { introSpray, skipIntroSpray } from "../spray/who";
import { markPageShown } from "../lib/pageReveal";

interface Options {
  /** App root; everything is selected inside it. */
  root: HTMLElement;
  /** Landed on "/"; otherwise a deep link (open question #1). */
  home: boolean;
  reduced: boolean;
  /** Unmount the gate options; gatePhase = "done". */
  onOptionsGone: () => void;
}

export function gateToHome({ root, home, reduced, onOptionsGone }: Options): gsap.core.Timeline {
  const q = gsap.utils.selector(root);
  const map = q(".transit-map");
  const screenDoor = q(".screen-door");
  const tl = gsap.timeline();

  tl.set(q(".gate"), { autoAlpha: 0 }, 0);
  tl.call(onOptionsGone, undefined, GATE.OPTIONS_UNMOUNT);
  // The page starts to appear here (deep link fade, or home's stagger).
  tl.call(markPageShown, undefined, GATE.OPTIONS_UNMOUNT);

  if (!home) {
    // TODO(open-question #1): placeholder deep-link reveal. The name block
    // fades out on its own once the route isn't home.
    skipIntroSpray();
    const page = q(".layer--page");
    gsap.set(page, { autoAlpha: 0 });
    tl.to([map, page, ...screenDoor], { autoAlpha: 1, duration: GATE.DEEP_LINK_FADE }, GATE.OPTIONS_UNMOUNT);
    return tl;
  }

  const line = q(".transit-map__line");
  const dots = q(".station__dot"); // DOM order is Home → Inspo, left to right
  const labels = q(".station__label");
  const smiley = q(".home__smiley");
  gsap.set([line, dots, labels, smiley], { autoAlpha: 0 });
  gsap.set(map, { autoAlpha: 1 });

  tl.to(line, { autoAlpha: 1, duration: GATE.ROUTE_IN_DURATION, ease: GATE.ROUTE_IN_EASE }, GATE.ROUTE_IN)
    .fromTo(
      dots,
      { y: reduced ? 0 : GATE.STATION_SETTLE_PX },
      {
        autoAlpha: 1,
        y: 0,
        duration: GATE.STATION_FADE_DURATION,
        ease: GATE.STATION_EASE,
        stagger: GATE.STATION_STAGGER,
      },
      GATE.STATIONS_IN,
    )
    .to(labels, { autoAlpha: 1, duration: GATE.STATION_FADE_DURATION, stagger: GATE.STATION_STAGGER }, GATE.LABELS_IN)
    .to(screenDoor, { autoAlpha: 1, duration: SCREEN_DOOR.FADE_IN }, GATE.ROUTE_IN)
    .to(smiley, { autoAlpha: 1, duration: GATE.SMILEY_IN_DURATION }, GATE.SMILEY_IN)
    .call(introSpray, undefined, GATE.WHO_DELAY);
  return tl;
}

