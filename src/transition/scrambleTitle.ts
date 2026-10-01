/**
 * The transition title, "Now arriving at: <name>", scramble-typed on the
 * cover. It is set as groups (the lead and the name), each placed by CSS.
 * A port of 2xa.studio's typer (`typer-*.js`), "inout" mode: it types in,
 * then straight back out, at TITLE_FPS. Each character starts at its own
 * point on a cubic-bezier stagger and, while it is in motion, shows one of the
 * box variants (filled, inverse, accent, border…; styled in transition.css).
 *
 * Frames come from elapsed time on the GSAP ticker instead of 2xa's
 * setInterval, so the title stays in step with the cover.
 */
import { gsap } from "../lib/gsap";
import { TRANSITION } from "../config/timings";

const T = TRANSITION;

const VARIATIONS = ["charFill", "charInverse", "charAccent", "charAccentInverse", "charAccentFill", "charBorder"];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const snap = (v: number, step: number) => Math.round(v / step) * step;
const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  ((v - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

/** CSS cubic-bezier(x1, y1, x2, y2) evaluated at x (2xa's helper). */
function cubicBezierAt(x: number, x1: number, y1: number, x2: number, y2: number, eps = 1e-6): number {
  const bx = (u: number) => 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3;
  const by = (u: number) => 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3;
  const dx = (u: number) => 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u ** 2 * (1 - x2);
  let u = x;
  for (let i = 0; i < 8; i++) {
    const err = bx(u) - x;
    if (Math.abs(err) < eps) return by(u);
    const d = dx(u);
    if (Math.abs(d) < 1e-6) break;
    u -= err / d;
  }
  let lo = 0;
  let hi = 1;
  u = x;
  while (lo < hi) {
    const v = bx(u);
    if (Math.abs(v - x) < eps) break;
    if (x > v) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return by(u);
}

interface CharNode {
  el: HTMLSpanElement;
  /** When this character starts, as a fraction of the type-in. */
  cp: number;
  cls: string;
}

export class ScrambleTitle {
  readonly el = document.createElement("span");

  private chars: CharNode[] = [];
  private frames = 0;
  private denominator = 1;
  private variations = [...VARIATIONS];
  private start = 0;
  private done: (() => void) | null = null;

  constructor() {
    this.el.className = "transition__title";
    this.el.dataset.state = "initial";
  }

  /** Type `groups` in and back out. Resolves when it has typed out (or is replaced). */
  run(groups: string[]): Promise<void> {
    this.stop();
    this.build(groups);
    if (!this.chars.length) return Promise.resolve();
    this.variations.sort(() => 0.5 - Math.random());
    this.el.dataset.state = "running";
    this.start = gsap.ticker.time;
    this.apply(0);
    gsap.ticker.add(this.tick);
    return new Promise((resolve) => (this.done = resolve));
  }

  /** Reduced motion: the name, plainly, until hidden. */
  showStatic(groups: string[]): void {
    this.stop();
    this.build(groups);
    for (const c of this.chars) this.setClass(c, "char");
    this.el.dataset.state = "static";
  }

  hide(): void {
    this.stop();
    this.el.dataset.state = "initial";
  }

  private stop() {
    gsap.ticker.remove(this.tick);
    this.done?.();
    this.done = null;
  }

  /** One stagger runs across all groups, so the name types after the lead. */
  private build(groups: string[]) {
    this.el.textContent = "";
    this.chars = [];
    const length = groups.join("").replace(/\s/g, "").length;
    const divisor = length > 1 ? length - 1 : 1;
    this.frames = length ? T.TITLE_FPS * (1 + length * 0.01) : 0;
    this.denominator = this.frames - this.frames * T.TITLE_CYCLE_LENGTH || 1;
    let i = 0;
    groups.forEach((text, g) => {
      const group = document.createElement("span");
      group.className = `transition__group transition__group--${g}`;
      for (const part of text.split(/(\s+)/)) {
        if (part.trim() === "") {
          if (part) group.append(part);
          continue;
        }
        const word = document.createElement("span");
        word.className = "word";
        for (const ch of part) {
          const el = document.createElement("span");
          el.className = "char charInit";
          el.textContent = ch;
          const cp = snap(cubicBezierAt(i / divisor, 0, 0.75, 0.75, 0), 0.05);
          this.chars.push({ el, cp, cls: el.className });
          word.append(el);
          i += 1;
        }
        group.append(word);
      }
      this.el.append(group);
    });
  }

  private tick = () => {
    const total = this.frames * 2;
    const frame = clamp(Math.floor((gsap.ticker.time - this.start) * T.TITLE_FPS), 0, total);
    this.apply(frame);
    if (frame >= total) {
      this.stop();
      this.el.dataset.state = "initial";
    }
  };

  private apply(frame: number) {
    const out = frame > this.frames;
    const h = (out ? frame - this.frames : frame) / this.denominator;
    for (const c of this.chars) {
      const e = clamp(snap(h - c.cp, 0.1), 0, 1);
      let variant = "charInit";
      if (e > 0) variant = this.variations[Math.round(mapRange(e, 0, 1, 0, T.TITLE_CYCLES)) % this.variations.length];
      if (e >= 1) variant = "";
      const moving = variant ? `char ${variant}` : "char";
      const cls = out
        ? e <= 0 ? "char" : e >= 1 ? "char charInit" : moving
        : e <= 0 ? "char charInit" : e >= 1 ? "char" : moving;
      this.setClass(c, cls);
    }
  }

  private setClass(c: CharNode, cls: string) {
    if (cls === c.cls) return;
    c.cls = cls;
    c.el.className = cls;
  }
}

export const title = new ScrambleTitle();
