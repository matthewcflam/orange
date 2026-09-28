import { projectBySlug } from "../../content/projects";
import ProjectArticle from "../ProjectArticle";
import type { ObstacleDef } from "../../textflow/ObstacleText";
import { MANGO } from "../../textflow/obstacles";
import mangoSvg from "../../../assets-src/svg/mango.svg?raw";

/** The draggable mango in the body text (§10.2, §11.4), where 07 puts it:
 *  over lines 4–7. Mockup px relative to the body's top-left (422, 614). */
const MANGO_OBSTACLE: ObstacleDef = {
  shape: MANGO,
  x: 266,
  y: 54,
  label: "A mango",
  node: <span className="mango-obstacle" dangerouslySetInnerHTML={{ __html: mangoSvg }} />,
};

/** Mango (§10.2). */
export default function Mango() {
  return <ProjectArticle project={projectBySlug("mango")} obstacle={MANGO_OBSTACLE} />;
}
