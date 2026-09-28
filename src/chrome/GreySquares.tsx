import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { CHROME, PAINT } from "../config/timings";
import "./chrome.css";

/** Home mockup positions (spec §6.6, open question #11), in mockup px.
 *  A is painted first: it alone covers the gate options, so they are fully
 *  hidden before they unmount. Both are the same grey, so paint order doesn't
 *  change the finished picture. */
const SQUARES = [
  { x: 79, y: 789, w: 289, h: 176 }, // A: bottom-left, over the gate options
  { x: 142, y: 715, w: 289, h: 186 }, // B: up and to the right, overlapping A
] as const;

/**
 * Roller passes that together cover a w×h square (§6.6): STROKES_PER_SQUARE
 * horizontal passes, alternating direction, each slightly tilted and bowed so
 * it reads as hand-painted. Every pass overshoots the edges by more than the
 * bristle displacement, so no corner is left unpainted.
 */
function strokePaths(w: number, h: number): string[] {
  const n: number = PAINT.STROKES_PER_SQUARE;
  const sw = PAINT.STROKE_WIDTH_PX;
  const over = PAINT.BRISTLE_SCALE + PAINT.STROKE_OVERSHOOT_PX;
  const tilt = PAINT.STROKE_TILT_PX;
  // Row centres: the outer strokes' edges clear the square by `over` even at the tilted end.
  const top = sw / 2 - over - tilt / 2;
  const bottom = h - sw / 2 + over + tilt / 2;
  return Array.from({ length: n }, (_, i) => {
    const y = n === 1 ? h / 2 : top + ((bottom - top) * i) / (n - 1);
    const ltr = i % 2 === 0;
    const [x0, x1] = ltr ? [-over, w + over] : [w + over, -over];
    // Rise slightly along the pass; bow the middle the opposite way on alternate passes.
    const y0 = y + tilt / 2;
    const y1 = y - tilt / 2;
    const bow = (ltr ? 1 : -1) * PAINT.STROKE_BOW_PX;
    return `M${x0} ${y0}Q${w / 2} ${y + bow} ${x1} ${y1}`;
  });
}

/**
 * The two grey squares (shared chrome, spec §4.1, §6.6). Rendered after the
 * gate options in DOM order, so the paint genuinely covers them. Each square
 * starts hidden; the gate → home timeline (gate/gateToHome.ts) reveals it
 * through a brush-stroke mask, then sets `data-painted`, which swaps the
 * masked SVG for a plain grey box so the filter stops costing anything.
 * Visible on the gate and home only.
 */
export default function GreySquares({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      gsap.to(ref.current, { autoAlpha: visible ? 1 : 0, duration: first.current ? 0 : CHROME.NAME_FADE, overwrite: true });
      first.current = false;
    },
    { dependencies: [visible] },
  );

  return (
    <div ref={ref} className="grey-squares" aria-hidden="true">
      {SQUARES.map((s, i) => (
        <div
          key={i}
          className="grey-square"
          style={
            {
              "--x": s.x,
              "--y": s.y,
              "--w": s.w,
              "--h": s.h,
            } as React.CSSProperties
          }
        >
          <svg className="grey-square__paint" viewBox={`0 0 ${s.w} ${s.h}`} preserveAspectRatio="none">
            <defs>
              {/* Bristly edges: fractal noise displaces the stroke outlines. */}
              <filter
                id={`paint-bristle-${i}`}
                filterUnits="userSpaceOnUse"
                x={-s.w / 2}
                y={-s.h / 2}
                width={s.w * 2}
                height={s.h * 2}
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency={PAINT.BRISTLE_FREQUENCY}
                  numOctaves={PAINT.BRISTLE_OCTAVES}
                  seed={i + 1}
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale={PAINT.BRISTLE_SCALE}
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              <mask id={`paint-mask-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={s.w} height={s.h}>
                <g filter={`url(#paint-bristle-${i})`}>
                  {strokePaths(s.w, s.h).map((d, j) => (
                    <path key={j} className="grey-square__stroke" d={d} strokeWidth={PAINT.STROKE_WIDTH_PX} />
                  ))}
                </g>
              </mask>
            </defs>
            <rect width={s.w} height={s.h} mask={`url(#paint-mask-${i})`} />
          </svg>
        </div>
      ))}
    </div>
  );
}
