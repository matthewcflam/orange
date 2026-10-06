import { lazy, Suspense, type ComponentType } from "react";
import { useRoute } from "../lib/router";
import { PAGE_LOADERS } from "../lib/assets";
import Home from "./Home";

type PageModule = { default: ComponentType };

/**
 * A page in its own chunk. The transition fetches it before committing
 * (lib/assets.ts preloadRoute), so by render time it is usually loaded and
 * renders straight away. React.lazy alone would still suspend once (and
 * React 19 can hold a Suspense reveal for 300 ms); only a page that isn't
 * loaded yet goes through it.
 */
function chunked(load: () => Promise<PageModule>): ComponentType {
  let Loaded: ComponentType | null = null;
  const remember = (m: PageModule) => {
    Loaded = m.default;
    return m;
  };
  const Lazy = lazy(() => load().then(remember));
  return function Page() {
    if (!Loaded) void load().then(remember, () => undefined);
    return Loaded ? <Loaded /> : <Lazy />;
  };
}

const About = chunked(PAGE_LOADERS.about);
const Experience = chunked(PAGE_LOADERS.experience);
// Pretext, obstacle text, project content.
const Projects = chunked(PAGE_LOADERS.projects);

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
