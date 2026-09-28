/** prefers-reduced-motion (spec §12). Read when an animation starts, so a
 *  change in system settings applies to the next one. */
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
