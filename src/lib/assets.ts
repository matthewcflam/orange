/**
 * Page asset preload/decode helpers (spec §10.3).
 * TODO(milestone 7): pages register their images here; station hover calls
 * prefetchRoute(), and Palimpsest Phase 5 awaits preloadRoute().
 */

/** Start fetching a route's images. Cheap to call repeatedly (hover). */
export function prefetchRoute(_path: string): void {}

/** Resolves when a route's images are decoded. */
export function preloadRoute(_path: string): Promise<void> {
  return Promise.resolve();
}
