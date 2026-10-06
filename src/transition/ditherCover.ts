/**
 * Dither cover: the solid screen of the page transition, copied from
 * 2xa.studio. Its colour is chosen per transition (pageTransition.ts). A plain class like the spray engine; TransitionLayer.tsx only
 * mounts its elements.
 *
 * One fullscreen quad. The fragment shader is 2xa's, ported verbatim: a
 * simplex-noise wipe edge, aspect-corrected, whose wide soft band (EDGE_SMOOTH)
 * is quantised to hard on/off cells by an 8×8 Bayer ordered dither. Sweeping
 * `uProgress` grows the dark dots until they merge (show, bottom → top) or
 * shrinks them away (hide, also bottom → top). Nothing moves: the noise field
 * is fixed per sweep (`uOffset` is re-randomised each show and hide), so the
 * "swarm" is the threshold passing through the dither.
 *
 * Draws only from tween updates; between them the canvas keeps its last
 * frame. The canvas has one pixel per dither cell (DITHER_PX device px),
 * scaled up with `image-rendering: pixelated`: the same picture for 1/9 of
 * the fragments. Between transitions it is `visibility: hidden`, so the
 * idle site doesn't composite a full-screen layer over every frame. Without WebGL (or after a context loss) a plain div fades instead,
 * and reduced motion uses that fade too.
 */
import { gsap } from "../lib/gsap";
import { readToken } from "../lib/tokens";
import { TRANSITION } from "../config/timings";

const T = TRANSITION;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4( aPos, 0.0, 1.0 );
}
`;

// From 2xa.studio (main bundle, class `mw`), unchanged apart from precision.
const FRAG = `
precision highp float;

uniform float uProgress;
uniform vec2  uOffset;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uEdgeSmooth;
uniform float uDirection;
uniform float uAspect;
uniform vec2  uResolution;
uniform float uPixelSize;
uniform float uDitherSize;
uniform vec3  uColor;

varying vec2 vUv;

// 8x8 Bayer ordered dither matrix, built recursively from the 2x2 base.
// Returns a threshold in [0,1).
float bayer2( vec2 a ) {
    a = floor( a );
    return fract( a.x * 0.5 + a.y * a.y * 0.75 );
}
float bayer4( vec2 a ) { return bayer2( a * 0.5 ) * 0.25 + bayer2( a ); }
float bayer8( vec2 a ) { return bayer4( a * 0.5 ) * 0.25 + bayer2( a ); }

vec3 mod289( vec3 x ) { return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0; }
vec2 mod289( vec2 x ) { return x - floor( x * ( 1.0 / 289.0 ) ) * 289.0; }
vec3 permute( vec3 x ) { return mod289( ( ( x * 34.0 ) + 1.0 ) * x ); }

float snoise( vec2 v ) {
    const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
       -0.577350269189626,
        0.024390243902439
    );
    vec2 i   = floor( v + dot( v, C.yy ) );
    vec2 x0  = v - i + dot( i, C.xx );
    vec2 i1  = ( x0.x > x0.y ) ? vec2( 1.0, 0.0 ) : vec2( 0.0, 1.0 );
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy  -= i1;
    i = mod289( i );
    vec3 p = permute( permute( i.y + vec3( 0.0, i1.y, 1.0 ) ) + i.x + vec3( 0.0, i1.x, 1.0 ) );
    vec3 m = max( 0.5 - vec3( dot( x0, x0 ), dot( x12.xy, x12.xy ), dot( x12.zw, x12.zw ) ), 0.0 );
    m = m * m;
    m = m * m;
    vec3 x  = 2.0 * fract( p * C.www ) - 1.0;
    vec3 h  = abs( x ) - 0.5;
    vec3 ox = floor( x + 0.5 );
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0 * a0 + h * h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot( m, g );
}

