import { projectBySlug } from "../../content/projects";
import ProjectArticle from "../ProjectArticle";
import type { ObstacleDef } from "../../textflow/ObstacleText";
import { circle } from "../../textflow/obstacles";
import orange from "../../../assets-src/images/portfolio-orange.png?obstacle";

/** The draggable orange (open question #4, answered: portfolio-orange.png).
 *  08's wrap gaps sit where 06 puts the Oyster News circle, so it starts
 *  there at the same size. Mockup px relative to the body's top-left (422, 614). */
const ORANGE: ObstacleDef = {
  shape: circle(41),
  x: 269,
  y: 75,
  label: "An orange circle",
  node: (
    <picture className="portfolio-obstacle">
      {Object.entries(orange.sources).map(([format, srcset]) => (
        <source key={format} type={`image/${format}`} srcSet={srcset} sizes="3vw" />
      ))}
      <img src={orange.img.src} width={orange.img.w} height={orange.img.h} alt="" draggable={false} />
    </picture>
  ),
};

/** Portfolio (§10.2): the hero is two overlapping circles, drawn in CSS
 *  (project.css). */
export default function Portfolio() {
  return (
    <ProjectArticle
      project={projectBySlug("portfolio")}
      obstacle={ORANGE}
      hero={
        <div className="portfolio-hero" role="img" aria-label="A grey circle behind an orange one">
          <span className="portfolio-hero__back" />
          <span className="portfolio-hero__front" />
        </div>
      }
    />
  );
}
