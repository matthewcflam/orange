// TEMPORARY (milestone 2): exercise the sound engine after the gate. Replaced
// by the router outlet in milestone 3.
import { useRef, useState } from "react";
import { SOUNDS, STATION_HOVER_SEMITONES, semitonesToRate, type SoundId } from "../config/sounds";
import { PALIMPSEST } from "../config/timings";
import { getContext, play, soundReport, type Voice } from "../audio/engine";

const btn: React.CSSProperties = {
  fontFamily: "var(--font-station)",
  fontSize: 14,
  padding: "8px 12px",
  border: "1px solid #bbb",
  borderRadius: 6,
  background: "#fafafa",
};

function scheduleThuds() {
  const ctx = getContext();
  if (!ctx) return;
  // All times computed from ctx.currentTime up front (§9.3).
  const n = PALIMPSEST.STACK_COPIES;
  let t = ctx.currentTime + 0.05;
  for (let i = 0; i < n; i++) {
    play("palimpsest.thud", { when: t });
    const k = i / (n - 1);
    t += PALIMPSEST.STACK_INTERVAL_START + (PALIMPSEST.STACK_INTERVAL_END - PALIMPSEST.STACK_INTERVAL_START) * k;
  }
}

export default function SoundTest() {
  const [report, setReport] = useState(soundReport);
  const grain = useRef<Voice | null>(null);
  const last = useRef({ x: 0, y: 0, t: 0 });

  return (
    <div style={{ padding: "96px 48px 48px", maxWidth: 960, marginLeft: "auto", display: "grid", gap: 28 }}>
      <section>
        <h2 style={{ fontSize: 16 }}>Every sound ID</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(Object.keys(SOUNDS) as SoundId[]).map((id) => (
            <button key={id} type="button" style={btn} onClick={() => play(id)}>
              {id}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>station.hover scale (hover across)</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {STATION_HOVER_SEMITONES.map((st, i) => (
            <button key={i} type="button" style={btn} onPointerEnter={() => play("station.hover", { rate: semitonesToRate(st) })}>
              station {i}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>Stress</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" style={btn} onClick={() => { for (let i = 0; i < 12; i++) play("station.click"); }}>
            12× station.click at once (voice limit + limiter)
          </button>
          <button type="button" style={btn} onClick={scheduleThuds}>
            Palimpsest thud rhythm (pre-scheduled)
          </button>
          <button
            type="button"
            style={{ ...btn, touchAction: "none" }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
              grain.current = play("drag.grain", { loop: true, gain: 0 });
            }}
            onPointerMove={(e) => {
              if (!grain.current) return;
              const now = performance.now();
              const dt = Math.max(1, now - last.current.t);
              const speed = Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) / dt; // px/ms
              last.current = { x: e.clientX, y: e.clientY, t: now };
              grain.current.setGain(Math.min(1, speed / 2), 0.05);
            }}
            onPointerUp={() => {
              grain.current?.stop(0.08);
              grain.current = null;
            }}
          >
            Hold + drag: drag.grain loop (gain = speed)
          </button>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 16 }}>
          Sources{" "}
          <button type="button" style={{ ...btn, padding: "2px 8px" }} onClick={() => setReport(soundReport())}>
            refresh
          </button>
        </h2>
        <pre style={{ fontSize: 12, lineHeight: 1.5 }}>
          {Object.entries(report)
            .map(([k, v]) => `${k.padEnd(20)} ${v}`)
            .join("\n")}
        </pre>
      </section>
    </div>
  );
}
