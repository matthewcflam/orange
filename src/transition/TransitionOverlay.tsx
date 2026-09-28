import { useLayoutEffect, useRef } from "react";
import { PALIMPSEST } from "../config/timings";
import { attachOverlay } from "./palimpsest";
import "./transition.css";

/**
 * The transition overlay (spec §4.1, z30): rendered once, never unmounted.
 * Bottom to top: the word-stack canvas, the light bleed, the black tunnel.
 * palimpsest.ts drives it; pointer-events stay off except while a transition runs.
 */
export default function TransitionOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bleedRef = useRef<HTMLDivElement>(null);
  const tunnelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(
    () =>
      attachOverlay({
        root: rootRef.current!,
        canvas: canvasRef.current!,
        bleed: bleedRef.current!,
        tunnel: tunnelRef.current!,
      }),
    [],
  );

  return (
    <div
      ref={rootRef}
      className="layer layer--overlay"
      aria-hidden="true"
      style={{ "--tunnel-edge": `${PALIMPSEST.TUNNEL_EDGE_VW}vw` } as React.CSSProperties}
    >
      <canvas ref={canvasRef} className="palimpsest__stack" />
      <div ref={bleedRef} className="palimpsest__bleed" />
      <div ref={tunnelRef} className="palimpsest__tunnel" />
    </div>
  );
}
