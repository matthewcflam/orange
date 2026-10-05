/**
 * Transit map geometry (spec §7.1), in mockup px: the SVG's viewBox is the
 * 1767×1024 frame. Measured from design/mockups-v2/Home Page (8).png; labels from Home Page (9).png. The map
 * only shows on home (station pages navigate with the keychain instead).
 */
import { STATIONS } from "../config/routes";
import { FRAME, viewportInMockupPx } from "../lib/frame";

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

export function layoutFor(): Layout {
  const vp = viewportInMockupPx();
  // On viewports wider than the mockup, spread the map across the full width
  // (same rule as --vx in global.css); sizes keep the uniform scale.
  const sx = vp.w / FRAME.W;
  return { ...FULL, x: FULL.x.map((x) => x * sx), bendX: FULL.bendX * sx, endX: vp.w + 20 };
}

export const stationY = (l: Layout, i: number) => (STATIONS[i].track === "upper" ? l.upperY : l.lowerY);
