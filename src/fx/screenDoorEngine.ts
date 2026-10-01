/**
 * Screen door: the page seen as a close-up LCD panel. A plain class like the
 * spray engine; React only mounts the canvas (fx/ScreenDoor.tsx).
 *
 * The shader outputs a *multiply factor* and `.layer--fx` blends with
 * mix-blend-mode: multiply, so white turns into a faint RGB subpixel grid and
 * black stays black. On top of the grid:
 * - shimmer: a soft refresh bar rolling down the panel, per-row flicker and
 *   sparse glinting pixels,
 * - grain that changes every frame,
 * - a patch where the pointer is, where the grid shows more strongly,
 * - broken zones (screenDoorImpact, fed by the "who?" spray): the panel is a
 *   grid of driver zones, like a real panel's driver / backlight zones. A hit
 *   kills the zone under it (sometimes a neighbour too): it goes black, holds
 *   for a log-normal time (most return fast, a few linger), blinks back a few
 *   times, then snaps back with a burst of saturated subpixels and slipping
 *   rows. The zones' timelines run on the CPU and reach the shader as a tiny
 *   texture, one texel per zone (L = black, A = fringe).
 *
 * One texel per CSS px (rounded to whole device px), upscaled with
 * image-rendering: pixelated, so the subpixel columns stay crisp at any DPR.
 *
 * It is clipped to the transit map's clip box (setScreenDoorClip, called from
 * TransitMap's apply()), so it covers the viewport on home and shrinks into
 * the minimap card with the map morph.
 */
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/motion";
import { SCREEN_DOOR } from "../config/timings";

const S = SCREEN_DOOR;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uCanvas;        // canvas size, texels
uniform float uToMockup;     // texel -> mockup px
uniform float uPitch;        // pixel pitch, texels
uniform float uTime;
uniform float uFrame;        // grain seed
uniform vec2 uPointer;       // mockup px, top-left origin
uniform float uPointerAmt;
uniform float uStrength;     // subpixel grid strength
uniform float uGap;
uniform float uGrain;
uniform float uCursorR;      // mockup px
uniform float uCursorStrength;
uniform float uBarPeriod;
uniform float uBarH;         // mockup px
uniform float uBarStrength;
uniform float uFlicker;
uniform float uSparkle;      // fraction of pixels glinting
uniform float uSparkleS;     // glint length, seconds
uniform float uSparkleStrength;
uniform sampler2D uZones;    // one texel per zone: L black, A fringe
uniform vec2 uZoneSize;      // mockup px
uniform vec2 uZoneTex;       // texture size, zones
uniform float uFringeGrid;
uniform float uGlitchHz;
uniform float uSlipChance;

// Sin-free hash (Dave Hoskins, MIT): a sin() hash loses precision on big
// inputs and returns 0 often enough to light "dead" pixels everywhere.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float below(float h, float t) { return h < t ? 1.0 : 0.0; }

