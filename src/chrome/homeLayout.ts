/**
 * Where "who?" goes. The compact home layout (global.css): the name block stacks under the map
 * (chrome.css), and "who?" goes where it can be biggest without covering it:
 * under it on a portrait screen (user request: the height is there, so the
 * spray doesn't paint over the text), right of it on a phone on its side.
 * On a tall screen the name block and "who?" move down together into the
 * space under the map (--home-shift).
 *
 * The full layout keeps "who?" at its mockup spot (home.css) unless the text
 * would reach under it (fullLayoutBox).
 *
 * NameBlock runs this (it is mounted from the gate on, so the name never
 * jumps when home mounts); Home places the canvas from the result.
 */
import { WHO_BOX } from "../spray/sprayEngine";
import { SPRAY } from "../config/timings";
import { FRAME, isCompact, pxScale } from "../lib/frame";

/** Gap between the name block and "who?"'s ink, and the screen-edge gutter,
 *  in px. */
const WHO_GAP = 24;
const GUTTER = 16;
/** How far down the free space the group moves: 0.5 centres it under the
 *  map, 0 keeps it up against the map. */
const HOME_CENTRE = 0.4;

/** The "who?" canvas box in viewport px (it includes the overspray pad). */
export type WhoBox = { left: number; top: number; width: number };

let who: WhoBox | null = null;
const listeners = new Set<(box: WhoBox | null) => void>();

/** Lays out the compact home around `block` (the name block). */
export function layoutHome(block: HTMLElement) {
  const root = document.documentElement.style;
  const W = WHO_BOX.width;
  const H = WHO_BOX.height;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!isCompact()) {
    root.removeProperty("--home-shift");
    publish(fullLayoutBox(block, W, H, vw));
    return;
  }
  // The block sits in the fixed chrome layer, so its offsets are viewport
  // coordinates (and ignore the intro's transforms). Measured without the
  // current shift, which this recomputes.
  const top = block.offsetTop - (parseFloat(root.getPropertyValue("--home-shift")) || 0);
  const bottom = top + block.offsetHeight;
  const left = block.offsetLeft;
  const right = left + block.offsetWidth;
  // The column is left-anchored (chrome.css), so it ends at the right gutter.
  const column = Math.min(vw - GUTTER - left, 640);

  // The ink's width in each spot.
  const belowW = Math.min(column, ((vh - GUTTER - bottom - WHO_GAP) * W) / H);
  const besideW = Math.min(vw - GUTTER - right - WHO_GAP, ((vh - GUTTER - top) * W) / H);
  let shift = 0;
  let ink: { x: number; y: number; w: number };
  if (belowW >= besideW) {
    shift = Math.round(Math.max(0, (vh - GUTTER - (bottom + WHO_GAP + (belowW * H) / W)) * HOME_CENTRE));
    ink = { x: left, y: bottom + shift + WHO_GAP, w: belowW };
  } else {
    ink = { x: right + WHO_GAP, y: top + Math.max(0, (block.offsetHeight - (besideW * H) / W) / 2), w: besideW };
  }
  root.setProperty("--home-shift", `${shift}px`);
  const w = Math.max(1, ink.w);
  const pad = (SPRAY.CANVAS_PAD_PX * w) / W;
  publish({ left: ink.x - pad, top: ink.y - pad, width: w + 2 * pad });
}

/**
 * The full layout keeps "who?" at its mockup spot (home.css: null), unless
 * the text reaches under it: on a small window the bio's 16px floor makes it
 * wider than the mockup's. Then the ink starts right of the text, keeping its
 * size if there's room (else shrinking to the screen edge) and its centre
 * line.
 */
function fullLayoutBox(block: HTMLElement, W: number, H: number, vw: number): WhoBox | null {
  const bio = block.querySelector<HTMLElement>(".name-block__bio");
  const px = pxScale();
  const ink = { x: 1168 * (vw / FRAME.W) - (W / 2) * px, y: 582 * px, w: W * px, h: H * px };
  // The bio is absolutely placed in the block, so measure it on its own.
  const textRight = block.offsetLeft + Math.max(block.offsetWidth, bio ? bio.offsetLeft + bio.offsetWidth : 0);
  const textBottom = block.offsetTop + (bio ? bio.offsetTop + bio.offsetHeight : block.offsetHeight);
  const overlaps = textRight + WHO_GAP > ink.x && block.offsetTop < ink.y + ink.h && textBottom > ink.y;
  if (!overlaps) return null;
  const x = textRight + WHO_GAP;
  const w = Math.max(1, Math.min(ink.w, vw - GUTTER - x));
  const y = ink.y + (ink.h - (w * H) / W) / 2;
  const pad = (SPRAY.CANVAS_PAD_PX * w) / W;
  return { left: x - pad, top: y - pad, width: w + 2 * pad };
}

function publish(box: WhoBox | null) {
  who = box;
  listeners.forEach((fn) => fn(box));
}

/** Calls `fn` with the "who?" box now and on every change (null: the full
 *  layout). Returns the unsubscribe. */
export function onWhoBox(fn: (box: WhoBox | null) => void): () => void {
  listeners.add(fn);
  fn(who);
  return () => listeners.delete(fn);
}
