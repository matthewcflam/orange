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
  /** The `>` cursor sits partly outside square A, so it fades as the paint starts. */
  CURSOR_OUT: 0.15,
  SQUARE_A_START: 0,
  SQUARE_B_OFFSET: 0.25,
  /** Square A (which alone covers the options) finishes at SQUARE_DURATION. */
  OPTIONS_UNMOUNT: 0.5,
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
  /** TODO(open-question #1): deep link — after the paint-over, the map and the
   *  requested page fade in (the squares and name block fade out) instead of
   *  the home sequence. */
  DEEP_LINK_FADE: 0.4,
} as const;

/** Brush-mask paint-over of the grey squares (§6.6). */
export const PAINT = {
  /** Total time to paint one square. */
  SQUARE_DURATION: 0.45,
  STROKES_PER_SQUARE: 4,
  /** How much consecutive strokes overlap in time (0–1 of a stroke). */
  STROKE_OVERLAP: 0.35,
  STROKE_EASE: "power1.inOut",
  STROKE_WIDTH_PX: 70,
  /** Passes run past the square's edges by this (plus BRISTLE_SCALE). */
  STROKE_OVERSHOOT_PX: 6,
  /** Each pass rises this much end to end, and bows this much in the middle. */
  STROKE_TILT_PX: 10,
  STROKE_BOW_PX: 6,
  /** paint.stroke pitch is randomized ± this many semitones per stroke. */
  STROKE_PITCH_SEMITONES: 2,
  /** feTurbulence / feDisplacementMap for bristly edges. */
  BRISTLE_FREQUENCY: 0.04,
  BRISTLE_OCTAVES: 2,
  BRISTLE_SCALE: 10,
} as const;

/** "who?" spray engine (§7.2). Distances are mockup px (1440×1024 frame),
 *  which are also the units of who-spray.svg. */
export const SPRAY = {
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
} as const;

/** Station hover/click on either map layout (§7.3). */
export const STATION = {
  HOVER_SCALE: 1.25,
  HOVER_DURATION: 0.25,
  HOVER_EASE: "back.out",
} as const;

/** Project pages (§10). */
export const PROJECT = {
  SCRIBBLE_DRAW: 0.5,
  SCRIBBLE_EASE: "power2.inOut",
  /** Placeholder project switch crossfade (§15 #3). */
  SWITCH_OUT: 0.35,
  SWITCH_IN: 0.45,
  SWITCH_OFFSET_PX: 8,
  LINK_UNDERLINE_DRAW: 0.4,
  /** Mouse parallax on design artifacts. */
  PARALLAX_MAX_PX: 12,
  PARALLAX_SMOOTHING: 0.6,
} as const;

/** Obstacle text (§11). */
export const OBSTACLE = {
  PADDING_PX: 10,
  MIN_SLOT_PX: 40,
  /** Don't justify a fragment whose gaps would exceed this × a normal space. */
  MAX_JUSTIFY_RATIO: 3,
  NUDGE_PX: 10,
  NUDGE_SHIFT_PX: 40,
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

/** prefers-reduced-motion variants (§12). */
export const REDUCED = {
  PAINT_FADE: 0.2,
} as const;
