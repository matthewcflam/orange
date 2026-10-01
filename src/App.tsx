import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "./lib/gsap";
import { waitForFonts } from "./lib/fonts";
import { GATE_UI } from "./config/timings";
import Gate, { type GatePhase } from "./gate/Gate";
import { gateToHome } from "./gate/gateToHome";
import NameBlock from "./chrome/NameBlock";
import MuteToggle from "./chrome/MuteToggle";
import TransitMap from "./transit/TransitMap";
import Outlet from "./pages/Outlet";
import { useRoute } from "./lib/router";
import { prefersReducedMotion } from "./lib/motion";
import { GlassContext } from "./lib/glass";
import TransitionLayer from "./transition/TransitionLayer";
import StationChrome from "./chrome/StationChrome";
import { routeFor } from "./config/routes";

/**
 * Layer stack (spec §4.1), bottom to top:
 *   z0  page layer        — swaps per route
 *   z10 shared chrome     — name block, gate options, mute toggle (home);
 *                           Map pill, keychain, "Matthew Lam" (station pages)
 *   z20 transit map       — home only
 *   z40 glass             — painted on the screen: Home portals "who?" here
 *   z50 transition        — the dither cover and its title, over everything
 *
 * The gate is a state, not a layer: while gatePhase !== "done" everything
 * outside the gate buttons is inert. The page mounts when the choice is made
 * ("leaving") so the gate → home timeline can reveal it; before that it
 * renders nothing, so nothing behind the gate is visible.
 */
export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  const [gatePhase, setGatePhase] = useState<GatePhase>("showing");
  const rootRef = useRef<HTMLDivElement>(null);
  // Set on the first commit, long before the page (and Home) can mount.
  const [glass, setGlass] = useState<HTMLDivElement | null>(null);
  const gated = gatePhase !== "done";
  const route = useRoute();
  const home = route === "/";
  // The gate is light; after it, the page's theme. A route commits under the
  // transition cover, so the colours swap unseen.
  const theme = gated ? "light" : routeFor(route).theme;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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

  // Gate → home (§6.5). Runs once; later phase changes don't revert it.
  useGSAP(
    () => {
      if (gatePhase !== "leaving") return;
      const tl = gateToHome({
        root: rootRef.current!,
        home: route === "/",
        reduced: prefersReducedMotion(),
        onOptionsGone: () => setGatePhase("done"),
      });
      if (import.meta.env.DEV) Object.assign(window, { __gateToHome: tl });
    },
    { dependencies: [gatePhase], scope: rootRef },
  );

  // Nothing renders until fonts are ready, so no swap can land mid-animation (§5.4).
  return (
    <div ref={rootRef} style={{ opacity: 0 }}>
      {fontsReady && (
        <>
          <main className="layer--page" inert={gated}>
            {gatePhase !== "showing" && (
              <GlassContext.Provider value={glass}>
                <Outlet />
              </GlassContext.Provider>
            )}
          </main>

          <div className="layer layer--chrome">
            {/* Name block: gate and home only (§4.1). */}
            <NameBlock visible={gated || home} />
            {gated && <Gate onSelect={() => setGatePhase("leaving")} />}
            {/* Hidden on the gate: Sound / Muted is the choice there. */}
            {!gated && home && <MuteToggle enabled />}
            {!gated && !home && <StationChrome />}
          </div>

          <div className="layer layer--map" inert={gated} hidden={!home}>
            <TransitMap visible={!gated} />
          </div>

          <div ref={setGlass} className="layer layer--glass" />

          <TransitionLayer />
        </>
      )}
    </div>
  );
}
