import { projectBySlug } from "../../content/projects";
import ProjectArticle from "../ProjectArticle";

/** Mango (§10.2). TODO(milestone 8): the draggable mango obstacle. */
export default function Mango() {
  return <ProjectArticle project={projectBySlug("mango")} />;
}
