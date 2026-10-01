import { lazy, Suspense, type ComponentType } from "react";
import { useRoute } from "../lib/router";
import { loadProjects } from "../lib/assets";
import Home from "./Home";
import About from "./About";
import Experience from "./Experience";

// Its own chunk (Pretext, obstacle text, project content). The transition
// preloads it with the heroes before committing (lib/assets.ts).
const Projects = lazy(loadProjects);

/** Canonical path → page (paths from config/routes.ts). */
const PAGES: Record<string, ComponentType> = {
  "/": Home,
  "/about": About,
  "/experience": Experience,
  "/projects/portfolio": Projects,
  "/projects/oyster-news": Projects,
  "/projects/mango": Projects,
};

/** Renders the committed route's page, keyed so pages remount fresh. The
 *  project pages share one key: switching projects keeps the shell (list,
 *  scribble) mounted and only swaps its content (§10.1). */
export default function Outlet() {
  const route = useRoute();
  const Page = PAGES[route];
  return (
    <Suspense fallback={null}>
      <Page key={Page === Projects ? "projects" : route} />
    </Suspense>
  );
}
