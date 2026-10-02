/**
 * How fast a hand moves the can along a "who?" guide path. Pure math, no DOM:
 * the runtime (sprayEngine.ts) and scripts/spray-pace.mjs both use it.
 *
 * The model, from handwriting research:
 * - Two-thirds power law (Lacquaniti, Terzuolo & Viviani 1983): speed along
 *   the path goes as the radius of curvature to the 1/3, v = K·R^(1/3) =
 *   K·κ^(−1/3). Straight runs are fast; tight turns are 3–5× slower.
 * - Strokes start and end near rest (bell-shaped speed profiles, Plamondon's
 *   lognormal model), so speed ramps up off the start and down into the end.
 * - The end of a familiar word speeds up: the last stroke rushes, even
 *   through its curves (FINISH_*).
 *
 * The per-segment durations in config/sprayPace.ts set how long each segment
 * takes. This model only shapes the speed *within* a segment (and gives the
 * script its starting values).
 */

export const PACE_MODEL = {
  /** Power-law exponent: v ∝ (κ + KAPPA0)^(−BETA). 1/3 is the measured value. */
  BETA: 1 / 3,
  /** Curvature floor (1/px): bends gentler than a 300px radius count as straight. */
  KAPPA0: 1 / 300,
  /** Curvature is measured from points ±CURV_SPAN_PX apart… */
  CURV_SPAN_PX: 6,
  /** …then averaged over this window, so it follows the shape, not the sampling. */
  CURV_SMOOTH_PX: 12,
  /** Speed rises from RAMP_FLOOR × cruise over the first RAMP_IN_PX of a
   *  stroke and falls back over the last RAMP_OUT_PX. */
  RAMP_IN_PX: 40,
  RAMP_OUT_PX: 30,
  RAMP_FLOOR: 0.3,
  /** The word's last stroke speeds up to FINISH_BOOST × over its final part,
   *  starting FINISH_FROM of the way along. */
  FINISH_BOOST: 1.7,
  FINISH_FROM: 0.5,
  /** Speed is smoothed over this window at runtime so a fast segment next to
   *  a slow one blends instead of jerking at the anchor. */
  SEAM_SMOOTH_PX: 16,
} as const;

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** A guide path sampled every `step` px of arc length. */
export interface Guide {
  /** x, y pairs at `segments + 1` evenly spaced points along the path. */
  pts: Float32Array;
  /** Number of sample intervals (not anchor segments). */
  segments: number;
  /** Arc length per sample interval (≤ 1px). */
  step: number;
  length: number;
  /** Arc length at each anchor point: anchors.length = anchor segments + 1. */
  anchors: number[];
}

type Pt = [number, number];

/** Absolute M / L / C only (who-spray.svg uses nothing else). */
export function parsePath(d: string): Pt[][] {
  const tokens = d.match(/[MLC]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const segs: Pt[][] = [];
  let cmd = "";
  let cur: Pt = [0, 0];
  for (let i = 0; i < tokens.length; ) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    const n = (k: number) => Number(tokens[i + k]);
    if (cmd === "M") {
      cur = [n(0), n(1)];
      i += 2;
    } else if (cmd === "L") {
      const p: Pt = [n(0), n(1)];
      segs.push([cur, p]);
      cur = p;
      i += 2;
    } else if (cmd === "C") {
      const p: Pt = [n(4), n(5)];
      segs.push([cur, [n(0), n(1)], [n(2), n(3)], p]);
      cur = p;
      i += 6;
    } else {
      throw new Error(`who-spray.svg: unsupported path command "${cmd}"`);
    }
  }
  return segs;
}

function bezier(s: Pt[], t: number): Pt {
  if (s.length === 2) return [s[0][0] + (s[1][0] - s[0][0]) * t, s[0][1] + (s[1][1] - s[0][1]) * t];
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, e = t * t * t;
  return [a * s[0][0] + b * s[1][0] + c * s[2][0] + e * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + e * s[3][1]];
}

/** Sample a path's `d` every ≤ `maxStep` px of arc length. */
export function sampleGuide(d: string, maxStep = 1): Guide {
  // A dense polyline first (arc length per point), then even resampling.
  const DENSE = 256;
  const xs: number[] = [];
  const ys: number[] = [];
  const along: number[] = [];
  const anchors = [0];
  let total = 0;
  for (const seg of parsePath(d)) {
    let prev = bezier(seg, 0);
    if (xs.length === 0) {
      xs.push(prev[0]);
      ys.push(prev[1]);
      along.push(0);
    }
    for (let k = 1; k <= DENSE; k++) {
      const p = bezier(seg, k / DENSE);
      total += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      xs.push(p[0]);
      ys.push(p[1]);
      along.push(total);
      prev = p;
    }
    anchors.push(total);
  }
  const segments = Math.max(1, Math.ceil(total / maxStep));
  const step = total / segments;
  const pts = new Float32Array((segments + 1) * 2);
  let j = 0;
  for (let i = 0; i <= segments; i++) {
    const s = step * i;
    while (j < along.length - 2 && along[j + 1] < s) j++;
    const span = along[j + 1] - along[j];
    const t = span > 0 ? Math.min(Math.max((s - along[j]) / span, 0), 1) : 0;
    pts[i * 2] = xs[j] + (xs[j + 1] - xs[j]) * t;
    pts[i * 2 + 1] = ys[j] + (ys[j + 1] - ys[j]) * t;
  }
  return { pts, segments, step, length: total, anchors };
}

// ---------------------------------------------------------------------------
// Speed
// ---------------------------------------------------------------------------

