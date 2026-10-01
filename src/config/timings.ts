/**
 * EVERY duration, delay, ease and motion constant lives here (CLAUDE.md rule).
 * Units: seconds for anything GSAP or Web Audio uses, unless the name ends in
 * `_MS` or `_PX`. Values come from docs/spec.md; section numbers are noted.
 */

/** Font readiness (§5.4). */
export const FONTS = {
  /** Never hang on a failed font. */
  TIMEOUT_MS: 2000,
} as const;

/** Landing page / audio gate (§6.2–6.3). */
export const GATE_UI = {
  /** Gate fades in once fonts are ready. */
  FADE_IN: 0.3,
  /** `>` cursor slide between options. */
  CURSOR_SLIDE: 0.12,
  CURSOR_EASE: "power2.out",
} as const;

/** Gate → Home timeline (§6.5). Positions are seconds from the click. */
export const GATE = {
  /** The options vanish at the click and unmount here. */
  OPTIONS_UNMOUNT: 0,
  /** The map starts here. Pull it (and the steps after) earlier if the blank
   *  pause after the options vanish feels long. */
  ROUTE_IN: 0.6,
  ROUTE_IN_DURATION: 0.6,
  ROUTE_IN_EASE: "power2.out",
  STATIONS_IN: 0.7,
  LABELS_IN: 0.8,
  STATION_STAGGER: 0.08,
  STATION_FADE_DURATION: 0.4,
  STATION_SETTLE_PX: 6,
  STATION_EASE: "power2.out",
  SMILEY_IN: 1.0,
  SMILEY_IN_DURATION: 0.8,
  /** Measured from the click (user-confirmed). If it becomes "2s after the
   *  stations finish", the timeline position becomes ">+2". */
  WHO_DELAY: 2.0,
  /** TODO(open-question #1): deep link — the map and the requested page fade
   *  in (the name block fades out) instead of the home sequence. */
  DEEP_LINK_FADE: 0.4,
} as const;

/** "who?" spray engine (§7.2). Distances are mockup px (1440×1024 frame),
 *  which are also the units of who-spray.svg. */
export const SPRAY = {
  /** The whole spray, lead to last drip, lasts this long. The timings below
   *  set the proportions; they're all scaled by the same factor to fit. */
  TOTAL_S: 1.5,
  STROKE_EASE: "power1.inOut",
  /** Pause between strokes (the can lifts off). */
  LIFT_MIN: 0.08,
  LIFT_MAX: 0.15,
  /** Average nozzle speed along a stroke, px/s. power1.inOut peaks at 2× this. */
  NOZZLE_SPEED_PX: 900,
  /** Shortest stroke. The ?-dot is a near-zero-length path, so the nozzle
   *  dwells in place this long and builds up a blob. */
  MIN_STROKE: 0.16,
  /** Max distance between stamps so fast moves don't leave gaps. */
  STEP_PX: 2,
  /** Paint the can emits, in dots per second of stroke. Flow is constant, so
   *  slow parts of a stroke get heavier paint per px (density ∝ 1/speed). */
  FLOW_DOTS_PER_S: 18000,
  /** Dots per stamp are clamped to this range. */
  DOTS_MIN: 30,
  DOTS_MAX: 80,
  /** Core σ ≈ 7–8px so ±2σ ≈ the 30px guide stroke. */
  CORE_SIGMA_PX: 7.5,
  CORE_DOT_RADIUS_PX: [0.7, 1.8],
  CORE_ALPHA: [0.45, 0.9],
  OVERSPRAY_SIGMA_PX: 18,
  /** Share of each stamp's dots that are overspray. */
  OVERSPRAY_SHARE: 0.2,
  OVERSPRAY_DOT_RADIUS_PX: [0.5, 1.2],
  OVERSPRAY_ALPHA: [0.08, 0.3],
  /** 1 in N stamps spits a larger droplet. */
  SPIT_CHANCE: 1 / 40,
  SPIT_SIGMA_PX: 12,
  SPIT_RADIUS_PX: [2, 3.8],
  /** Rattle sample plays this long before the first stroke. */
  RATTLE_LEAD: 0.25,
  /** Chance that a stroke end grows a drip (the nozzle lingers there). */
  DRIP_CHANCE: 0.35,
  /** At most this many drips per spray. */
  DRIP_MAX: 2,
  DRIP_DURATION: 1.0,
  DRIP_EASE: "power2.out",
  DRIP_LENGTH_PX: [14, 40],
  DRIP_WIDTH_PX: [1.8, 3],
  /** Canvas margin around the 910×302 guide box, for overspray and drips. */
  CANVAS_PAD_PX: 60,
  /** Hiss gain smoothing (setTargetAtTime time constant). */
  HISS_TIME_CONSTANT: 0.015,
  /** Hiss level (0–1 of its max) at zero nozzle speed; full at peak speed. */
  HISS_FLOOR: 0.4,
} as const;

