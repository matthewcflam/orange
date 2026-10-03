/**
 * Page code and image preload/decode (spec §10.3). Station and project-list hover call
 * prefetchRoute(); the page transition awaits preloadRoute() before it swaps
 * the page in, so heroes are decoded by the time they're shown.
 */
import { projectByPath } from "../content/projects";
import { ABOUT_PHOTOS } from "../content/aboutPhotos";

/** vite-imagetools `as=picture` output: srcset per format + <img> fallback. */
export interface Picture {
  /** Format ("avif", "webp") → srcset. */
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
}

/** Rendered width of a hero: 600 article px = 660 × --px (project.css, global.css). */
export const HERO_SIZES = "(min-aspect-ratio: 1767/1024) 64.5vh, 37.4vw";

interface RouteImage {
  picture: Picture;
  sizes: string;
}

/** Above-the-fold images per route. */
function routeImages(path: string): RouteImage[] {
  if (path === "/about") return ABOUT_PHOTOS.map(({ picture, sizes }) => ({ picture, sizes }));
  const heroes = projectByPath(path)?.heroes ?? [];
  return heroes.flatMap((h) => (h.kind === "image" ? [{ picture: h.picture, sizes: HERO_SIZES }] : []));
}

const loads = new Map<Picture, Promise<void>>();

/** A detached <picture> picks the same source the page will, so the fetch and
 *  decode land in the cache the real <img> uses. */
function load({ picture: pic, sizes }: RouteImage): Promise<void> {
  let p = loads.get(pic);
  if (!p) {
    const picture = document.createElement("picture");
    for (const [format, srcset] of Object.entries(pic.sources)) {
      const source = document.createElement("source");
      source.type = `image/${format}`;
      source.sizes = sizes;
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

const urlLoads = new Map<string, Promise<void>>();

/** Fetch and decode a plain image URL (the About photos' light frost). */
export function decodeUrl(src: string): Promise<void> {
  let p = urlLoads.get(src);
  if (!p) {
    const img = new Image();
    img.src = src;
    p = img.decode().catch(() => {
      urlLoads.delete(src);
    });
    urlLoads.set(src, p);
  }
  return p;
}

/** Plain image URLs per route (decoded alongside its pictures). */
function routeUrls(path: string): string[] {
  return path === "/about" ? ABOUT_PHOTOS.map((p) => p.frostLight) : [];
}

/** The Projects page chunk (pages/Outlet.tsx lazy-loads it). */
export const loadProjects = () => import("../pages/projects/Projects");

/** Fetch a route's code and decode its images. Never rejects. */
export function preloadRoute(path: string): Promise<void> {
  const code = projectByPath(path) ? loadProjects().then(() => undefined, () => undefined) : null;
  return Promise.all([...routeImages(path).map(load), ...routeUrls(path).map(decodeUrl), code]).then(() => undefined);
}

/** Start fetching a route's images. Cheap to call repeatedly (hover). */
export function prefetchRoute(path: string): void {
  void preloadRoute(path);
}
