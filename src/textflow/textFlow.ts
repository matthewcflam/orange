/**
 * Obstacle text engine (spec §11): lays paragraphs out with Pretext around a
 * draggable obstacle, one line band at a time, and renders them into a pool
 * of absolutely positioned spans. A plain class (DOM only, no React), like
 * the spray engine; ObstacleText.tsx owns its lifetime.
 *
 * Units: layout runs in CSS px. The obstacle's position and shape are kept in
 * mockup px (the column is 600 of them wide), so a resize keeps it in place
 * relative to the text.
 */
import {
  layout,
  layoutNextLineRange,
  materializeLineRange,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { gsap } from "../lib/gsap";
import { FAMILY, fontString } from "../lib/fonts";
import { prefersReducedMotion } from "../lib/motion";
import { play, type Voice } from "../audio/engine";
import { DRAG_GRAIN_GAIN } from "../config/sounds";
import { OBSTACLE } from "../config/timings";
import { justifySpacing } from "./justify";
import type { ObstacleShape } from "./obstacles";

// Only the obstacle text drags, so these register here, in the Projects chunk.
gsap.registerPlugin(Draggable, InertiaPlugin);

/** The column's width in mockup px. */
const DESIGN_WIDTH = 600;
const START: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
/** Runaway guard (an obstacle can blank lines, but never forever). */
const MAX_LINES = 1000;

interface Fragment {
  el: HTMLSpanElement;
  text: string;
  x: number;
  y: number;
  spacing: number;
  shown: boolean;
}

export interface TextFlowOptions {
  /** Sized by the engine to the laid-out text. Font size and line height
   *  come from its computed style. */
  box: HTMLElement;
  /** Empty element inside `box` that receives the line spans. */
  layer: HTMLElement;
  /** The draggable obstacle, positioned at box (0, 0) and moved by transform. */
  obstacle: HTMLElement;
  paragraphs: readonly string[];
  shape: ObstacleShape;
  /** Starting top-left of the obstacle in mockup px, relative to the box. */
  x: number;
  y: number;
}

export class TextFlow {
  private readonly o: TextFlowOptions;
  private prepared: PreparedTextWithSegments[] = [];
  private font = "";
  private spaceWidth = 0;
  private width = 0;
  private lineHeight = 0;
  /** Extra px between paragraphs (--type-para-gap). */
  private paraGap = 0;
  /** CSS px per mockup px. */
  private unit = 0;
  /** Height of the text with no obstacle; the drag bounds' bottom. */
  private freeHeight = 0;
  /** Obstacle top-left, mockup px. */
  private pos: { x: number; y: number };
  private frags: Fragment[] = [];
  private height = -1;
  private lineCount = -1;
  private readonly out: [number, number] = [0, 0];
  private readonly draggable: Draggable;
  private readonly resize: ResizeObserver;
  private loopId = 0;
  private lastTime = 0;
  private grain: Voice | null = null;
  private destroyed = false;

  constructor(options: TextFlowOptions) {
    this.o = options;
    this.pos = { x: options.x, y: options.y };
    this.draggable = Draggable.create(options.obstacle, {
      type: "x,y",
      inertia: !prefersReducedMotion(),
      zIndexBoost: false,
      cursor: "grab",
      activeCursor: "grabbing",
      onPress: () => this.startDragLoop(),
      onDragStart: () => {
        gsap.killTweensOf(this.pos);
        this.nudgeTarget = null;
      },
      // A throw can outlive the press loop's first check; keep it running.
      onThrowUpdate: () => this.startDragLoop(),
    })[0];
    options.obstacle.addEventListener("keydown", this.onKey);
    this.resize = new ResizeObserver(() => this.measure());
    this.resize.observe(options.box);
    this.measure();
  }

  destroy() {
    this.destroyed = true;
    this.resize.disconnect();
    this.draggable.kill();
    this.o.obstacle.removeEventListener("keydown", this.onKey);
    cancelAnimationFrame(this.loopId);
    gsap.killTweensOf(this.pos);
    this.grain?.stop(OBSTACLE.GRAIN_FADE);
    this.o.layer.textContent = "";
    this.o.box.style.height = "";
  }

  /** Read the box's width and type size (resize only; never per frame). */
  private measure() {
    if (this.destroyed) return;
    const { box, layer, obstacle, paragraphs, shape } = this.o;
    const cs = getComputedStyle(box);
    // Pretext needs integer px sizes that match the DOM exactly (spec §16),
    // so round once and render the spans at the same size.
    const fontPx = Math.round(parseFloat(cs.fontSize));
    const lineHeight = Math.round(parseFloat(cs.lineHeight));
    // The box carries the paragraph gap as its row-gap (project.css): a
    // custom property would come back unresolved.
    const paraGap = Math.round(parseFloat(cs.rowGap)) || 0;
    const width = box.clientWidth;
    const font = fontString(400, fontPx, FAMILY.body);
    if (font === this.font && width === this.width && lineHeight === this.lineHeight && paraGap === this.paraGap) return;

    if (font !== this.font) {
      if (!document.fonts.check(font)) {
        document.fonts.load(font).then(() => this.measure());
        return;
      }
      this.font = font;
      this.prepared = paragraphs.map((p) => prepareWithSegments(p, font));
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.font = font;
      this.spaceWidth = ctx.measureText(" ").width;
      layer.style.fontSize = `${fontPx}px`;
    }
    layer.style.lineHeight = `${lineHeight}px`;
    this.width = width;
    this.lineHeight = lineHeight;
    this.paraGap = paraGap;
    this.unit = width / DESIGN_WIDTH;
    let lines = 0;
    for (const p of this.prepared) lines += layout(p, width, lineHeight).lineCount;
    this.freeHeight = lines * lineHeight + Math.max(0, this.prepared.length - 1) * paraGap;

    obstacle.style.width = `${shape.width * this.unit}px`;
    obstacle.style.height = `${shape.height * this.unit}px`;
    const b = this.bounds();
    this.draggable.applyBounds({ minX: 0, minY: 0, maxX: b.maxX * this.unit, maxY: b.maxY * this.unit });
    this.pos.x = gsap.utils.clamp(0, b.maxX, this.pos.x);
    this.pos.y = gsap.utils.clamp(0, b.maxY, this.pos.y);
    this.place();
    this.reflow(false);
  }

  /** Largest obstacle top-left, mockup px. */
  private bounds() {
    const { shape } = this.o;
    return {
      maxX: Math.max(0, DESIGN_WIDTH - shape.width),
      maxY: Math.max(0, this.freeHeight / this.unit - shape.height),
    };
  }

  /** Move the obstacle element to `pos`. */
  private place() {
    gsap.set(this.o.obstacle, { x: this.pos.x * this.unit, y: this.pos.y * this.unit });
    this.draggable.update();
  }

  /**
   * Runs from press until the obstacle comes to rest (the end of an inertia
   * throw): follows the obstacle, reflows when it moved, and drives the
   * drag.grain loop from its speed.
   */
  private startDragLoop() {
    if (this.loopId) return;
    this.lastTime = performance.now();
    if (!this.grain) {
      this.grain = play("drag.grain", { loop: true, gain: DRAG_GRAIN_GAIN });
      this.grain?.setGain(0, 0.001);
    }
    this.loopId = requestAnimationFrame(this.dragFrame);
  }

  private dragFrame = (now: number) => {
    const { obstacle } = this.o;
    // GSAP's cached transform, not a layout read.
    const x = (gsap.getProperty(obstacle, "x") as number) / this.unit;
    const y = (gsap.getProperty(obstacle, "y") as number) / this.unit;
    const dt = Math.max(1, now - this.lastTime) / 1000;
    this.lastTime = now;
    const speed = Math.hypot(x - this.pos.x, y - this.pos.y) / dt;
    this.grain?.setGain(Math.min(1, speed / OBSTACLE.GRAIN_FULL_SPEED_PX), OBSTACLE.GRAIN_TIME_CONSTANT);
    if (x !== this.pos.x || y !== this.pos.y) {
      this.pos.x = x;
      this.pos.y = y;
      this.reflow(true);
    }
    if (this.draggable.isPressed || this.draggable.isThrowing) {
      this.loopId = requestAnimationFrame(this.dragFrame);
    } else {
      this.loopId = 0;
      this.grain?.stop(OBSTACLE.GRAIN_FADE);
      this.grain = null;
    }
  };

  private onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? OBSTACLE.NUDGE_SHIFT_PX : OBSTACLE.NUDGE_PX;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    const b = this.bounds();
    // Nudges add up from where the last one is heading, so a held key
    // doesn't lag behind.
    const target = (this.nudgeTarget ??= { ...this.pos });
    target.x = gsap.utils.clamp(0, b.maxX, target.x + d[0]);
    target.y = gsap.utils.clamp(0, b.maxY, target.y + d[1]);
    gsap.to(this.pos, {
      x: target.x,
      y: target.y,
      duration: prefersReducedMotion() ? 0 : OBSTACLE.NUDGE_DURATION,
      ease: OBSTACLE.NUDGE_EASE,
      overwrite: true,
      onUpdate: () => {
        this.place();
        this.reflow(true);
      },
      onComplete: () => {
        this.nudgeTarget = null;
      },
    });
  };
  private nudgeTarget: { x: number; y: number } | null = null;

  /**
   * Lay every paragraph out around the obstacle (spec §11.2) and write the
   * result to the spans. `ticks`: play text.tick if the line count changed.
   */
  private reflow(ticks: boolean) {
    const { shape, box } = this.o;
    const { width, lineHeight: lh, paraGap, unit, out } = this;
    if (!unit) return;
    const pad = OBSTACLE.PADDING_PX * unit;
    const minSlot = OBSTACLE.MIN_SLOT_PX * unit;
    const inset = OBSTACLE.BAND_INSET_PX;
    const ox = this.pos.x * unit;
    const oy = this.pos.y;
    let line = 0;
    let n = 0;
    // px of paragraph gaps above the current line.
    let gaps = 0;

    for (const [i, prepared] of this.prepared.entries()) {
      if (i > 0) gaps += paraGap;
      const segments = prepared.segments.length;
      let cursor = START;
      let done = segments === 0;
      while (!done && line < MAX_LINES) {
        const top = line * lh + gaps;
        // Slots: the full line, or the parts left and right of the obstacle.
        let leftEnd = width;
        let rightStart = width;
        if (shape.blocked((top / unit) + inset - oy, (top + lh) / unit - inset - oy, out)) {
          leftEnd = ox + out[0] * unit - pad;
          rightStart = ox + out[1] * unit + pad;
        }
        for (let s = 0; s < 2 && !done; s++) {
          const start = s === 0 ? 0 : rightStart;
          const end = s === 0 ? leftEnd : width;
          const slot = end - start;
          if (slot < minSlot) continue;
          const range = layoutNextLineRange(prepared, cursor, slot);
          if (!range) {
            done = true;
            break;
          }
          // A slot too narrow for the next word makes Pretext break inside
          // it; skip the slot and let the word move on instead.
          if (range.end.graphemeIndex !== 0 && slot < width) continue;
          const last = range.end.segmentIndex >= segments;
          const text = materializeLineRange(prepared, range).text.trimEnd();
          this.write(n++, text, start, top, justifySpacing(text, range.width, slot, last, this.spaceWidth));
          cursor = range.end;
          done = last;
        }
        line++;
      }
    }

    for (let i = n; i < this.frags.length; i++) {
      const f = this.frags[i];
      if (f.shown) {
        f.shown = false;
        f.el.hidden = true;
      }
    }
    const height = line * lh + gaps;
    if (height !== this.height) {
      this.height = height;
      box.style.height = `${height}px`;
    }
    if (ticks && this.lineCount !== -1 && line !== this.lineCount) play("text.tick");
    this.lineCount = line;
  }

  /** Update fragment i, touching only what changed (spec §11.3). */
  private write(i: number, text: string, x: number, y: number, spacing: number) {
    let f = this.frags[i];
    if (!f) {
      const el = document.createElement("span");
      this.o.layer.appendChild(el);
      f = { el, text: "", x: NaN, y: NaN, spacing: 0, shown: true };
      this.frags[i] = f;
    }
    if (!f.shown) {
      f.shown = true;
      f.el.hidden = false;
    }
    if (f.text !== text) {
      f.text = text;
      f.el.textContent = text;
    }
    if (f.x !== x || f.y !== y) {
      f.x = x;
      f.y = y;
      f.el.style.transform = `translate(${x}px, ${y}px)`;
    }
    if (f.spacing !== spacing) {
      f.spacing = spacing;
      f.el.style.wordSpacing = spacing ? `${spacing}px` : "";
    }
  }
}