/** Shared chrome visibility (§4.1). */
export const CHROME = {
  /** Name block fades out off home and back in on home. */
  NAME_FADE: 0.3,
} as const;

/**
 * TEMPORARY (milestone 3): page swap between stations. Page fades out, map
 * morphs visibly, page fades in.
 */
export const TEMP_NAV = {
  OUT: 0.2,
  IN: 0.3,
  MAP_MORPH: 0.6,
  MAP_MORPH_EASE: "power3.inOut",
  /** The page swap waits up to this long for the next page's images (§10.3). */
  PRELOAD_MAX_MS: 800,
} as const;

/** Station hover/click on either map layout (§7.3). */
export const STATION = {
  HOVER_SCALE: 1.25,
  HOVER_DURATION: 0.25,
  HOVER_EASE: "back.out",
} as const;

/** Project pages (§10). */
export const PROJECT = {
  /** Orange scribble around the active project draws in (DrawSVG). */
  SCRIBBLE_DRAW: 0.5,
  SCRIBBLE_EASE: "power2.inOut",
  /** The previous project's scribble fades out. */
  SCRIBBLE_OUT: 0.2,
  /** Placeholder project switch crossfade (§15 #3): the center column, link
   *  and artifacts fade out drifting up, then fade in rising from below. */
  SWITCH_OUT: 0.35,
  SWITCH_IN: 0.45,
  SWITCH_OFFSET_PX: 8,
  SWITCH_EASE_OUT: "power2.in",
  SWITCH_EASE_IN: "power2.out",
  /** Link underline redraws on hover. */
  LINK_UNDERLINE_DRAW: 0.4,
  LINK_UNDERLINE_EASE: "power2.out",
  /** Mouse parallax on design artifacts: an artifact at depth 1 moves up to
   *  PARALLAX_MAX_PX (mockup px) against the pointer. */
  PARALLAX_MAX_PX: 12,
  PARALLAX_SMOOTHING: 0.6,
  PARALLAX_EASE: "power3",
} as const;

/** Obstacle text (§11). Distances are mockup px (scaled with the column). */
export const OBSTACLE = {
  /** Gap left between the obstacle and the text on each side. */
  PADDING_PX: 10,
  /** A slot narrower than this is skipped (too narrow for a word). */
  MIN_SLOT_PX: 40,
  /** The obstacle only splits a line if it reaches this far into the line
   *  box (glyphs don't fill its top and bottom), so a shape that grazes a
   *  line doesn't cut it. */
  BAND_INSET_PX: 2,
  /** Don't justify a fragment whose gaps would exceed this × a normal space. */
  MAX_JUSTIFY_RATIO: 3,
  /** Arrow keys move the focused obstacle (Shift = the larger step). */
  NUDGE_PX: 10,
  NUDGE_SHIFT_PX: 40,
  NUDGE_DURATION: 0.15,
  NUDGE_EASE: "power2.out",
  /** drag.grain loop: full level at this obstacle speed (mockup px/s),
   *  smoothed with this time constant, faded out over GRAIN_FADE. */
  GRAIN_FULL_SPEED_PX: 1500,
  GRAIN_TIME_CONSTANT: 0.05,
  GRAIN_FADE: 0.15,
} as const;

/** Screen door: the page as a close-up LCD panel, over home and the minimap
 *  (fx/screenDoorEngine.ts). Strengths are 0–1; distances are mockup px. */
