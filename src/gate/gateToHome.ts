/**
 * Gate → Home (spec §6.5, §6.6). One timeline, positions in seconds from the
 * click, all from GATE / PAINT in timings.ts. Built when gatePhase becomes
 * "leaving": by then the page (Home's smiley) is mounted but hidden, the map is
 * mounted with visibility: hidden, and the gate options are still showing.
 */
import { gsap } from "../lib/gsap";
import { GATE, PAINT, REDUCED } from "../config/timings";
// TODO(paint sound): restore these imports with the play() call in paintSquare.
// import { semitonesToRate } from "../config/sounds";
import { getContext /*, play */ } from "../audio/engine";

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
  const squares = q(".grey-square");
  const map = q(".transit-map");
  const tl = gsap.timeline();

  // Paint sounds are scheduled up front on the audio clock (§9.3), not in callbacks.
  const ctx = getContext();
  const audioStart = ctx ? ctx.currentTime : null;
  const at = (t: number) => (audioStart === null ? undefined : audioStart + t);

  tl.to(q(".gate__cursor"), { autoAlpha: 0, duration: GATE.CURSOR_OUT }, 0);
  squares.forEach((square, i) => {
    const start = i === 0 ? GATE.SQUARE_A_START : GATE.SQUARE_B_OFFSET;
    tl.add(reduced ? fadeSquare(square) : paintSquare(square, start, at), start);
  });
  tl.call(onOptionsGone, undefined, GATE.OPTIONS_UNMOUNT);

  if (!home) {
    // TODO(open-question #1): placeholder deep-link reveal. The squares and
    // name block fade out on their own once the route isn't home.
    const page = q(".layer--page");
    gsap.set(page, { autoAlpha: 0 });
    tl.to([map, page], { autoAlpha: 1, duration: GATE.DEEP_LINK_FADE }, GATE.OPTIONS_UNMOUNT);
    return tl;
  }

  const line = q(".transit-map__line");
  const dots = q(".station__dot"); // DOM order is About → Inspo, left to right
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
    .to(smiley, { autoAlpha: 1, duration: GATE.SMILEY_IN_DURATION }, GATE.SMILEY_IN)
    // TODO(milestone 5): start the "who?" spray here.
    .call(() => console.info("[gate→home] who? spray starts"), undefined, GATE.WHO_DELAY);
  return tl;
}

/** Reveal one square through its brush-stroke mask (§6.6): the passes draw on
 *  with DrawSVG, overlapping in time, then the square becomes a plain box. */
// TODO(paint sound): rename _start/_at back to start/at when the sound returns.
function paintSquare(square: Element, _start: number, _at: (t: number) => number | undefined): gsap.core.Timeline {
  const strokes = square.querySelectorAll(".grey-square__stroke");
  const n = strokes.length;
  // n strokes of length d, each starting (1 - overlap)·d after the last, fill SQUARE_DURATION.
  const d = PAINT.SQUARE_DURATION / (1 + (n - 1) * (1 - PAINT.STROKE_OVERLAP));
  const gap = d * (1 - PAINT.STROKE_OVERLAP);
  const tl = gsap.timeline();

  gsap.set(strokes, { drawSVG: "0%" });
  tl.set(square, { visibility: "visible" }, 0);
  strokes.forEach((stroke, i) => {
    tl.to(stroke, { drawSVG: "100%", duration: d, ease: PAINT.STROKE_EASE }, i * gap);
    // TODO(paint sound): muted until the user supplies a replacement sound.
    // const semis = gsap.utils.random(-PAINT.STROKE_PITCH_SEMITONES, PAINT.STROKE_PITCH_SEMITONES);
    // play("paint.stroke", { when: at(start + i * gap), rate: semitonesToRate(semis) });
  });
  tl.call(() => square.setAttribute("data-painted", ""));
  return tl;
}

/** Reduced motion: the paint-over becomes a short fade (§12). */
function fadeSquare(square: Element): gsap.core.Timeline {
  square.setAttribute("data-painted", "");
  return gsap.timeline().fromTo(square, { autoAlpha: 0 }, { autoAlpha: 1, duration: REDUCED.PAINT_FADE });
}