void main() {
    // Optional pixelation: snap UVs to a square pixel grid.
    vec2 uv = vUv;
    if ( uPixelSize > 0.0 ) {
        vec2 cells = floor( uResolution / uPixelSize );
        uv = ( floor( uv * cells ) + 0.5 ) / cells;
    }

    // Aspect-corrected so noise cells stay square.
    vec2 noiseUv = vec2( uv.x * uAspect, uv.y );
    float noise = snoise( noiseUv * uNoiseScale + uOffset );

    // Remap progress so the band sits wholly below the screen at 0 and wholly
    // above it at 1, whatever the noise does.
    float margin = uNoiseStrength + uEdgeSmooth;
    float p      = mix( -margin, 1.0 + margin, uProgress );

    float threshold = p + noise * uNoiseStrength;

    // 1 = show (fill bottom -> top as progress rises),
    // 0 = hide (clear bottom -> top as progress falls).
    float y = mix( 1.0 - uv.y, uv.y, uDirection );

    // Fill fraction across the soft band (0 clear, 1 solid).
    float fill = clamp( ( threshold - y ) / ( 2.0 * uEdgeSmooth ) + 0.5, 0.0, 1.0 );

    // Hard on/off per dither cell. Strict fill > bayer: nothing lights at 0,
    // everything at 1.
    float bayer = bayer8( gl_FragCoord.xy / max( uDitherSize, 1.0 ) );
    float alpha = 1.0 - step( fill, bayer );

    gl_FragColor = vec4( uColor, alpha );
}
`;

const UNIFORMS = [
  "uProgress", "uOffset", "uNoiseScale", "uNoiseStrength", "uEdgeSmooth", "uDirection",
  "uAspect", "uResolution", "uPixelSize", "uDitherSize", "uColor",
] as const;
type Uniform = (typeof UNIFORMS)[number];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export interface HideOptions {
  /** Seconds the cover stays solid before clearing. */
  delay: number;
  /** The cover starts to clear: the page becomes visible. */
  onClearStart?: () => void;
  /** Progress fell below TRANSITION.UNLOCK_PROGRESS. */
  onUnlock?: () => void;
}

export class DitherCover {
  readonly canvas = document.createElement("canvas");
  /** CSS fallback and reduced-motion cover. */
  readonly fade = document.createElement("div");

  private gl: WebGLRenderingContext | null = null;
  private loc = {} as Record<Uniform, WebGLUniformLocation | null>;
  private progress = 0;
  private direction = 1;
  private offset: [number, number] = [0, 0];
  private tween: gsap.core.Tween | null = null;
  /** How the current transition covers the screen. */
  private mode: "dither" | "fade" = "dither";
  private color: [number, number, number] = [0.06, 0.06, 0.06];

  constructor() {
    this.canvas.className = "transition__canvas";
    this.fade.className = "transition__fade";
    this.setVisible(false);
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.gl = null;
      // Mid-transition: keep the screen covered with the fade instead.
      if (this.dithering) {
        this.tween?.kill();
        this.mode = "fade";
        gsap.set(this.fade, { opacity: 1 });
      }
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.init();
      this.draw();
    });
    this.init();
    window.addEventListener("resize", this.onResize);
  }

  /** The dither is on screen (solid or moving). */
  private get dithering(): boolean {
    return this.mode === "dither" && this.progress > 0;
  }

  /** Tone of the next transition: the layer's title and fade colours follow it
   *  (transition.css). Set before show(). */
  setTone(tone: "dark" | "light"): void {
    const layer = this.canvas.parentElement;
    if (layer) layer.dataset.tone = tone;
  }

  /** Dither in, bottom to top, in the colour of token `color`. Resolves when
   *  fully covered. */
  show(reduced: boolean, color: `--${string}`): Promise<void> {
    this.tween?.kill();
    this.color = hexToRgb(readToken(color) || "#212121");
    this.mode = reduced || !this.gl ? "fade" : "dither";
    if (this.mode === "fade") return this.fadeTo(1, reduced ? T.REDUCED_FADE : T.SHOW * 0.3, 0);
    this.direction = 1;
    this.offset = [rand(0, 100), rand(0, 100)];
    this.progress = 0;
    this.resize();
    this.setVisible(true);
    return new Promise((resolve) => {
      this.tween = gsap.to(this, {
        progress: 1,
        duration: T.SHOW,
        ease: T.SHOW_EASE,
        onUpdate: () => this.draw(),
        onComplete: () => resolve(),
      });
    });
  }

  /** Hold, then dither away bottom to top. Resolves when fully clear. */
  hide(reduced: boolean, { delay, onClearStart, onUnlock }: HideOptions): Promise<void> {
    this.tween?.kill();
    if (this.mode === "fade" || !this.gl) {
      // Covered by the fade (reduced motion, no WebGL, or the context was lost
      // mid-transition): fade out, and drop whatever dither is left.
      this.progress = 0;
      this.clear();
      this.setVisible(false);
      return this.fadeTo(0, reduced ? T.REDUCED_FADE : T.HIDE * 0.15, delay, onClearStart).then(() => onUnlock?.());
    }
    this.direction = 0;
    this.offset = [rand(0, 100), rand(0, 100)];
    this.draw();
    let unlocked = false;
    return new Promise((resolve) => {
      this.tween = gsap.to(this, {
        progress: 0,
        duration: T.HIDE,
        ease: T.HIDE_EASE,
        delay,
        onStart: onClearStart,
        onUpdate: () => {
          this.draw();
          if (!unlocked && this.progress < T.UNLOCK_PROGRESS) {
            unlocked = true;
            onUnlock?.();
          }
        },
        onComplete: () => {
          this.clear();
          this.setVisible(false);
          if (!unlocked) onUnlock?.();
          resolve();
        },
      });
    });
  }

  /** Dev: draw one frame by hand (progress 0..1, direction 1 show / 0 hide). */
  drawAt(progress: number, direction: number): void {
    this.tween?.kill();
    this.mode = "dither";
    this.progress = progress;
    this.direction = direction;
    this.resize();
    this.setVisible(true);
    this.draw();
  }

  private setVisible(on: boolean) {
    this.canvas.style.visibility = on ? "visible" : "hidden";
  }

  private fadeTo(opacity: number, duration: number, delay: number, onStart?: () => void): Promise<void> {
    return new Promise((resolve) => {
      this.tween = gsap.to(this.fade, { opacity, duration, delay, ease: "none", onStart, onComplete: () => resolve() });
    });
  }

  private init() {
    const gl = this.canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    for (const u of UNIFORMS) this.loc[u] = gl.getUniformLocation(prog, u);
    gl.uniform1f(this.loc.uNoiseScale, T.NOISE_FREQ);
    gl.uniform1f(this.loc.uNoiseStrength, T.NOISE_STRENGTH);
    gl.uniform1f(this.loc.uEdgeSmooth, T.EDGE_SMOOTH);
    gl.uniform1f(this.loc.uPixelSize, T.PIXEL_SIZE);
    // One canvas pixel per dither cell (resize()).
    gl.uniform1f(this.loc.uDitherSize, 1);
    gl.clearColor(0, 0, 0, 0);
    this.gl = gl;
  }

  private onResize = () => {
    if (!this.dithering) return;
    this.resize();
    this.draw();
  };

  /** One canvas pixel per DITHER_PX × DITHER_PX device-px cell. The canvas
   *  is rounded up to whole cells and sized in CSS so each cell lands on
   *  exactly DITHER_PX device px; the overhang (under one cell) is clipped. */
  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, T.MAX_DPR);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cell = Math.max(1, T.DITHER_PX);
    const cw = Math.ceil((w * dpr) / cell);
    const ch = Math.ceil((h * dpr) / cell);
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
      this.canvas.style.width = `${(cw * cell) / dpr}px`;
      this.canvas.style.height = `${(ch * cell) / dpr}px`;
    }
    const gl = this.gl;
    if (!gl) return;
    gl.viewport(0, 0, cw, ch);
    gl.uniform1f(this.loc.uAspect, w / h);
    gl.uniform2f(this.loc.uResolution, w, h);
  }

  private draw() {
    const gl = this.gl;
    if (!gl) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.loc.uProgress, this.progress);
    gl.uniform1f(this.loc.uDirection, this.direction);
    gl.uniform2f(this.loc.uOffset, ...this.offset);
    gl.uniform3f(this.loc.uColor, ...this.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private clear() {
    this.gl?.clear(this.gl.COLOR_BUFFER_BIT);
  }
}

// One cover for the app's lifetime (StrictMode mounts the layer twice).
export const cover = new DitherCover();

if (import.meta.env.DEV) Object.assign(window, { __cover: cover });
