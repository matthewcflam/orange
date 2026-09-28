/**
 * Route table and station metadata (spec §4.4). Page components are mapped in
 * pages/Outlet.tsx so this file stays free of React.
 */

export type StationId = "home" | "about" | "experience" | "projects" | "inspo";

export interface Station {
  id: StationId;
  label: string;
  /** Where clicking the station goes. */
  path: string;
  /** Upper track (left of the diagonal) or lower track. */
  track: "upper" | "lower";
}

/** Line order, left to right: Home → About → Experience → Projects → Inspo. */
export const STATIONS: readonly Station[] = [
  { id: "home", label: "Home", path: "/", track: "upper" },
  { id: "about", label: "About", path: "/about", track: "upper" },
  { id: "experience", label: "Experience", path: "/experience", track: "lower" },
  { id: "projects", label: "Projects", path: "/projects/oyster-news", track: "lower" },
  { id: "inspo", label: "Inspo", path: "/inspo", track: "lower" },
];

export interface RouteDef {
  path: string;
  /** Page name for document.title and "Coming soon" placeholders. */
  title: string;
  /** The station shown as current on the map. */
  station: StationId;
}

export const ROUTES: readonly RouteDef[] = [
  { path: "/", title: "Matthew Lam", station: "home" },
  { path: "/about", title: "About", station: "about" },
  { path: "/experience", title: "Experience", station: "experience" },
  { path: "/projects/oyster-news", title: "Oyster News", station: "projects" },
  { path: "/projects/mango", title: "Mango", station: "projects" },
  { path: "/projects/portfolio", title: "Portfolio", station: "projects" },
  { path: "/inspo", title: "Inspo", station: "inspo" },
];

const REDIRECTS: Record<string, string> = {
  "/projects": "/projects/oyster-news",
};

const byPath = new Map(ROUTES.map((r) => [r.path, r]));

/** Canonical path for any URL path: trailing slash stripped, redirects
 *  applied, unknown paths sent home. */
export function resolvePath(path: string): string {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const target = REDIRECTS[clean] ?? clean;
  return byPath.has(target) ? target : "/";
}

export function routeFor(path: string): RouteDef {
  return byPath.get(resolvePath(path))!;
}

export function documentTitle(route: RouteDef): string {
  return route.path === "/" ? route.title : `${route.title} · Matthew Lam`;
}
