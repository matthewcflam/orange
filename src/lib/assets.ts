/**
 * Page code and image preload/decode (spec §10.3). Station and project-list hover call
 * prefetchRoute(); the page transition awaits preloadRoute() before it swaps
 * the page in, so heroes are decoded by the time they're shown.
 */
import { projectByPath } from "../content/projects";

/** vite-imagetools `as=picture` output: srcset per format + <img> fallback. */
export interface Picture {
  /** Format ("avif", "webp") → srcset. */
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

/** Rendered width of a hero: 600 article px = 660 × --px (project.css, global.css). */
export const HERO_SIZES = "(min-aspect-ratio: 1767/1024) 64.5vh, 37.4vw";

/** Above-the-fold images per route. */
function routeImages(path: string): Picture[] {
  const heroes = projectByPath(path)?.heroes ?? [];
  return heroes.flatMap((h) => (h.kind === "image" ? [h.picture] : []));
}

const loads = new Map<Picture, Promise<void>>();

/** A detached <picture> picks the same source the page will, so the fetch and
 *  decode land in the cache the real <img> uses. */
function load(pic: Picture): Promise<void> {
  let p = loads.get(pic);
  if (!p) {
    const picture = document.createElement("picture");
    for (const [format, srcset] of Object.entries(pic.sources)) {
      const source = document.createElement("source");
      source.type = `image/${format}`;
      source.sizes = HERO_SIZES;
      source.srcset = srcset;
      picture.append(source);
    }
    const img = document.createElement("img");
    img.src = pic.img.src;
    picture.append(img);
    p = img.decode().catch(() => {
      loads.delete(pic); // retry on the next hover
    });
    loads.set(pic, p);
  }
  return p;
}

/** The Projects page chunk (pages/Outlet.tsx lazy-loads it). */
export const loadProjects = () => import("../pages/projects/Projects");

/** Fetch a route's code and decode its images. Never rejects. */
export function preloadRoute(path: string): Promise<void> {
  const code = projectByPath(path) ? loadProjects().then(() => undefined, () => undefined) : null;
  return Promise.all([...routeImages(path).map(load), code]).then(() => undefined);
}

/** Start fetching a route's images. Cheap to call repeatedly (hover). */
export function prefetchRoute(path: string): void {
  void preloadRoute(path);
}
