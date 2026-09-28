import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "./lib/gsap";
import { waitForFonts } from "./lib/fonts";
import { GATE_UI } from "./config/timings";
import Gate, { type GatePhase } from "./gate/Gate";
import NameBlock from "./chrome/NameBlock";
import MuteToggle from "./chrome/MuteToggle";
import TransitMap from "./transit/TransitMap";
import Outlet from "./pages/Outlet";
import { useRoute } from "./lib/router";

/**
 * Layer stack (spec §4.1), bottom to top:
 *   z0  page layer        — swaps per route
 *   z10 shared chrome     — name block, gate options, grey squares, mute toggle
 *   z20 transit map       — one TransitMap, full ↔ mini
 *   z30 transition overlay — Palimpsest canvas + tunnel + light bleed
 *
 * The gate is a state, not a layer: while gatePhase !== "done" the page layer
 * renders nothing and everything outside the gate buttons is inert.
 */
export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  const [gatePhase, setGatePhase] = useState<GatePhase>("showing");
  const rootRef = useRef<HTMLDivElement>(null);
  const gated = gatePhase !== "done";
  const route = useRoute();

  useEffect(() => {
    let cancelled = false;
    waitForFonts().then(() => !cancelled && setFontsReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      if (!fontsReady) return;
      gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: GATE_UI.FADE_IN });
    },
    { dependencies: [fontsReady], scope: rootRef },
  );

  // Nothing renders until fonts are ready, so no swap can land mid-animation (§5.4).
  return (
    <div ref={rootRef} style={{ opacity: 0 }}>
      {fontsReady && (
        <>
          <main className="layer--page" inert={gated}>
            {!gated && <Outlet />}
          </main>

          <div className="layer layer--chrome">
            {/* Name block: gate and home only (§4.1). */}
            <NameBlock visible={gated || route === "/"} />
            {gated && (
              <Gate
                phase={gatePhase}
                onSelect={() => setGatePhase("leaving")}
                onLeft={() => setGatePhase("done")}
              />
            )}
            {/* TODO(milestone 4): grey squares, after the gate options in DOM order. */}
            {/* Hidden on the gate: SOUND / Muted is the choice there. */}
            {!gated && <MuteToggle enabled />}
          </div>

          <div className="layer layer--map" inert={gated}>
            <TransitMap visible={!gated} />
          </div>
          <div className="layer layer--overlay" />
        </>
      )}
    </div>
  );
}
