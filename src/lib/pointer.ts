/**
 * The mouse's last position, so code can ask what sits under a cursor that
 * hasn't moved: pointerenter only fires on a move, so content that appears
 * under a still cursor never hears it. Mouse only; touch has no hover.
 */
let last: { x: number; y: number } | null = null;

document.addEventListener(
  "pointermove",
  (e) => {
    if (e.pointerType === "mouse") last = { x: e.clientX, y: e.clientY };
  },
  { passive: true, capture: true },
);

// Left the window: nothing is under it.
document.addEventListener(
  "pointerout",
  (e) => {
    if (!e.relatedTarget) last = null;
  },
  { passive: true },
);

/** Whether the resting mouse is over `el` (or something inside it). */
export function isUnderPointer(el: Element): boolean {
  const hit = last && document.elementFromPoint(last.x, last.y);
  return !!hit && el.contains(hit);
}
