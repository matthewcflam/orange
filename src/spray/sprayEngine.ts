/**
 * "who?" spray engine (spec §7.2). A plain class; React only mounts the canvas.
 *
 * The guide paths in who-spray.svg are never shown. Each is sampled once into
 * a point table, then a GSAP tween moves the nozzle along it. Every update
 * stamps Gaussian dot clusters between the previous and current nozzle
 * position (≤ STEP_PX apart) and sets the hiss level from the same nozzle
 * speed. The can's flow is constant per second, so slow stretches (stroke
 * ends, the ?-dot) get heavier paint.
 *
 * The canvas is never cleared during a spray. Every stamp is recorded and the
 * dots come from a seeded PRNG, so a resize (or a devicePixelRatio change)
 * replays the exact same picture at the new size.
 */
import whoSvg from "../../assets-src/svg/who-spray.svg?raw";
import { gsap } from "../lib/gsap";
import { readToken } from "../lib/tokens";
import { SPRAY } from "../config/timings";
import { play } from "../audio/engine";
import { startHiss, type Hiss } from "../audio/sprayHiss";

// ---------------------------------------------------------------------------
// Guide paths (sampled once per session)
// ---------------------------------------------------------------------------

/** Guide sampling interval, in SVG units (= mockup px). */
const SAMPLE_STEP = 1;
const TAU = Math.PI * 2;
const SVG_NS = "http://www.w3.org/2000/svg";

interface Guide {
  /** x, y pairs at `segments + 1` evenly spaced points along the path. */
  pts: Float32Array;
  segments: number;
  length: number;
}

const guideDoc = new DOMParser().parseFromString(whoSvg, "image/svg+xml");
const [, , VIEW_W, VIEW_H] = guideDoc.documentElement.getAttribute("viewBox")!.split(/\s+/).map(Number);
/** Guide box size in mockup px; the canvas adds CANVAS_PAD_PX on every side. */
export const WHO_BOX = { width: VIEW_W, height: VIEW_H } as const;

let guides: Guide[] | null = null;

/** Paths in document order = draw order: w, h, o, ?-hook, ?-dot. */
function loadGuides(): Guide[] {
  if (guides) return guides;
  // getPointAtLength needs the paths in a rendered document (Safari).
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("style", "position:absolute;width:0;height:0;visibility:hidden");
  document.body.append(svg);
  guides = Array.from(guideDoc.querySelectorAll("path"), (source) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", source.getAttribute("d")!);
    svg.append(path);
    const length = path.getTotalLength();
    const segments = Math.max(1, Math.ceil(length / SAMPLE_STEP));
    const pts = new Float32Array((segments + 1) * 2);
    for (let i = 0; i <= segments; i++) {
      const p = path.getPointAtLength((length * i) / segments);
      pts[i * 2] = p.x;
      pts[i * 2 + 1] = p.y;
    }
    return { pts, segments, length };
  });
  svg.remove();
  return guides;
}

/** Point at distance `along` on a guide (linear between samples). */
function pointAt(g: Guide, along: number): [number, number] {
  const f = g.length > 0 ? Math.min(Math.max(along / g.length, 0), 1) * g.segments : 0;
  const i = Math.min(Math.floor(f), g.segments - 1);
  const t = f - i;
  const p = g.pts;
  return [p[i * 2] + (p[i * 2 + 2] - p[i * 2]) * t, p[i * 2 + 1] + (p[i * 2 + 3] - p[i * 2 + 1]) * t];
}

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

/** mulberry32: small, fast, seedable. Replays need the same dot sequence. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = ([a, b]: readonly [number, number], t: number) => a + (b - a) * t;
const randomIn = (range: readonly [number, number]) => lerp(range, Math.random());

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

interface Drip {
  x: number;
  y: number;
  length: number;
  width: number;
  /** 0 → 1 as it grows; replays draw up to here. */
  progress: number;
}

export interface SprayOptions {
  /** Duration multiplier: 1 = full, SPRAY.RESPRAY_SPEED on returns home. */
  speed?: number;
  /** Reduced motion: render the finished picture in one frame, silently. */
  instant?: boolean;
}

