/**
 * Read a color/font token from config/tokens.css at runtime, for code that
 * can't use CSS directly (canvas, GSAP color tweens). Cache the result; don't
 * call this inside animation frames.
 */
export function readToken(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
