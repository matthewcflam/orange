import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SprayEngine, WHO_BOX } from "../spray/sprayEngine";
import { attachWho } from "../spray/who";
import { SPRAY } from "../config/timings";
import { useGlass } from "../lib/glass";
import "./home.css";

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
    const engine = new SprayEngine(canvasRef.current!);
    const detach = attachWho(engine);
    return () => {
      detach();
      engine.destroy();
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
    </div>
  );
}
