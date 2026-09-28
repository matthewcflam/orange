import type { ComponentType } from "react";
import { useRoute } from "../../lib/router";
import { projectByPath, type ProjectSlug } from "../../content/projects";
import ProjectLayout from "../ProjectLayout";
import OysterNews from "./OysterNews";
import Mango from "./Mango";
import Portfolio from "./Portfolio";

const CONTENT: Record<ProjectSlug, ComponentType> = {
  "oyster-news": OysterNews,
  mango: Mango,
  portfolio: Portfolio,
};

/** Every /projects/* route: the shared shell around the active project. */
export default function Projects() {
  const slug = projectByPath(useRoute())!.slug;
  const Content = CONTENT[slug];
  return (
    <ProjectLayout active={slug}>
      <Content key={slug} />
    </ProjectLayout>
  );
}
