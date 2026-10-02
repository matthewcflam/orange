import { useEffect, useReducer } from "react";
import { createPortal } from "react-dom";
import { SPRAY } from "../config/timings";
import { getPace, loadGuides, PACE_EVENT, strokeTimes, WHO_BOX } from "./sprayEngine";
import { respray } from "./who";

/**
 * Dev only (/?spray-debug, mounted by Home): a tuning view for
 * config/sprayPace.ts over the "who?" canvas. Each guide is drawn coloured by
 * nozzle speed (blue slow → red fast), every anchor point is labelled (w0,
 * w1, …) and each segment shows its ms. Saving sprayPace.ts or pressing R
 * sprays again.
 */
export default function SprayDebug({ glass }: { glass: HTMLElement }) {
  const [version, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const onPace = () => {
      bump();
      respray();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") respray();
    };
    window.addEventListener(PACE_EVENT, onPace);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(PACE_EVENT, onPace);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const pace = getPace();
  const guides = loadGuides();
  const strokes = guides.map((g, i) => {
    const t = strokeTimes(i);
    const speeds = Array.from({ length: g.segments }, (_, j) => g.step / Math.max(t[j + 1] - t[j], 1e-6));
    return { g, speeds };
  });
  // Colour scale over the moving strokes (the ?-dot is a dwell).
  const all = strokes.slice(0, -1).flatMap((s) => s.speeds);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const colour = (v: number) => `hsl(${240 * (1 - Math.min(Math.max((v - lo) / (hi - lo || 1), 0), 1))} 90% 45%)`;

  const pad = SPRAY.CANVAS_PAD_PX;
  const total =
    pace.leadMs + pace.strokes.reduce((sum, s) => sum + s.segmentsMs.reduce((a, b) => a + b, 0) + (s.liftMs ?? 0), 0);

  return createPortal(
    <svg
      key={version}
      className="home__who spray-debug"
      viewBox={`${-pad} ${-pad} ${WHO_BOX.width + 2 * pad} ${WHO_BOX.height + 2 * pad}`}
      style={
        {
          "--who-w": WHO_BOX.width,
          "--who-h": WHO_BOX.height,
          "--who-pad": pad,
          overflow: "visible",
          fontFamily: "ui-monospace, monospace",
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <text x={0} y={-pad + 14} fontSize={12} fill="#000">
        sprayPace: {total} ms · {Math.round(lo)}–{Math.round(hi)} px/s (blue → red) · R to replay
      </text>
      {strokes.map(({ g, speeds }, i) => {
        const letter = pace.strokes[i]?.letter ?? String(i);
        const ms = pace.strokes[i]?.segmentsMs ?? [];
        const at = (along: number): [number, number] => {
          const k = Math.min(Math.round(along / g.step), g.segments);
          return [g.pts[k * 2], g.pts[k * 2 + 1]];
        };
        return (
          <g key={i}>
            {speeds.map((v, j) => (
              <line
                key={j}
                x1={g.pts[j * 2]}
                y1={g.pts[j * 2 + 1]}
                x2={g.pts[j * 2 + 2]}
                y2={g.pts[j * 2 + 3]}
                stroke={colour(v)}
                strokeWidth={4}
                strokeLinecap="round"
              />
            ))}
            {g.anchors.slice(0, -1).map((a, s) => {
              const [mx, my] = at((a + g.anchors[s + 1]) / 2);
              return (
                <text key={`ms${s}`} x={mx + 6} y={my + 16} fontSize={10} fill="#555">
                  {ms[s] ?? "?"}ms
                </text>
              );
            })}
            {g.anchors.map((a, s) => {
              const [x, y] = at(a);
              return (
                <g key={`p${s}`}>
                  <circle cx={x} cy={y} r={3.5} fill="#fff" stroke="#000" strokeWidth={1.5} />
                  <text x={x + 5} y={y - 5} fontSize={11} fontWeight={700} fill="#000">
                    {letter}
                    {s}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>,
    glass,
  );
}
