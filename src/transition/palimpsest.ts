/**
 * Palimpsest, the station-to-station transition (spec §8). Registered as the
 * router's transition runner in main.tsx; the router has already written
 * history and locked input when this runs, and unlocks + runs `queued` when
 * the returned promise resolves.
 *
 *   1. Dot    the target station's dot fills and pops           station.click
 *   2. Stack  the station name stamps down, accelerating         palimpsest.thud × copies (pre-scheduled)
 *   3. Seal   the tunnel layer fades in: guaranteed black
 *   4. Swap   clear the stack, commit (page + map layout swap)   rumble starts, lowpassed
 *   5. Wait   next page's assets, capped at PRELOAD_TIMEOUT
 *   6. Exit   tunnel slides left, light bleed fades, scene settles   rumble opens up and fades
 *
 * The overlay DOM (TransitionOverlay.tsx) attaches itself here; everything
 * else is module state, so StrictMode can't double it.
 */
import { gsap } from "../lib/gsap";
import { PALIMPSEST, REDUCED } from "../config/timings";
import { STATIONS, routeFor, type Station } from "../config/routes";
import { FAMILY, fontString } from "../lib/fonts";
import { readToken } from "../lib/tokens";
import { preloadRoute } from "../lib/assets";
import { prefersReducedMotion } from "../lib/motion";
import { getContext, play } from "../audio/engine";
import { startRumble, type Rumble } from "../audio/tunnelRumble";
import type { TransitionRunner } from "../lib/router";

export interface OverlayElements {
  root: HTMLElement;
  /** Word stack (Phase 2). */
  canvas: HTMLCanvasElement;
  /** White overlay fading out as the tunnel opens (Phase 6). */
  bleed: HTMLElement;
  /** The black layer: seals (Phase 3), then slides away (Phase 6). */
  tunnel: HTMLElement;
}

/** TODO(open-question #14): home has no station, so no station name to stack. */
const HOME_WORD = "Home";

let els: OverlayElements | null = null;
let active: gsap.core.Timeline | null = null;
let rumble: Rumble | null = null;

/** TransitionOverlay mounted. Returns the detach function. */
export function attachOverlay(e: OverlayElements): () => void {
  els = e;
  resetOverlay();
  return () => {
    if (els === e) els = null;
  };
}

/** The layers that make up "the new scene", scaled as the tunnel opens. */
const sceneLayers = () => gsap.utils.toArray<HTMLElement>(".layer--page, .layer--chrome, .layer--map");
const stationDots = () => gsap.utils.toArray<SVGCircleElement>(".station__dot");

/**
 * Put the overlay back to idle (§8.3). Idempotent: called after every run,
 * on interrupt, from the black-screen safety and on attach.
 */
export function resetOverlay(): void {
  active?.kill();
  active = null;
  rumble?.stop(PALIMPSEST.RUMBLE_FADE);
  rumble = null;
  gsap.set(sceneLayers(), { clearProps: "transform,transformOrigin,willChange" });
  // Phase 1's inline fill/scale; the current station's CSS fill takes over.
  gsap.killTweensOf(stationDots());
  gsap.set(stationDots(), { clearProps: "fill,transform" });
  if (!els) return;
  releaseCanvas(els.canvas);
  gsap.set(els.tunnel, { xPercent: 0, autoAlpha: 0 });
  gsap.set(els.bleed, { opacity: 0 });
  els.root.style.pointerEvents = "";
}

export const palimpsest: TransitionRunner = async (to, commit) => {
  const e = els;
  if (!e) return commit();

  const reduced = prefersReducedMotion();
  const station = STATIONS.find((s) => s.id === routeFor(to).station);
  let aborted = false;
  let safety = 0;

  // Block clicks and hovers underneath while the transition runs.
  e.root.style.pointerEvents = "auto";
  play("station.click");

  try {
    await run(reduced ? fade(e.tunnel, 1) : phasesToBlack(e, station?.label ?? HOME_WORD, station));

    // Phase 4, at black.
    releaseCanvas(e.canvas);
    commit(); // flushes React: the new page and the map layout are in the DOM now
    if (!reduced) rumble = startRumble();
    // §8.5: never leave the screen stuck black (e.g. a hidden tab stalls the ticker).
    safety = window.setTimeout(() => {
      aborted = true;
      active?.kill();
    }, PALIMPSEST.BLACK_SAFETY * 1000);

    // Phase 5.
    await Promise.race([preloadRoute(to), delay(PALIMPSEST.PRELOAD_TIMEOUT)]);
    if (aborted) return;

    // Phase 6.
    await run(reduced ? fade(e.tunnel, 0) : tunnelExit(e));
  } finally {
    clearTimeout(safety);
    resetOverlay();
  }
};

