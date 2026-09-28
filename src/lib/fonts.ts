import { FONTS } from "../config/timings";

/**
 * Font family names as Fontsource registers them (spec §5.1). The variable
 * packages add a " Variable" suffix; the short name silently falls back.
 * These must match the stacks in config/tokens.css.
 */
export const FAMILY = {
  body: "Inter Variable",
  name: "Newsreader Variable",
  station: "Fragment Mono",
  sound: "Monofett",
  muted: "Megrim",
} as const;

/** Project body text (spec §10.1). Integer px: Firefox rounds canvas sizes. */
export const BODY_TEXT = {
  weight: 400,
  sizePx: 16,
  lineHeightPx: 19,
} as const;

/**
 * Build a CSS `font` shorthand. Use this for BOTH the DOM style and the Pretext
 * prepare() call, so the measured font can never drift from the rendered one.
 */
export function fontString(weight: number, sizePx: number, family: string): string {
  return `${weight} ${sizePx}px "${family}"`;
}

export const BODY_FONT = fontString(BODY_TEXT.weight, BODY_TEXT.sizePx, FAMILY.body);

/**
 * Resolve once every font the first screens need is loaded, or after the
 * timeout (spec §5.4). The gate waits for this so no font swap lands
 * mid-animation or after Pretext has measured.
 */
export async function waitForFonts(timeoutMs = FONTS.TIMEOUT_MS): Promise<void> {
  await Promise.race([
    Promise.all([
      document.fonts.load(`1em "${FAMILY.sound}"`),
      document.fonts.load(`1em "${FAMILY.muted}"`),
      document.fonts.load(`1em "${FAMILY.name}"`),
      document.fonts.load(`1em "${FAMILY.station}"`),
      document.fonts.load(fontString(400, 16, FAMILY.body)),
      document.fonts.load(fontString(900, 16, FAMILY.body)), // Palimpsest heavy weight
    ]),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
