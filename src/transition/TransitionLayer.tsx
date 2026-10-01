import { useEffect, useRef } from "react";
import { cover } from "./ditherCover";
import { title } from "./scrambleTitle";
import "./transition.css";

/**
 * Mounts the page transition's elements: the dither cover (canvas + CSS
 * fade) and the scrambled title. They are module singletons, driven by
 * pageTransition.ts; React only places them in the layer stack.
 */
export default function TransitionLayer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current!.append(cover.fade, cover.canvas, title.el);
  }, []);

  return <div ref={ref} className="layer layer--transition" aria-hidden="true" />;
}
