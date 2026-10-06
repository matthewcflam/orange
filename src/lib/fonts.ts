import { FONTS } from "../config/timings";

/**
 * Font family names as Fontsource registers them (spec §5.1). The variable
 * packages add a " Variable" suffix; the short name silently falls back.
 * These must match the stacks in config/tokens.css.
 */
export const FAMILY = {
  body: "Inter Variable",
  name: "Inter Variable",
  station: "Fragment Mono",
  sound: "Inter Variable",
  muted: "Inter Variable",
} as const;

/** Project body text (spec §10.1; 15px measured from the mockups, see
 *  pages/project.css). Integer px: Firefox rounds canvas sizes. */
export const BODY_TEXT = {
  weight: 400,
  sizePx: 15,
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
 * mid-animation or after Pretext has measured. Only Inter: Fragment Mono
 * (the mute toggle, hero placeholder labels) loads on use and may swap in. The
 * Inter latin file is preloaded from index.html (vite.config.ts).
 */
export async function waitForFonts(timeoutMs = FONTS.TIMEOUT_MS): Promise<void> {
  await Promise.race([
    Promise.all([
      document.fonts.load(`1em "${FAMILY.sound}"`),
      document.fonts.load(`1em "${FAMILY.muted}"`),
      document.fonts.load(fontString(400, 16, FAMILY.body)),
    ]),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
