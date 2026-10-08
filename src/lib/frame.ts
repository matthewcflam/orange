/**
 * The reference frame of design/mockups-v2: 1767×1024. CSS writes mockup
 * coordinates as calc(N * var(--px)) (global.css); TS code that needs the same
 * unit uses pxScale().
 */
export const FRAME = { W: 1767, H: 1024 } as const;

/** CSS px per mockup px: the value of --px. */
export function pxScale(): number {
  return Math.min(window.innerWidth / FRAME.W, window.innerHeight / FRAME.H);
}

/** Narrow, portrait or short windows get the stacked compact layout (open
 *  question #7, user decision). CSS repeats this query (global.css). */
export const COMPACT_QUERY = "(max-width: 760px), (max-aspect-ratio: 1/1), (max-height: 500px)";

const compactMql = window.matchMedia(COMPACT_QUERY);

export const isCompact = () => compactMql.matches;

/** Calls `fn` whenever the layout switches between compact and full; returns
 *  the unsubscribe. */
export function onCompactChange(fn: () => void): () => void {
  compactMql.addEventListener("change", fn);
  return () => compactMql.removeEventListener("change", fn);
}

/** The viewport's size in mockup px (it can be wider or taller than the frame). */
export function viewportInMockupPx() {
  const px = pxScale();
  return { w: window.innerWidth / px, h: window.innerHeight / px };
}

/** The project article (column, heroes, obstacle text) was designed in the old 1440×1024 frame. The Projects page draws
 *  it in its right pane at this many --px per old mockup px (project.css
 *  --apx must match). */
export const ARTICLE_SCALE = 1.1;

/** `<source sizes>` for an image box `w` mockup px wide in the --px frame. */
export const frameSizes = (w: number) =>
  `(min-aspect-ratio: 1767/1024) ${((w / FRAME.H) * 100).toFixed(2)}vh, ${((w / FRAME.W) * 100).toFixed(2)}vw`;