export const SCREEN_DOOR = {
  /** Pixel pitch in CSS px: one R, G and B column each, plus a gap row. */
  PITCH_PX: 3,
  /** Subpixel grid strength. */
  STRENGTH: 0.08,
  /** Darkening of the gap row between pixels. */
  GAP: 0.04,
  /** Per-frame grain (darkening, 0–1). */
  GRAIN: 0.01,
  /** Pointer: the grid shows more strongly within this Gaussian radius. */
  CURSOR_RADIUS_PX: 180,
  CURSOR_STRENGTH: 0.12,
  /** The patch trails the pointer by roughly this long. */
  CURSOR_LAG: 0.6,
  /** Patch fades in/out when the pointer enters/leaves the window. */
  CURSOR_FADE: 0.4,
  /** Fades in with the route after the gate (and with a deep-linked page). */
  FADE_IN: 0.8,

  // ---- Shimmer (a retro panel that never sits still) ----
  /** A soft refresh bar rolling top → bottom: seconds per pass, height, and
   *  how much it darkens / strengthens the grid. */
  SHIMMER_BAR_PERIOD: 7,
  SHIMMER_BAR_HEIGHT_PX: 160,
  SHIMMER_BAR_STRENGTH: 0.05,
  /** Each pixel row's darkening jitters every frame by up to this much. */
  SHIMMER_FLICKER: 0.012,
  /** Fraction of pixels glinting at any moment, and how long a glint lasts. */
  SHIMMER_SPARKLE: 0.001,
  SHIMMER_SPARKLE_S: 0.12,
  /** How dark a glinting pixel's subpixels get. */
  SHIMMER_SPARKLE_STRENGTH: 0.07,

  // ---- "who?" spray breaking the panel ----
  // The panel is a grid of driver zones. A hit kills the zone under the
  // nozzle (and sometimes a neighbour): it goes black, holds, stutters a few
  // times, then snaps back with a burst of saturated subpixels. Every zone
  // draws its own timings, so they return unevenly.
  /** The spray reports a hit at most this often (seconds). */
  IMPACT_EVERY_S: 0.05,
  /** Strength of a hit from a fast nozzle; a dwelling nozzle hits at 1. */
  IMPACT_STRENGTH_MIN: 0.5,
  /** Zone size in mockup px (rounded to whole pixel pitches). */
  ZONE_W: 96,
  ZONE_H: 72,
  /** Chance (× hit strength) that each of the 8 neighbours dies too. */
  ZONE_SPREAD: 0.12,
  /** Black hold after a zone's last hit: log-normal, so most zones return
   *  quickly and a few linger. Median and spread (sigma of ln) in seconds. */
  HOLD_MEDIAN: 0.6,
  HOLD_SPREAD: 0.8,
  HOLD_MAX: 4,
  /** Before returning, a zone blinks back on 0–STUTTER_MAX times: on for
   *  STUTTER_ON_S, then black again for OFF_MIN–OFF_MAX. */
  STUTTER_MAX: 3,
  STUTTER_ON_S: 0.03,
  STUTTER_OFF_MIN: 0.04,
  STUTTER_OFF_MAX: 0.15,
  /** The final snap back takes RETURN_MIN–RETURN_MAX seconds. */
  RETURN_MIN: 0.06,
  RETURN_MAX: 0.25,
  /** Subpixel saturation at the peak of a return (0 = none, 1 = pure R/G/B). */
  FRINGE_GRID: 0.6,
  /** Returning zones slip pixel rows by one subpixel; the dice re-roll
   *  GLITCH_HZ times a second. SLIP_CHANCE: per row, at full fringe. */
  GLITCH_HZ: 15,
  SLIP_CHANCE: 0.3,
} as const;

/** Sound engine (§9). */
export const AUDIO = {
  /** ± playbackRate variation per play. */
  RATE_VARIATION: 0.05,
  /** ± gain variation per play. */
  GAIN_VARIATION: 0.1,
  DEFAULT_VOICE_LIMIT: 4,
  VOICE_STEAL_FADE: 0.01,
  MUTE_RAMP: 0.05,
  LIMITER: { threshold: -6, ratio: 20, attack: 0.003, release: 0.1 },
} as const;
