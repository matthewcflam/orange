/**
 * Custom History API router (spec §4.3). Module-level singleton.
 *
 * Model: the URL changes when the user acts; the page catches up at black.
 * navigate() pushes history immediately, then runs the transition. The
 * transition calls commit() when the screen is covered; commit never touches
 * history. Back/forward during a transition is queued (the latest wins).
 */
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { documentTitle, resolvePath, routeFor } from "../config/routes";

/**
 * Runs the visual transition to `to`. Must call `commit()` exactly once, when
 * the old page is hidden, and resolve when input can be unlocked.
 */
export type TransitionRunner = (to: string, commit: () => void) => Promise<void>;

let current = resolvePath(location.pathname);
let transitioning = false;
let queued: string | null = null;
let runner: TransitionRunner = async (_to, commit) => commit();
const listeners = new Set<() => void>();
let idleWaiters: (() => void)[] = [];

// Canonicalize the entry URL (/projects → /projects/oyster-news, unknown → /).
if (current !== location.pathname) history.replaceState(null, "", current);
document.title = documentTitle(routeFor(current));

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getRoute = () => current;
export const isInputLocked = () => transitioning;

/** Resolves once no transition (or queued one) is running; immediately if idle.
 *  A page that mounts at commit uses it to start its entrance afterwards. */
export function whenIdle(): Promise<void> {
  return transitioning ? new Promise((resolve) => idleWaiters.push(resolve)) : Promise.resolve();
}

/** Current canonical path; re-renders on commit. */
export function useRoute(): string {
  return useSyncExternalStore(subscribe, getRoute);
}

/** Palimpsest registers itself here (main.tsx). */
export function setTransitionRunner(fn: TransitionRunner): void {
  runner = fn;
}

/** Swap the page. Called by the transition at black; never touches history.
 *  Flushed synchronously so the new page is in the DOM when this returns. */
function commitRoute(to: string) {
  if (to === current) return;
  current = to;
  document.title = documentTitle(routeFor(to));
  window.scrollTo(0, 0);
  flushSync(emit);
}

async function run(to: string) {
  transitioning = true;
  try {
    await runner(to, () => commitRoute(to));
  } finally {
    commitRoute(to); // no-op unless the runner failed before committing
    transitioning = false;
    const next = queued;
    queued = null;
    if (next && next !== current) void run(next);
    if (!transitioning) {
      const waiters = idleWaiters;
      idleWaiters = [];
      for (const w of waiters) w();
    }
  }
}

/** The one internal entry point, so the History API could later be swapped
 *  for the Navigation API without touching callers (§4.3). */
function go(path: string, { push }: { push: boolean }) {
  const to = resolvePath(path);
  if (!push && to !== location.pathname) history.replaceState(null, "", to);
  if (transitioning) {
    // Clicks are ignored mid-transition; back/forward already moved the URL.
    if (!push) queued = to;
    return;
  }
  if (to === current) return;
  if (push) history.pushState(null, "", to);
  void run(to);
}

/** Station, link or mini-map click. */
export function navigate(path: string): void {
  go(path, { push: true });
}

/** onClick for real <a href> links: lets modified clicks (new tab etc.) through. */
export function onNavClick(e: React.MouseEvent, path: string): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(path);
}

const onPopState = () => go(location.pathname, { push: false });
window.addEventListener("popstate", onPopState);

if (import.meta.hot) {
  import.meta.hot.dispose(() => window.removeEventListener("popstate", onPopState));
}
