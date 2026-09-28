import type { ComponentType } from "react";
import { useRoute } from "../lib/router";
import Home from "./Home";
import About from "./placeholders/About";
import Experience from "./placeholders/Experience";
import Unknown from "./placeholders/Unknown";
import Inspo from "./placeholders/Inspo";
import OysterNews from "./projects/OysterNews";
import Mango from "./projects/Mango";
import Portfolio from "./projects/Portfolio";

/** Canonical path → page (paths from config/routes.ts). */
const PAGES: Record<string, ComponentType> = {
  "/": Home,
  "/about": About,
  "/experience": Experience,
  "/projects/oyster-news": OysterNews,
  "/projects/mango": Mango,
  "/projects/portfolio": Portfolio,
  "/unknown": Unknown,
  "/inspo": Inspo,
};

/** Renders the committed route's page. Keyed by path so pages remount fresh. */
export default function Outlet() {
  const route = useRoute();
  const Page = PAGES[route];
  return <Page key={route} />;
}
