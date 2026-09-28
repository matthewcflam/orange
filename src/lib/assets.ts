/**
 * Page asset preload/decode helpers (spec §10.3).
 * TODO(milestone 7): pages register their images here; station hover calls
 * prefetchRoute().
 */

/** Start fetching a route's images. Cheap to call repeatedly (hover). */
export function prefetchRoute(_path: string): void {}
