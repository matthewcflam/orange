import { useLayoutEffect, useRef, type ReactNode } from "react";
import { TextFlow } from "./textFlow";
import type { ObstacleShape } from "./obstacles";
import "./textflow.css";

export interface ObstacleDef {
  shape: ObstacleShape;
  /** Starting top-left in mockup px, relative to the text box. */
  x: number;
  y: number;
  /** What the obstacle is, for screen readers. */
  label: string;
  /** Its look; fills the shape's box. */
  node: ReactNode;
}

/**
 * Body paragraphs that flow around a draggable obstacle (spec §11). The
 * visible lines are aria-hidden spans laid out by TextFlow; the real text
 * sits in visually hidden paragraphs for screen readers, search and copy.
 * Pass module-level `paragraphs` and `obstacle` (the engine rebuilds when
 * either changes identity).
 */
export default function ObstacleText({
  paragraphs,
  obstacle,
  className,
}: {
  paragraphs: readonly string[];
  obstacle: ObstacleDef;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const obstacleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const flow = new TextFlow({
      box: boxRef.current!,
      layer: layerRef.current!,
      obstacle: obstacleRef.current!,
      paragraphs,
      shape: obstacle.shape,
      x: obstacle.x,
      y: obstacle.y,
    });
    return () => flow.destroy();
  }, [paragraphs, obstacle]);

  return (
    <div ref={boxRef} className={`textflow ${className ?? ""}`}>
      <div className="visually-hidden">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div ref={layerRef} className="textflow__lines" aria-hidden="true" />
      <div
        ref={obstacleRef}
        className="textflow__obstacle"
        role="button"
        tabIndex={0}
        aria-label={`${obstacle.label}. Drag it, or use the arrow keys, and the text flows around it.`}
      >
        {obstacle.node}
      </div>
    </div>
  );
}
