import { projectBySlug } from "../../content/projects";
import ProjectArticle from "../ProjectArticle";

/** Portfolio (§10.2): the hero is two overlapping circles, drawn in CSS
 *  (project.css). TODO(milestone 9): polish; open question #4. */
export default function Portfolio() {
  return (
    <ProjectArticle
      project={projectBySlug("portfolio")}
      hero={
        <div className="portfolio-hero" role="img" aria-label="A grey circle behind an orange one">
          <span className="portfolio-hero__back" />
          <span className="portfolio-hero__front" />
        </div>
      }
    />
  );
}
