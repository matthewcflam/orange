import type { ComponentType } from "react";
import { useRoute } from "../lib/router";
import Home from "./Home";
import About from "./placeholders/About";
import Experience from "./placeholders/Experience";
import Inspo from "./placeholders/Inspo";
import Projects from "./projects/Projects";

/** Canonical path → page (paths from config/routes.ts). */
const PAGES: Record<string, ComponentType> = {
  "/": Home,
  "/about": About,
  "/experience": Experience,
  "/projects/oyster-news": Projects,
  "/projects/mango": Projects,
  "/projects/portfolio": Projects,
  "/inspo": Inspo,
};

/** Renders the committed route's page, keyed so pages remount fresh. The
 *  project pages share one key: switching projects keeps the shell (list,
 *  scribble) mounted and only swaps its content (§10.1). */
export default function Outlet() {
  const route = useRoute();
  const Page = PAGES[route];
  return <Page key={Page === Projects ? "projects" : route} />;
}
