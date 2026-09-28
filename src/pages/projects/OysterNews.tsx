import { projectBySlug } from "../../content/projects";
import ProjectArticle from "../ProjectArticle";
import Artifacts, { type ArtifactDef } from "../Artifacts";
import type { ObstacleDef } from "../../textflow/ObstacleText";
import { circle } from "../../textflow/obstacles";
import "./oyster.css";

/**
 * Design artifacts around the page (§10.2), in back-to-front order.
 * TODO(open-question #13): all of these are CSS stand-ins for missing art
 * (design/ASSETS.md "Missing"), drawn to match 06-projects-oyster-news.png.
 * Swap each `node` for the real image when it arrives.
 */
const ARTIFACTS: readonly ArtifactDef[] = [
  {
    id: "triangles",
    x: -20,
    y: 687,
    edge: "left",
    depth: 0.35,
    node: (
      <svg className="oy-triangles" viewBox="0 0 127 178">
        <polygon points="0,0 127,178 0,178" fill="var(--color-oyster-tri-light)" />
        <polygon points="0,71 125,178 0,178" fill="var(--color-oyster-tri-dark)" />
      </svg>
    ),
  },
  {
    id: "headline",
    x: 30,
    y: 492,
    edge: "left",
    depth: 0.8,
    node: (
      <div className="oy-headline">
        VERY important
        <br />
        headline
      </div>
    ),
  },
  { id: "clipping", x: -12, y: 938, edge: "left", depth: 1, node: <div className="oy-clipping">the world is yours</div> },
  {
    id: "wordmark",
    x: -503,
    y: 854,
    edge: "left",
    depth: 0.55,
    node: (
      <div className="oy-wordmark">
        <span className="oy-wordmark__oyster">Oyster</span> News
      </div>
    ),
  },
  {
    id: "logo",
    x: 1292,
    y: 40,
    edge: "right",
    depth: 0.7,
    node: (
      <div className="oy-logo">
        <i className="oy-logo__pearl" />
        Oyster
      </div>
    ),
  },
  { id: "logo-card", x: 1403, y: 85, edge: "right", depth: 0.9, node: <div className="oy-logo-card" /> },
];

/** The draggable circle in the body text (§10.2, §11), where 06 puts it:
 *  over lines 5–6. Mockup px relative to the body's top-left (422, 614). */
const CIRCLE: ObstacleDef = {
  shape: circle(41),
  x: 269,
  y: 75,
  label: "A red circle",
  node: <div className="oy-circle" />,
};

/** Oyster News (§10.2). */
export default function OysterNews() {
  return (
    <>
      <Artifacts items={ARTIFACTS} />
      <ProjectArticle project={projectBySlug("oyster-news")} obstacle={CIRCLE} />
    </>
  );
}
