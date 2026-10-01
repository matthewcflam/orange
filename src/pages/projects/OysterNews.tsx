import { projectBySlug } from "../../content/projects";
import ProjectArticle from "../ProjectArticle";
import type { ObstacleDef } from "../../textflow/ObstacleText";
import { circle } from "../../textflow/obstacles";
import "./oyster.css";

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
  return <ProjectArticle project={projectBySlug("oyster-news")} obstacle={CIRCLE} />;
}
