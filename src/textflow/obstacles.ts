/**
 * Obstacle shapes for ObstacleText (spec §11.4). A shape lives in its own
 * units (mockup px at its design size) with its top-left at (0, 0), and
 * reports the horizontal span it blocks inside a band of rows. Exact and
 * allocation-free: the result is written into `out`.
 */
export interface ObstacleShape {
  /** Size in mockup px. */
  width: number;
  height: number;
  /** Blocked [start, end] (shape-local x) for rows top…bottom, written into
   *  `out`. Returns false when the band misses the shape. */
  blocked(top: number, bottom: number, out: [number, number]): boolean;
}

/** The point of [top, bottom] closest to c, minus c. */
const nearestDy = (top: number, bottom: number, c: number) => (c < top ? top - c : c > bottom ? bottom - c : 0);

/** A circle of diameter `d` (Oyster News). */
export function circle(d: number): ObstacleShape {
  const r = d / 2;
  return {
    width: d,
    height: d,
    blocked(top, bottom, out) {
      const dy = nearestDy(top, bottom, r);
      if (Math.abs(dy) >= r) return false;
      const hw = Math.sqrt(r * r - dy * dy);
      out[0] = r - hw;
      out[1] = r + hw;
      return true;
    },
  };
}

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** A union of ellipses (the mango). Their per-row spans always overlap, so
 *  the union is min start / max end. */
export function ellipseUnion(width: number, height: number, ellipses: readonly Ellipse[]): ObstacleShape {
  return {
    width,
    height,
    blocked(top, bottom, out) {
      let start = Infinity;
      let end = -Infinity;
      for (const e of ellipses) {
        const dy = nearestDy(top, bottom, e.cy);
        if (Math.abs(dy) >= e.ry) continue;
        const hw = e.rx * Math.sqrt(1 - (dy * dy) / (e.ry * e.ry));
        start = Math.min(start, e.cx - hw);
        end = Math.max(end, e.cx + hw);
      }
      if (start > end) return false;
      out[0] = start;
      out[1] = end;
      return true;
    },
  };
}

/** mango.svg's two ellipses in its 39×67 viewBox; the thin stem is ignored. */
export const MANGO = ellipseUnion(39, 67, [
  { cx: 22.5, cy: 35.6, rx: 16.5, ry: 30.5 },
  { cx: 19, cy: 31.6, rx: 19, ry: 26.5 },
]);
