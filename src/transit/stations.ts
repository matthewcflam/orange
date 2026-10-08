/**
 * Transit map geometry (spec §7.1), in mockup px: the SVG's viewBox is the
 * 1767×1024 frame. Measured from design/mockups-v2/Home Page (8).png; labels from Home Page (9).png. The map
 * only shows on home (station pages navigate with the keychain instead).
 */
import { STATIONS } from "../config/routes";
import { FRAME, isCompact, pxScale, viewportInMockupPx } from "../lib/frame";

export interface Layout {
  upperY: number;
  lowerY: number;
  /** Route start (off the left edge) and end. */
  startX: number;
  endX: number;
  /** Where the upper track turns into the diagonal. */
  bendX: number;
  /** Station centre x, in line order. */
  x: number[];
  /** Label cap-height top, relative to the station centre (positive = below). */
  labelTop: number[];
  labelSize: number;
  lineWidth: number;
  dotR: number;
  dotRing: number;
  hitR: number;
}

/** Label font size the <text> elements are set at; layouts scale from it. */
export const LABEL_BASE_SIZE = 47;

const FULL: Layout = {
  upperY: 204.5,
  lowerY: 365.5,
  startX: -20,
  endX: FRAME.W + 20, // stretched to the viewport's right edge at runtime
  bendX: 521,
  // The diagonal ends at Experience.
  x: [424, 840, 1246],
  labelTop: [42.5, 45.5, 45.5],
  labelSize: 36,
  lineWidth: 20,
  dotR: 20,
  dotRing: 3,
  hitR: 34,
};

/** Smallest label size in CSS px: --type-label's floor (tokens.css). */
const LABEL_FLOOR_PX = 18;

/**
 * The compact layout (narrow, portrait or short windows; lib/frame.ts): the
 * same route drawn for a phone. x is a fraction of the viewport width; the
 * rest is in --m (1px of a 390-wide phone, global.css), measured by eye
 * against the full map's proportions.
 */
const COMPACT = {
  x: [0.2, 0.55, 0.85],
  bendX: 0.32,
  upperY: 70,
  lowerY: 128,
  labelTop: 15,
  labelSize: 16,
  lineWidth: 6,
  dotR: 7,
  dotRing: 2,
  hitR: 24,
};

export function layoutFor(): Layout {
  const vp = viewportInMockupPx();
  const px = pxScale();
  const labelFloor = LABEL_FLOOR_PX / px;
  if (isCompact()) {
    // --m in mockup px. Short windows (phone landscape) scale by height too.
    const m = Math.min(window.innerWidth / 390, window.innerHeight / 390, 1.6) / px;
    const c = COMPACT;
    return {
      upperY: c.upperY * m,
      lowerY: c.lowerY * m,
      startX: -20,
      endX: vp.w + 20,
      bendX: c.bendX * vp.w,
      x: c.x.map((x) => x * vp.w),
      labelTop: c.x.map(() => c.labelTop * m),
      labelSize: Math.max(c.labelSize * m, labelFloor),
      lineWidth: c.lineWidth * m,
      dotR: c.dotR * m,
      dotRing: c.dotRing * m,
      hitR: c.hitR * m,
    };
  }
  // On viewports wider than the mockup, spread the map across the full width
  // (same rule as --vx in global.css); sizes keep the uniform scale.
  const sx = vp.w / FRAME.W;
  return {
    ...FULL,
    x: FULL.x.map((x) => x * sx),
    bendX: FULL.bendX * sx,
    endX: vp.w + 20,
    labelSize: Math.max(FULL.labelSize, labelFloor),
  };
}

export const stationY = (l: Layout, i: number) => (STATIONS[i].track === "upper" ? l.upperY : l.lowerY);
