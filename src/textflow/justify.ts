import { OBSTACLE } from "../config/timings";

const SPACES = / /g;

/**
 * word-spacing (px) that stretches a line fragment to its slot (spec §11.3).
 * 0 = leave it left-aligned: the paragraph's last line, a fragment with no
 * gaps, or one whose gaps would open wider than MAX_JUSTIFY_RATIO × a space.
 */
export function justifySpacing(text: string, naturalWidth: number, slotWidth: number, endsParagraph: boolean, spaceWidth: number): number {
  if (endsParagraph) return 0;
  const gaps = text.match(SPACES)?.length ?? 0;
  if (gaps === 0) return 0;
  const extra = (slotWidth - naturalWidth) / gaps;
  if (extra <= 0 || spaceWidth + extra > OBSTACLE.MAX_JUSTIFY_RATIO * spaceWidth) return 0;
  return extra;
}