export class SprayEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly color = readToken("--color-orange");
  private readonly resizeObserver: ResizeObserver;
  private dpr = 1;
  private scale = 1;
  private dprQuery: MediaQueryList | null = null;
  private readonly onDprChange = () => this.resize();

  /** Recorded stamps: x, y, dot count. Dots come from `rng`, seeded by `seed`. */
  private stamps: number[] = [];
  private drips: Drip[] = [];
  private seed = 1;
  private rng = seeded(1);

  private timeline: gsap.core.Timeline | null = null;
  private hiss: Hiss | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  /** Start a fresh spray. Returns its timeline (null when instant). */
  spray({ speed = 1, instant = false }: SprayOptions = {}): gsap.core.Timeline | null {
    this.clear();
    const tl = gsap.timeline({ onComplete: () => this.stopHiss() });
    this.timeline = tl;

    if (!instant) {
      // The rattle leads the first stroke (§7.2); the hiss starts silent.
      tl.call(() => {
        play("spray.rattle");
        this.hiss ??= startHiss();
      }, undefined, 0);
    }

    let t = instant ? 0 : SPRAY.RATTLE_LEAD;
    let lastEnd = t;
    let drips = 0;
    for (const guide of loadGuides()) {
      const duration = Math.max(SPRAY.MIN_STROKE, guide.length / SPRAY.NOZZLE_SPEED_PX) * speed;
      tl.add(this.strokeTween(guide, duration, speed), t);
      lastEnd = t + duration;

      if (drips < SPRAY.DRIP_MAX && Math.random() < SPRAY.DRIP_CHANCE) {
        drips++;
        tl.add(this.dripTween(guide), lastEnd);
      }
      t = lastEnd + gsap.utils.random(SPRAY.LIFT_MIN, SPRAY.LIFT_MAX) * speed;
    }
    // Drips keep growing silently after the last stroke.
    tl.call(() => this.stopHiss(), undefined, lastEnd);

    if (instant) {
      tl.progress(1).kill();
      this.timeline = null;
      return null;
    }
    if (import.meta.env.DEV) Object.assign(window, { __whoSpray: tl });
    return tl;
  }

  /** Stop any spray and wipe the canvas (before a respray, §7.2 step 5). */
  clear(): void {
    this.timeline?.kill();
    this.timeline = null;
    this.stopHiss();
    this.stamps = [];
    this.drips = [];
    this.seed = (Math.random() * 2 ** 32) >>> 0;
    this.rng = seeded(this.seed);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.applyTransform();
  }

  destroy(): void {
    this.clear();
    this.resizeObserver.disconnect();
    this.dprQuery?.removeEventListener("change", this.onDprChange);
  }

  // -------------------------------------------------------------------------

  private stopHiss() {
    this.hiss?.stop();
    this.hiss = null;
  }

  /** Moves the nozzle along one guide. */
  private strokeTween(guide: Guide, duration: number, speed: number): gsap.core.Tween {
    const nozzle = { along: 0 };
    let lastAlong = 0;
    let lastTime = 0;
    // Timeline seconds are scaled by `speed`, so per-timeline-second rates are too.
    const flow = SPRAY.FLOW_DOTS_PER_S / speed;
    const peakSpeed = (2 * SPRAY.NOZZLE_SPEED_PX) / speed;

    const tween: gsap.core.Tween = gsap.to(nozzle, {
      along: guide.length,
      duration,
      ease: SPRAY.STROKE_EASE,
      onStart: () => {
        lastAlong = 0;
        lastTime = 0;
        this.hiss?.set(SPRAY.HISS_FLOOR);
      },
      onUpdate: () => {
        const time = tween.time();
        const dt = time - lastTime;
        const dist = nozzle.along - lastAlong;
        // Scrubbing backwards (GSDevTools) paints nothing.
        if (dt > 0 && dist >= 0) {
          this.paint(guide, lastAlong, dist, flow * dt);
          const level = Math.min(dist / dt / peakSpeed, 1);
          this.hiss?.set(SPRAY.HISS_FLOOR + (1 - SPRAY.HISS_FLOOR) * level);
        }
        lastTime = time;
        lastAlong = nozzle.along;
      },
      // The can lifts: the hiss cuts until the next stroke.
      onComplete: () => this.hiss?.set(0),
    });
    return tween;
  }

  /** A slow drip below the stroke's end, where the nozzle lingered. */
  private dripTween(guide: Guide): gsap.core.Tween {
    const [x, y] = pointAt(guide, guide.length);
    const drip: Drip = {
      x: x + gsap.utils.random(-0.5, 0.5) * SPRAY.CORE_SIGMA_PX,
      y: y + SPRAY.CORE_SIGMA_PX,
      length: randomIn(SPRAY.DRIP_LENGTH_PX),
      width: randomIn(SPRAY.DRIP_WIDTH_PX),
      progress: 0,
    };
    let drawn = 0;
    return gsap.to(drip, {
      progress: 1,
      duration: SPRAY.DRIP_DURATION,
      ease: SPRAY.DRIP_EASE,
      onStart: () => void (this.drips.includes(drip) || this.drips.push(drip)),
      onUpdate: () => {
        if (drip.progress > drawn) this.drawDrip(drip, drawn, drip.progress);
        drawn = drip.progress;
      },
    });
  }

  /** Emit `dots` worth of paint spread along [from, from + dist] of a guide. */
  private paint(guide: Guide, from: number, dist: number, dots: number) {
    // A stamp at least every STEP_PX, and enough stamps to lay down all the
    // paint: a dwelling nozzle (the ?-dot) piles many stamps onto one spot.
    const stamps = Math.max(1, Math.ceil(dist / SPRAY.STEP_PX), Math.ceil(dots / SPRAY.DOTS_MAX));
    const perStamp = Math.round(Math.min(Math.max(dots / stamps, SPRAY.DOTS_MIN), SPRAY.DOTS_MAX));
    for (let s = 1; s <= stamps; s++) {
      const [x, y] = pointAt(guide, from + (dist * s) / stamps);
      this.stamps.push(x, y, perStamp);
      this.drawStamp(x, y, perStamp);
    }
  }

  /** One Gaussian cluster: a dense core, sparse overspray, the odd spit. */
  private drawStamp(x: number, y: number, n: number) {
    const { ctx, rng } = this;
    for (let k = 0; k < n; k++) {
      const over = rng() < SPRAY.OVERSPRAY_SHARE;
      const sigma = over ? SPRAY.OVERSPRAY_SIGMA_PX : SPRAY.CORE_SIGMA_PX;
      // Box–Muller: a 2D Gaussian offset.
      const r = sigma * Math.sqrt(-2 * Math.log(1 - rng()));
      const a = TAU * rng();
      const size = lerp(over ? SPRAY.OVERSPRAY_DOT_RADIUS_PX : SPRAY.CORE_DOT_RADIUS_PX, rng());
      ctx.globalAlpha = lerp(over ? SPRAY.OVERSPRAY_ALPHA : SPRAY.CORE_ALPHA, rng());
      ctx.beginPath();
      ctx.arc(x + r * Math.cos(a), y + r * Math.sin(a), size, 0, TAU);
      ctx.fill();
    }
    if (rng() < SPRAY.SPIT_CHANCE) {
      const r = SPRAY.SPIT_SIGMA_PX * Math.sqrt(-2 * Math.log(1 - rng()));
      const a = TAU * rng();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x + r * Math.cos(a), y + r * Math.sin(a), lerp(SPRAY.SPIT_RADIUS_PX, rng()), 0, TAU);
      ctx.fill();
    }
  }

  private drawDrip(d: Drip, p0: number, p1: number) {
    const { ctx } = this;
    ctx.globalAlpha = 1;
    ctx.lineWidth = d.width;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y + d.length * p0);
    ctx.lineTo(d.x, d.y + d.length * p1);
    ctx.stroke();
    if (p1 >= 1) {
      // A bead collects at the tip.
      ctx.beginPath();
      ctx.arc(d.x, d.y + d.length, d.width * 0.8, 0, TAU);
      ctx.fill();
    }
  }

  // -------------------------------------------------------------------------
  // Sizing (§12 rule 4: every canvas handles devicePixelRatio)
  // -------------------------------------------------------------------------

  /** Called on resize or a devicePixelRatio change (window moved to another
   *  screen), never from an animation frame. */
  private resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.dprQuery?.removeEventListener("change", this.onDprChange);
    this.dprQuery = window.matchMedia(`(resolution: ${this.dpr}dppx)`);
    this.dprQuery.addEventListener("change", this.onDprChange);
    this.scale = width / (VIEW_W + 2 * SPRAY.CANVAS_PAD_PX);
    this.canvas.width = Math.max(1, Math.round(width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(height * this.dpr));
    this.replay();
  }

  /** Canvas units = guide SVG units (mockup px), offset by the pad. */
  private applyTransform() {
    const k = this.dpr * this.scale;
    const pad = k * SPRAY.CANVAS_PAD_PX;
    const { ctx } = this;
    ctx.setTransform(k, 0, 0, k, pad, pad);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineCap = "round";
  }

  /** Redraw everything recorded so far, identically (same seed). */
  private replay() {
    this.applyTransform(); // resizing the canvas already cleared it and reset state
    this.rng = seeded(this.seed);
    const s = this.stamps;
    for (let i = 0; i < s.length; i += 3) this.drawStamp(s[i], s[i + 1], s[i + 2]);
    for (const d of this.drips) this.drawDrip(d, 0, d.progress);
  }
}
