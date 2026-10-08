/**
 * Route table and station metadata (spec §4.4). Page components are mapped in
 * pages/Outlet.tsx so this file stays free of React.
 */

export type StationId = "about" | "experience" | "projects";

export interface Station {
  id: StationId;
  label: string;
  /** Where clicking the station goes. */
  path: string;
  /** Upper track (left of the diagonal) or lower track. */
  track: "upper" | "lower";
  /** Not built yet: clicking shows "coming soon!" instead of navigating, and
   *  its pages redirect home. */
  comingSoon?: boolean;
}

/** Line order, left to right: About → Experience → Projects. */
export const STATIONS: readonly Station[] = [
  { id: "about", label: "About", path: "/about", track: "upper" },
  { id: "experience", label: "Experience", path: "/experience", track: "lower" },
  // TODO(projects): the Projects pages aren't finished (user request); drop comingSoon to open them.
  { id: "projects", label: "Projects", path: "/projects/portfolio", track: "lower", comingSoon: true },
];

/** Stations whose pages are closed for now (STATIONS' comingSoon). */
const CLOSED = new Set(STATIONS.filter((s) => s.comingSoon).map((s) => s.id));

export interface RouteDef {
  path: string;
  /** Page name for document.title. */
  title: string;
  /** The station this page belongs to (null: home). */
  station: StationId | null;
  /** Page colours (global.css): light on home, dark on station pages. */
  theme: "light" | "dark";
}

export const ROUTES: readonly RouteDef[] = [
  { path: "/", title: "Matthew Lam", station: null, theme: "light" },
  { path: "/about", title: "About", station: "about", theme: "dark" },
  { path: "/experience", title: "Experience", station: "experience", theme: "dark" },
  { path: "/projects/portfolio", title: "Portfolio", station: "projects", theme: "dark" },
  { path: "/projects/oyster-news", title: "Oyster News", station: "projects", theme: "dark" },
  { path: "/projects/mango", title: "Mango", station: "projects", theme: "dark" },
];

const REDIRECTS: Record<string, string> = {
  "/projects": "/projects/portfolio",
};

const byPath = new Map(ROUTES.map((r) => [r.path, r]));

/** Canonical path for any URL path: trailing slash stripped, redirects
 *  applied, unknown paths and closed (comingSoon) stations sent home. */
export function resolvePath(path: string): string {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const target = REDIRECTS[clean] ?? clean;
  const route = byPath.get(target);
  return route && !(route.station && CLOSED.has(route.station)) ? target : "/";
}

export function routeFor(path: string): RouteDef {
  return byPath.get(resolvePath(path))!;
}

export function documentTitle(route: RouteDef): string {
  return route.path === "/" ? route.title : `${route.title} · Matthew Lam`;
}
