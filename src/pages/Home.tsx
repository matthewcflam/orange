import { lazy, Suspense, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SprayEngine, WHO_BOX } from "../spray/sprayEngine";
import { onWhoBox } from "../chrome/homeLayout";
import { attachWho } from "../spray/who";
import { SPRAY } from "../config/timings";
import { useGlass } from "../lib/glass";
import "./home.css";

/** Dev only: /?spray-debug shows the sprayPace tuning overlay (never shipped). */
const SprayDebug =
  import.meta.env.DEV && new URLSearchParams(location.search).has("spray-debug")
    ? lazy(() => import("../spray/SprayDebug"))
    : null;

/**
 * Home (spec §7). The transit map and the name block are shared chrome; this
 * page holds the "who?" spray canvas. spray/who.ts decides when it runs.
 *
 * "who?" is painted on the screen's glass: its canvas portals into the glass
 * layer above the transit map.
 */
export default function Home() {
  const glass = useGlass();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!glass) return;
    const canvas = canvasRef.current!;
    // chrome/homeLayout.ts can move "who?" off its mockup spot (the compact
    // layout, or a name block that would reach under it); set before the
    // engine sizes the canvas. Otherwise home.css places it.
    const offBox = onWhoBox((box) => {
      canvas.toggleAttribute("data-placed", box !== null);
      const props = { "--who-left": box?.left, "--who-top": box?.top, "--who-width": box?.width };
      for (const [p, v] of Object.entries(props)) {
        if (v === undefined) canvas.style.removeProperty(p);
        else canvas.style.setProperty(p, v + "px");
      }
    });
    const engine = new SprayEngine(canvas);
    const detach = attachWho(engine);
    return () => {
      detach();
      engine.destroy();
      offBox();
    };
  }, [glass]);

  return (
    <div className="home">
      {glass &&
        createPortal(
          <canvas
            ref={canvasRef}
            className="home__who"
            role="img"
            aria-label="who?"
            style={
              {
                "--who-w": WHO_BOX.width,
                "--who-h": WHO_BOX.height,
                "--who-pad": SPRAY.CANVAS_PAD_PX,
              } as React.CSSProperties
            }
          />,
          glass,
        )}
      {glass && SprayDebug && (
        <Suspense>
          <SprayDebug glass={glass} />
        </Suspense>
      )}
    </div>
  );
}