const smoothstep = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Moving average with a window of ±`half` samples (edges clamped). */
function smooth(v: Float32Array, half: number): Float32Array {
  if (half < 1) return v;
  const n = v.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let count = 0;
    for (let k = Math.max(0, i - half); k <= Math.min(n - 1, i + half); k++) {
      sum += v[k];
      count++;
    }
    out[i] = sum / count;
  }
  return out;
}

/** Relative speed at every sample (unitless; only ratios matter). */
export function speedShape(g: Guide, { finish = false } = {}): Float32Array {
  const M = PACE_MODEL;
  const n = g.segments + 1;
  const { pts, step } = g;
  // Curvature from three points ±span apart: κ = 2·|cross| / (|a|·|b|·|c|).
  const span = Math.max(1, Math.round(M.CURV_SPAN_PX / step));
  const kappa = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - span);
    const c = Math.min(n - 1, i + span);
    if (c - a < 2) continue;
    const ax = pts[a * 2], ay = pts[a * 2 + 1];
    const bx = pts[i * 2], by = pts[i * 2 + 1];
    const cx = pts[c * 2], cy = pts[c * 2 + 1];
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const l = Math.hypot(bx - ax, by - ay) * Math.hypot(cx - bx, cy - by) * Math.hypot(cx - ax, cy - ay);
    kappa[i] = l > 0 ? (2 * Math.abs(cross)) / l : 0;
  }
  const k = smooth(kappa, Math.round(M.CURV_SMOOTH_PX / 2 / step));

  const v = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = i * step;
    let speed = (k[i] + M.KAPPA0) ** -M.BETA;
    const rampIn = smoothstep(s / M.RAMP_IN_PX);
    const rampOut = smoothstep((g.length - s) / M.RAMP_OUT_PX);
    speed *= M.RAMP_FLOOR + (1 - M.RAMP_FLOOR) * Math.min(rampIn, rampOut);
    if (finish) speed *= 1 + (M.FINISH_BOOST - 1) * smoothstep((s / g.length - M.FINISH_FROM) / (1 - M.FINISH_FROM));
    v[i] = speed;
  }
  return v;
}

/** Interval j (between samples j and j+1) overlaps anchor segment `seg` by this many px. */
function overlap(g: Guide, j: number, seg: number): number {
  const a = j * g.step;
  const b = a + g.step;
  return Math.max(0, Math.min(b, g.anchors[seg + 1]) - Math.max(a, g.anchors[seg]));
}

/** Time (in the units of 1/speed) each anchor segment takes at speeds `v`. */
export function segmentTimes(g: Guide, v: Float32Array): number[] {
  const out = new Array<number>(g.anchors.length - 1).fill(0);
  forEachOverlap(g, (j, seg, px) => (out[seg] += px / ((v[j] + v[j + 1]) / 2)));
  return out;
}

function forEachOverlap(g: Guide, fn: (j: number, seg: number, px: number) => void) {
  let seg = 0;
  for (let j = 0; j < g.segments; j++) {
    while (seg < g.anchors.length - 2 && g.anchors[seg + 1] <= j * g.step) seg++;
    for (let s = seg; s < g.anchors.length - 1 && g.anchors[s] < (j + 1) * g.step; s++) {
      const px = overlap(g, j, s);
      if (px > 0) fn(j, s, px);
    }
  }
}

/**
 * Cumulative time (seconds) at every sample, so each anchor segment takes
 * exactly `segMs` while speed within it follows `shape`. Speeds are blended
 * across anchors (SEAM_SMOOTH_PX) and the segments re-fitted, twice.
 */
export function timeMap(g: Guide, shape: Float32Array, segMs: readonly number[]): Float32Array {
  const n = g.segments + 1;
  let v = shape;
  for (let pass = 0; pass < 3; pass++) {
    // Fit: scale speeds within each segment so its time matches segMs.
    const have = segmentTimes(g, v);
    const fitted = new Float32Array(n);
    const weight = new Float32Array(n);
    forEachOverlap(g, (j, seg, px) => {
      const k = have[seg] > 0 ? have[seg] / (segMs[seg] / 1000) : 1;
      for (const i of [j, j + 1]) {
        fitted[i] += v[i] * k * px;
        weight[i] += px;
      }
    });
    for (let i = 0; i < n; i++) fitted[i] = weight[i] > 0 ? fitted[i] / weight[i] : v[i];
    v = pass < 2 ? smooth(fitted, Math.round(PACE_MODEL.SEAM_SMOOTH_PX / 2 / g.step)) : fitted;
  }
  // Integrate, rescaling each segment's share so every anchor lands on its
  // exact time (averaging at the seams leaves small errors).
  const fix = segmentTimes(g, v).map((have, seg) => (have > 0 ? segMs[seg] / 1000 / have : 0));
  const dt = new Float32Array(g.segments);
  forEachOverlap(g, (j, seg, px) => (dt[j] += (px / ((v[j] + v[j + 1]) / 2)) * fix[seg]));
  const t = new Float32Array(n);
  for (let j = 0; j < g.segments; j++) t[j + 1] = t[j] + dt[j];
  return t;
}

/** Arc length reached at time `time` (seconds) on a time map. */
export function alongAt(g: Guide, t: Float32Array, time: number): number {
  const n = t.length;
  if (time <= 0) return 0;
  if (time >= t[n - 1]) return g.length;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid] <= time) lo = mid;
    else hi = mid;
  }
  const span = t[hi] - t[lo];
  return (lo + (span > 0 ? (time - t[lo]) / span : 0)) * g.step;
}

/** Fastest speed (px/s) on a time map. */
export function maxSpeed(g: Guide, t: Float32Array): number {
  let max = 0;
  for (let j = 1; j < t.length; j++) {
    const dt = t[j] - t[j - 1];
    if (dt > 0) max = Math.max(max, g.step / dt);
  }
  return max;
}