void main() {
  vec2 cell = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y); // top-left origin
  vec2 mock = cell * uToMockup;
  vec2 pix = floor(cell / uPitch);

  // ---- Broken zones (hard edges: nearest texel) ----
  vec4 zone = texture2D(uZones, (floor(mock / uZoneSize) + 0.5) / uZoneTex);
  float dead = zone.r;
  float fringe = zone.a;
  // Slip dice re-roll GLITCH_HZ times a second, per pixel row.
  float step_ = mod(floor(uTime * uGlitchHz), 997.0);
  float slip = below(hash(vec2(pix.y, step_ * 3.71)), fringe * uSlipChance);

  // ---- Subpixel grid (a slipped row shifts its columns by one subpixel) ----
  float sub = uPitch / 3.0;
  float gx = cell.x + slip * sub;
  float col = floor(mod(floor(gx), uPitch) * 3.0 / uPitch); // 0 R, 1 G, 2 B
  float lastRow = step(uPitch - 1.0, mod(floor(cell.y), uPitch));

  // ---- Shimmer ----
  // A soft refresh bar rolling top -> bottom (wraps past the bottom edge).
  float span = uCanvas.y * uToMockup + uBarH * 2.0;
  float barY = mod(uTime / uBarPeriod, 1.0) * span - uBarH;
  float bar = exp(-pow((mock.y - barY) / (uBarH * 0.5), 2.0));
  // Per-row flicker, new every frame.
  float flicker = uFlicker * hash(vec2(pix.y, uFrame * 1.37));
  // Sparse glinting pixels, each lasting SPARKLE_S.
  float glintSlot = mod(floor(uTime / uSparkleS), 997.0);
  float glint = below(hash(pix * 1.31 + glintSlot * 17.0), uSparkle);

  float dp = length(mock - uPointer) / uCursorR;
  float s = uStrength
          + uCursorStrength * uPointerAmt * exp(-dp * dp)
          + uBarStrength * bar
          + uSparkleStrength * glint
          + uFringeGrid * fringe;

  vec3 primary = col < 0.5 ? vec3(1.0, 0.0, 0.0) : col < 1.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  vec3 m = 1.0 - clamp(s, 0.0, 1.0) * (1.0 - primary);
  m *= 1.0 - uGap * lastRow;
  m *= 1.0 - uBarStrength * bar;
  m *= 1.0 - flicker;
  m *= 1.0 - dead;
  m *= 1.0 - uGrain * hash(cell + uFrame);

  gl_FragColor = vec4(clamp(m, 0.0, 1.0), 1.0);
}
`;

// ---------------------------------------------------------------------------
// Module-level coupling (either side may mount first)
// ---------------------------------------------------------------------------

let clip = { w: 1440, h: 1024 };
let live: ScreenDoor | null = null;

/** The transit map's clip box, in mockup px (top-left anchored). */
export function setScreenDoorClip(w: number, h: number) {
  clip = { w, h };
  live?.applyClip();
}

/** Something hit the screen at client (x, y) CSS px. `dwell` 0–1: how long
 *  the hit lingered (a slow nozzle presses harder). */
export function screenDoorImpact(x: number, y: number, dwell: number) {
  live?.impact(x, y, dwell);
}

/** A dead zone's timeline. Times are engine seconds; the blinks and the
 *  return are relative to `release` (last hit + hold). */
type Zone = {
  hold: number;
  release: number;
  /** Blink-on windows as flat [start, end) pairs. */
  blinks: number[];
  returnAt: number;
  returnDur: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** Standard normal (Box–Muller). */
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

function newZone(now: number): Zone {
  // Log-normal hold: most zones come back fast, a few linger.
  const hold = Math.min(S.HOLD_MEDIAN * Math.exp(S.HOLD_SPREAD * gauss()), S.HOLD_MAX);
  const blinks: number[] = [];
  let t = 0;
  const n = Math.floor(Math.random() * (S.STUTTER_MAX + 1));
  for (let i = 0; i < n; i++) {
    blinks.push(t, t + S.STUTTER_ON_S);
    t += S.STUTTER_ON_S + rand(S.STUTTER_OFF_MIN, S.STUTTER_OFF_MAX);
  }
  return { hold, release: now + hold, blinks, returnAt: t, returnDur: rand(S.RETURN_MIN, S.RETURN_MAX) };
}

/** [black, fringe] `t` seconds after release, or null once fully back. */
function zoneState(z: Zone, t: number): [number, number] | null {
  if (t < 0) return [1, 0];
  if (t < z.returnAt) {
    for (let i = 0; i < z.blinks.length; i += 2) if (t >= z.blinks[i] && t < z.blinks[i + 1]) return [0, 1];
    return [1, 0];
  }
  const p = (t - z.returnAt) / z.returnDur;
  if (p >= 1) return null;
  // A snap (ease-out) with the fringe peaking halfway.
  return [(1 - p) * (1 - p), Math.sin(Math.PI * p)];
}

const mockupPx = () => Math.min(window.innerWidth / 1440, window.innerHeight / 1024);


type Uniforms = Record<string, WebGLUniformLocation | null>;

export class ScreenDoor {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private uniforms: Uniforms = {};
  private reduced = prefersReducedMotion();
  /** Device px per texel. */
  private texel = 1;
  /** Canvas CSS size (a little over the viewport, from whole texels). */
  private cssW = 0;
  private cssH = 0;
  private time = 0;
  private frame = 0;
  private pointer = { x: -1e4, y: -1e4, amt: 0 };
  private moveX: (v: number) => void;
  private moveY: (v: number) => void;
  private hasPointer = false;
  private ticking = false;
  /** Dead zones by index (row * zoneCols + col), and their texture. */
  private zones = new Map<number, Zone>();
  private zoneTex: WebGLTexture | null = null;
  private zoneData = new Uint8Array(0);
  private zoneCols = 0;
  private zoneRows = 0;
  /** Zone size, mockup px (whole pixel pitches). */
  private zoneW: number = S.ZONE_W;
  private zoneH: number = S.ZONE_H;
  /** The texture still shows zones (one more upload clears it). */
  private zonesShown = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.moveX = gsap.quickTo(this.pointer, "x", { duration: S.CURSOR_LAG, ease: "power3" });
    this.moveY = gsap.quickTo(this.pointer, "y", { duration: S.CURSOR_LAG, ease: "power3" });

    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    window.addEventListener("resize", this.onResize);
    if (!this.reduced) {
      window.addEventListener("pointermove", this.onPointerMove);
      document.addEventListener("pointerout", this.onPointerOut);
    }

    this.init();
    // oxlint-disable-next-line no-this-alias -- the module-level instance setScreenDoorClip forwards to
    live = this;
    if (import.meta.env.DEV) Object.assign(window, { __screenDoor: this });
  }

  destroy() {
    if (live === this) live = null;
    this.stop();
    gsap.killTweensOf(this.pointer);
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerout", this.onPointerOut);
  }

  /** See screenDoorImpact(). Ignored under reduced motion. */
  impact(x: number, y: number, dwell: number) {
    if (this.reduced || !this.gl || !this.zoneCols) return;
    const strength = S.IMPACT_STRENGTH_MIN + (1 - S.IMPACT_STRENGTH_MIN) * Math.min(Math.max(dwell, 0), 1);
    const px = mockupPx();
    const col = Math.floor(x / px / this.zoneW);
    const row = Math.floor(y / px / this.zoneH);
    this.kill(col, row);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if ((dx || dy) && Math.random() < S.ZONE_SPREAD * strength) this.kill(col + dx, row + dy);
  }

  /** Kill a zone, or keep an already dead one dead from now. */
  private kill(col: number, row: number) {
    if (col < 0 || row < 0 || col >= this.zoneCols || row >= this.zoneRows) return;
    const i = row * this.zoneCols + col;
    const z = this.zones.get(i);
    if (z && this.time < z.release) z.release = this.time + z.hold;
    else this.zones.set(i, newZone(this.time));
  }

  /** Advance the zones and upload them (only while any are showing). */
  private updateZones() {
    const gl = this.gl;
    if (!gl || !this.zoneTex || (!this.zones.size && !this.zonesShown)) return;
    const d = this.zoneData;
    d.fill(0);
    for (const [i, z] of this.zones) {
      const st = zoneState(z, this.time - z.release);
      if (!st) {
        this.zones.delete(i);
        continue;
      }
      d[i * 2] = Math.round(st[0] * 255);
      d[i * 2 + 1] = Math.round(st[1] * 255);
    }
    this.zonesShown = this.zones.size > 0;
    gl.bindTexture(gl.TEXTURE_2D, this.zoneTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.zoneCols, this.zoneRows, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, d);
  }

  // ---- GL setup ----

  private init() {
    const gl = this.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return; // no WebGL: the effect just doesn't appear
    this.gl = gl;

    const program = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[screenDoor]", gl.getShaderInfoLog(shader));
        this.gl = null;
        return;
      }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[screenDoor]", gl.getProgramInfoLog(program));
      this.gl = null;
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the whole clip space.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const names = [
      "uCanvas", "uToMockup", "uPitch", "uTime", "uFrame", "uPointer", "uPointerAmt",
      "uStrength", "uGap", "uGrain", "uCursorR", "uCursorStrength", "uBarPeriod", "uBarH", "uBarStrength",
      "uFlicker", "uSparkle", "uSparkleS", "uSparkleStrength", "uZones", "uZoneSize", "uZoneTex",
      "uFringeGrid", "uGlitchHz", "uSlipChance",
    ];
    this.uniforms = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)]));

    const u = this.uniforms;
    const set: [string, number][] = [
      ["uStrength", S.STRENGTH],
      ["uGap", S.GAP],
      ["uGrain", S.GRAIN],
      ["uCursorR", S.CURSOR_RADIUS_PX],
      ["uCursorStrength", S.CURSOR_STRENGTH],
      ["uBarPeriod", S.SHIMMER_BAR_PERIOD],
      ["uBarH", S.SHIMMER_BAR_HEIGHT_PX],
      ["uBarStrength", S.SHIMMER_BAR_STRENGTH],
      ["uFlicker", S.SHIMMER_FLICKER],
      ["uSparkle", S.SHIMMER_SPARKLE],
      ["uSparkleS", S.SHIMMER_SPARKLE_S],
      ["uSparkleStrength", S.SHIMMER_SPARKLE_STRENGTH],
      ["uFringeGrid", S.FRINGE_GRID],
      ["uGlitchHz", S.GLITCH_HZ],
      ["uSlipChance", S.SLIP_CHANCE],
    ];
    for (const [name, v] of set) gl.uniform1f(u[name], v);

    // Zone texture (sized in resize()); nearest keeps zone edges hard.
    this.zoneTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.zoneTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.uniform1i(u.uZones, 0);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);

    this.resize();
    if (this.reduced) this.render();
    else this.start();
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.texel = Math.max(1, Math.round(dpr));
    const w = Math.ceil((window.innerWidth * dpr) / this.texel);
    const h = Math.ceil((window.innerHeight * dpr) / this.texel);
    this.canvas.width = w;
    this.canvas.height = h;
    this.cssW = (w * this.texel) / dpr;
    this.cssH = (h * this.texel) / dpr;
    this.canvas.style.width = `${this.cssW}px`;
    this.canvas.style.height = `${this.cssH}px`;
    const gl = this.gl;
    if (!gl) return;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(this.uniforms.uCanvas, w, h);
    const toMockup = this.texel / dpr / mockupPx();
    const pitch = Math.max(3, Math.round((S.PITCH_PX * dpr) / this.texel));
    gl.uniform1f(this.uniforms.uToMockup, toMockup);
    gl.uniform1f(this.uniforms.uPitch, pitch);

    // Zones: whole pixel pitches, covering the canvas. A resize clears them.
    const pitchMock = pitch * toMockup;
    this.zoneW = Math.max(1, Math.round(S.ZONE_W / pitchMock)) * pitchMock;
    this.zoneH = Math.max(1, Math.round(S.ZONE_H / pitchMock)) * pitchMock;
    this.zoneCols = Math.ceil((w * toMockup) / this.zoneW);
    this.zoneRows = Math.ceil((h * toMockup) / this.zoneH);
    this.zoneData = new Uint8Array(this.zoneCols * this.zoneRows * 2);
    this.zones.clear();
    this.zonesShown = false;
    gl.bindTexture(gl.TEXTURE_2D, this.zoneTex);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, this.zoneCols, this.zoneRows, 0,
      gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, this.zoneData,
    );
    gl.uniform2f(this.uniforms.uZoneSize, this.zoneW, this.zoneH);
    gl.uniform2f(this.uniforms.uZoneTex, this.zoneCols, this.zoneRows);
    this.applyClip();
  }

  /** Clip the canvas (CSS) and the shading (scissor) to the map's clip box. */
  applyClip() {
    const px = mockupPx();
    const w = Math.min(clip.w * px, this.cssW);
    const h = Math.min(clip.h * px, this.cssH);
    this.canvas.style.clipPath = `inset(0 ${this.cssW - w}px ${this.cssH - h}px 0)`;
    const gl = this.gl;
    if (!gl) return;
    const toTexel = (window.devicePixelRatio || 1) / this.texel;
    const tw = Math.ceil(w * toTexel);
    const th = Math.ceil(h * toTexel);
    // Leaving home (the map shrinking into the minimap): no broken zones there.
    if (w < this.cssW * 0.9 || h < this.cssH * 0.9) this.zones.clear();
    gl.scissor(0, this.canvas.height - th, tw, th);
    if (this.reduced) this.render();
  }

  // ---- Frame loop ----

  private start() {
    if (this.ticking) return;
    this.ticking = true;
    gsap.ticker.add(this.tick);
  }

  private stop() {
    if (!this.ticking) return;
    this.ticking = false;
    gsap.ticker.remove(this.tick);
  }

  private tick = (_time: number, deltaMs: number) => {
    // Clamp so a long pause (hidden tab) doesn't jump the drift.
    this.time += Math.min(deltaMs, 100) / 1000;
    this.frame = (this.frame + 1) % 997;
    this.render();
  };

  private render() {
    const gl = this.gl;
    if (!gl) return;
    const u = this.uniforms;
    const px = mockupPx();
    this.updateZones();
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uFrame, this.frame);
    gl.uniform2f(u.uPointer, this.pointer.x / px, this.pointer.y / px);
    gl.uniform1f(u.uPointerAmt, this.pointer.amt);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ---- Events ----

  private onResize = () => this.resize();

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (!this.hasPointer) {
      // First sighting: appear where the pointer is, not glide in from afar.
      this.hasPointer = true;
      gsap.set(this.pointer, { x: e.clientX, y: e.clientY });
      this.moveX(e.clientX);
      this.moveY(e.clientY);
      gsap.to(this.pointer, { amt: 1, duration: S.CURSOR_FADE, overwrite: "auto" });
      return;
    }
    this.moveX(e.clientX);
    this.moveY(e.clientY);
  };

  private onPointerOut = (e: PointerEvent) => {
    if (e.relatedTarget || !this.hasPointer) return; // still inside the page
    this.hasPointer = false;
    gsap.to(this.pointer, { amt: 0, duration: S.CURSOR_FADE, overwrite: "auto" });
  };

  private onLost = (e: Event) => {
    e.preventDefault(); // allows a restore
    this.stop();
    this.gl = null;
  };

  private onRestored = () => this.init();
}