// ---------------------------------------------------------------------------
// Timelines
// ---------------------------------------------------------------------------

/** Play a timeline; resolves when it completes or is killed. */
function run(tl: gsap.core.Timeline): Promise<void> {
  active = tl;
  if (import.meta.env.DEV) Object.assign(window, { __palimpsest: tl });
  return new Promise((resolve) => {
    tl.eventCallback("onComplete", () => resolve());
    tl.eventCallback("onInterrupt", () => resolve());
  });
}

const delay = (s: number) => new Promise<void>((resolve) => setTimeout(resolve, s * 1000));

/** Reduced motion (§12): a plain fade to black and back. */
function fade(tunnel: HTMLElement, to: 0 | 1) {
  return gsap.timeline().to(tunnel, { autoAlpha: to, duration: REDUCED.PALIMPSEST_FADE, ease: "none" });
}

let activeFill: string | null = null;

/** Phases 1–3. Ends with the tunnel layer fully opaque. */
function phasesToBlack(e: OverlayElements, word: string, station: Station | undefined): gsap.core.Timeline {
  const P = PALIMPSEST;
  const tl = gsap.timeline();
  let stackAt = 0;

  // Phase 1: the target station's dot. None when going home.
  const dot = station && document.querySelector<SVGCircleElement>(`.station[data-station="${station.id}"] .station__dot`);
  if (dot) {
    activeFill ??= readToken("--color-station-active");
    gsap.killTweensOf(dot); // a running hover tween
    tl.to(dot, {
      fill: activeFill,
      scale: P.DOT_GROW_SCALE,
      duration: P.DOT_GROW,
      ease: P.DOT_GROW_EASE,
      transformOrigin: "50% 50%",
    }).to(dot, { scale: 1, duration: P.DOT_SETTLE, ease: P.DOT_SETTLE_EASE });
    stackAt = P.DOT_GROW + P.DOT_SETTLE - P.STACK_OVERLAP;
  }

  // Phase 2: stamp the copies. Thuds are scheduled on the audio clock now,
  // not from the callbacks, so the rhythm can't drift with frames (§9.3).
  const stack = prepareStack(e.canvas, word);
  const times = copyTimes(stack.count);
  const ctx = getContext();
  const audioStart = ctx ? ctx.currentTime + stackAt : 0;
  times.forEach((t, i) => {
    tl.call(stack.draw, [i], stackAt + t);
    if (ctx) play("palimpsest.thud", { when: audioStart + t });
  });

  // Phase 3: seal whatever the words didn't cover.
  const sealAt = stackAt + times[times.length - 1] + P.SEAL_DELAY;
  tl.to(e.tunnel, { autoAlpha: 1, duration: P.SEAL, ease: "none" }, sealAt);
  return tl;
}

/** Phase 6. Starts at black, with the new page already mounted. */
function tunnelExit(e: OverlayElements): gsap.core.Timeline {
  const P = PALIMPSEST;
  const layers = sceneLayers();
  // Fixed layers scale about the viewport centre; the page (scrolled to top
  // at commit) about the centre of what's on screen.
  gsap.set(layers, {
    scale: P.PAGE_SCALE_FROM,
    transformOrigin: (_i: number, el: HTMLElement) =>
      el.classList.contains("layer--page") ? `50% ${window.scrollY + window.innerHeight / 2}px` : "50% 50%",
    willChange: "transform",
  });
  gsap.set(e.bleed, { opacity: P.LIGHT_BLEED_FROM });

  return gsap
    .timeline()
    .call(() => rumble?.open(P.TUNNEL), [], 0)
    .to(e.tunnel, { xPercent: -100, duration: P.TUNNEL, ease: P.TUNNEL_EASE }, 0)
    .to(layers, { scale: 1, duration: P.TUNNEL, ease: P.PAGE_SETTLE_EASE }, 0)
    .to(e.bleed, { opacity: 0, duration: P.LIGHT_BLEED }, P.LIGHT_BLEED_OFFSET)
    .call(() => rumble?.stop(P.RUMBLE_FADE), [], P.TUNNEL * P.RUMBLE_FADE_AT);
}

