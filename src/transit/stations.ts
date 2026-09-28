/**
 * Transit map geometry for the two layouts (spec §7.1, §8.4), in mockup px
 * (the SVG's viewBox is the 1440×1024 reference frame). Measured from
 * 02-home.png (full; labels re-measured from the Home-station redesign) and
 * 06-projects-oyster-news.png (mini).
 *
 * The mini map is not a uniform scale of the full one (station spacing and the
 * diagonal's slope differ, and the route stays 10px thick), so the morph
 * interpolates this geometry rather than scaling the SVG.
 */
import { STATIONS } from "../config/routes";

export type LayoutName = "full" | "mini";

export interface Layout {
  upperY: number;
  lowerY: number;
  /** Route start (off the left edge) and end. */
  startX: number;
  endX: number;
  /** Station centre x, in line order. */
  x: number[];
  /** Label cap-height top, relative to the station centre (negative = above). */
  labelTop: number[];
  labelSize: number;
  lineWidth: number;
  dotR: number;
  dotRing: number;
  hitR: number;
  cardOpacity: number;
  /** The route is clipped to this box: the card in mini, the viewport in full. */
  clipW: number;
  clipH: number;
}

/** Label font size the <text> elements are set at; layouts scale from it. */
export const LABEL_BASE_SIZE = 38;

/** Mini-map card (§8.4): 440×156 grey card (widened from the mockup's 381 to fit
 *  Home), 12px border right, 5px bottom. */
export const CARD = { w: 440, h: 156, borderRight: 12, borderBottom: 5 } as const;

const FULL: Layout = {
  upperY: 204.5,
  lowerY: 364.5,
  startX: -20,
  endX: 1460, // stretched to the viewport's right edge at runtime
  x: [92, 420.5, 686.5, 1022, 1323],
  labelTop: [-69.5, -69.5, 53, 53, 53],
  labelSize: 38,
  lineWidth: 10,
  dotR: 12,
  dotRing: 3,
  hitR: 28,
  cardOpacity: 0,
  clipW: 1440,
  clipH: 1024,
};

const MINI: Layout = {
  upperY: 57.5,
  lowerY: 99.5,
  startX: -20,
  endX: CARD.w + 20,
  x: [36, 118, 196, 316, 405],
  labelTop: [-29, -29, 14, 14, 14],
  labelSize: 15,
  lineWidth: 10,
  dotR: 7,
  dotRing: 1,
  hitR: 16,
  cardOpacity: 1,
  clipW: CARD.w,
  clipH: CARD.h,
};

/** The viewport's size in mockup px (it can be wider or taller than 1440×1024). */
function viewportInMockupPx() {
  const px = Math.min(window.innerWidth / 1440, window.innerHeight / 1024);
  return { w: window.innerWidth / px, h: window.innerHeight / px };
}

export function layoutFor(name: LayoutName): Layout {
  if (name === "mini") return MINI;
  const vp = viewportInMockupPx();
  // On viewports wider than the mockup, spread stations across the full
  // width (same rule as --vx in global.css); sizes keep the uniform scale.
  const sx = vp.w / 1440;
  return { ...FULL, x: FULL.x.map((x) => x * sx), endX: vp.w + 20, clipW: vp.w, clipH: vp.h };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpLayout(a: Layout, b: Layout, t: number): Layout {
  const out = {} as Record<string, number | number[]>;
  for (const key of Object.keys(a) as (keyof Layout)[]) {
    const va = a[key];
    const vb = b[key];
    out[key] = Array.isArray(va) ? va.map((v, i) => lerp(v, (vb as number[])[i], t)) : lerp(va, vb as number, t);
  }
  return out as unknown as Layout;
}

export const stationY = (l: Layout, i: number) => (STATIONS[i].track === "upper" ? l.upperY : l.lowerY);
