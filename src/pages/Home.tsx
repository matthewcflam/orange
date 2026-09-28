import { useEffect, useRef } from "react";
import smileySvg from "../../assets-src/svg/smiley.svg?raw";
import { SprayEngine, WHO_BOX } from "../spray/sprayEngine";
import { attachWho } from "../spray/who";
import { SPRAY } from "../config/timings";
import "./home.css";

/**
 * Home (spec §7). The full transit map and the name block are shared chrome;
 * this page holds the smiley and the "who?" spray canvas. After the gate, the
 * smiley enters with the gate → home timeline; spray/who.ts decides when the
 * spray runs.
 */
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const engine = new SprayEngine(canvasRef.current!);
    const detach = attachWho(engine);
    return () => {
      detach();
      engine.destroy();
    };
  }, []);

  return (
    <div className="home">
      <div className="home__smiley" aria-hidden="true" dangerouslySetInnerHTML={{ __html: smileySvg }} />
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
      />
    </div>
  );
}
