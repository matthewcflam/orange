import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "./lib/gsap";
import { waitForFonts } from "./lib/fonts";
import { GATE_UI } from "./config/timings";
import FontCheck from "./pages/FontCheck";

/**
 * Layer stack (spec §4.1), bottom to top:
 *   z0  page layer        — swaps per route
 *   z10 shared chrome     — name block, gate options, grey squares, mute toggle
 *   z20 transit map       — one TransitMap, full ↔ mini
 *   z30 transition overlay — Palimpsest canvas + tunnel + light bleed
 */
export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
      gsap.to(rootRef.current, { autoAlpha: 1, duration: GATE_UI.FADE_IN });
    },
    { dependencies: [fontsReady], scope: rootRef },
  );

  return (
    <div ref={rootRef} style={{ visibility: "hidden", opacity: 0 }}>
      <main className="layer--page">
        {/* TODO(milestone 2+): replace the font check with the router outlet. */}
        <FontCheck />
      </main>
      <div className="layer layer--chrome" />
      <div className="layer layer--map" />
      <div className="layer layer--overlay" />
    </div>
  );
}