// ---------------------------------------------------------------------------
// Word stack (§8.2): the word is rendered once to an offscreen bitmap, then
// drawImage'd at each copy's offset. Never DOM text.
// ---------------------------------------------------------------------------

/** Seconds from the first copy to each copy; intervals shrink START → END. */
function copyTimes(n: number): number[] {
  const P = PALIMPSEST;
  const out = [0];
  for (let k = 0; k < n - 1; k++) {
    const f = n > 2 ? k / (n - 2) : 0;
    out.push(out[k] + P.STACK_INTERVAL_START + (P.STACK_INTERVAL_END - P.STACK_INTERVAL_START) * f);
  }
  return out;
}

/**
 * Ink-top y of each copy, in draw order. The first copies step down from
 * `top` by `step` (03-transition-1.png), then up above it; after that each
 * pass bisects the gaps in shuffled order, so the stack fills in everywhere
 * at once rather than top to bottom (04-transition-2.png).
 */
function copyRows(n: number, top: number, step: number, minY: number, maxY: number): number[] {
  const ys = [top];
  for (let y = top + step; y <= maxY && ys.length < n; y += step) ys.push(y);
  for (let y = top - step; y >= minY && ys.length < n; y -= step) ys.push(y);
  for (let s = step / 2; ys.length < n && s >= 1; s /= 2) {
    const sorted = [...ys].sort((a, b) => a - b);
    const mids = sorted.slice(1).map((y, i) => (y + sorted[i]) / 2);
    for (const y of gsap.utils.shuffle(mids)) {
      if (ys.length >= n) break;
      ys.push(y);
    }
  }
  return ys;
}

interface Stack {
  count: number;
  draw(i: number): void;
}

/** Size the overlay canvas to the viewport and pre-render the word. */
function prepareStack(canvas: HTMLCanvasElement, word: string): Stack {
  const P = PALIMPSEST;
  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const px = Math.min(vw / 1440, vh / 1024);

  // Fit the ink to the viewport width, capped in height. Integer px (Firefox).
  const measure = document.createElement("canvas").getContext("2d")!;
  const metricsAt = (size: number) => {
    measure.font = fontString(P.STACK_FONT_WEIGHT, size, FAMILY.body);
    const m = measure.measureText(word);
    return { left: m.actualBoundingBoxLeft, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent };
  };
  const probe = metricsAt(100);
  const size = Math.max(1, Math.floor(100 * Math.min((vw * P.STACK_WIDTH_FIT) / probe.w, (vh * P.STACK_MAX_HEIGHT) / probe.h)));
  const ink = metricsAt(size);

  // Offscreen bitmap in device px, ink flush with its top-left corner.
  const bitmap = document.createElement("canvas");
  bitmap.width = Math.ceil(ink.w * dpr) + 2;
  bitmap.height = Math.ceil(ink.h * dpr) + 2;
  const b = bitmap.getContext("2d")!;
  b.scale(dpr, dpr);
  b.font = fontString(P.STACK_FONT_WEIGHT, size, FAMILY.body);
  b.fillStyle = readToken("--color-text");
  b.fillText(word, ink.left, ink.ascent);

  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  const ctx = canvas.getContext("2d")!;

  const rows = copyRows(P.STACK_COPIES, P.STACK_FIRST_TOP_PX * px, P.STACK_FIRST_OFFSET_PX * px, -ink.h / 2, vh - ink.h / 2);
  const xs = rows.map((_, i) => (i < P.STACK_ALIGNED ? 0 : gsap.utils.random(-1, 1) * P.STACK_JITTER_PX * px));

  return {
    count: rows.length,
    draw(i) {
      ctx.drawImage(bitmap, Math.round(xs[i] * dpr), Math.round(rows[i] * dpr));
    },
  };
}

/** Clear the stack and free its backing store (a full-screen DPR canvas is tens of MB). */
function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => resetOverlay());
}
