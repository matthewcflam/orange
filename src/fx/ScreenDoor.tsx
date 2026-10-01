import { useEffect, useRef } from "react";
import { ScreenDoor as ScreenDoorEngine } from "./screenDoorEngine";
import "./screenDoor.css";

/** Screen door (fx/screenDoorEngine.ts). Hidden until the gate → home
 *  timeline reveals it; clipped to the transit map's box from then on. */
export default function ScreenDoor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const engine = new ScreenDoorEngine(canvasRef.current!);
    return () => engine.destroy();
  }, []);

  return <canvas ref={canvasRef} className="screen-door" aria-hidden="true" />;
}
