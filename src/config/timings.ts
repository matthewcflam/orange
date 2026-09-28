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
  /** TODO(milestone 4): temporary gate exit fade, replaced by the paint-over. */
  TEMP_LEAVE: 0.3,
} as const;

/** Gate → Home timeline (§6.5). Positions are seconds from the click. */
export const GATE = {
  SQUARE_A_START: 0,
  SQUARE_B_OFFSET: 0.25,
  OPTIONS_UNMOUNT: 0.5,
  ROUTE_IN: 0.6,
  ROUTE_IN_DURATION: 0.6,
  ROUTE_IN_EASE: "power2.out",
  STATIONS_IN: 0.7,
  LABELS_IN: 0.8,
  STATION_STAGGER: 0.08,
  STATION_FADE_DURATION: 0.4,
  STATION_SETTLE_PX: 6,
  SMILEY_IN: 1.0,
  SMILEY_IN_DURATION: 0.8,
  /** Measured from the click (user-confirmed). If it becomes "2s after the
   *  stations finish", the timeline position becomes ">+2". */
  WHO_DELAY: 2.0,
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
  /** feTurbulence / feDisplacementMap for bristly edges. */
  BRISTLE_FREQUENCY: 0.04,
  BRISTLE_OCTAVES: 2,
  BRISTLE_SCALE: 10,
} as const;

/** "who?" spray engine (§7.2). */
export const SPRAY = {
  STROKE_EASE: "power1.inOut",
  /** Pause between strokes (the can lifts off). */
  LIFT_MIN: 0.08,
  LIFT_MAX: 0.15,
  /** Nozzle speed along a stroke, px/s, before easing. */
  NOZZLE_SPEED_PX: 900,
  /** Max distance between stamps so fast moves don't leave gaps. */
  STEP_PX: 2,
  DOTS_MIN: 30,
  DOTS_MAX: 80,
  /** Core σ ≈ 7–8px so ±2σ ≈ the 30px guide stroke. */
  CORE_SIGMA_PX: 7.5,
  OVERSPRAY_SIGMA_PX: 18,
  /** 1 in N stamps spits a larger droplet. */
  SPIT_CHANCE: 1 / 40,
  /** Rattle sample plays this long before the first stroke. */
  RATTLE_LEAD: 0.25,
  /** Respray on later returns home is this fraction of the full duration. */
  RESPRAY_SPEED: 0.6,
  DRIP_DURATION: 1.0,
  /** Hiss gain smoothing (setTargetAtTime time constant). */
  HISS_TIME_CONSTANT: 0.015,
} as const;

/** Shared chrome visibility (§4.1). */
export const CHROME = {
  /** Name block fades out off home and back in on home. */
  NAME_FADE: 0.3,
} as const;

/**
 * TEMPORARY (milestone 3): stand-in page swap until Palimpsest (milestone 6).
 * Page fades out, map morphs visibly, page fades in.
 */
export const TEMP_NAV = {
  OUT: 0.2,
  IN: 0.3,
  /** Visible here so the morph can be checked; Palimpsest does it at black. */
  MAP_MORPH: 0.6,
  MAP_MORPH_EASE: "power3.inOut",
  /** TODO(milestone 4): map fade-in after the gate, replaced by the route draw-in. */
  MAP_IN: 0.4,
} as const;

/** Station hover/click on either map layout (§7.3). */
export const STATION = {
  HOVER_SCALE: 1.25,
  HOVER_DURATION: 0.25,
  HOVER_EASE: "back.out",
} as const;

/** Palimpsest station-to-station transition (§8). */
export const PALIMPSEST = {
  // Phase 1: dot
  DOT_GROW_SCALE: 1.6,
  DOT_GROW: 0.18,
  DOT_GROW_EASE: "back.out(3)",
  DOT_SETTLE: 0.2,
  /** Stack starts this long before the dot settles. */
  STACK_OVERLAP: 0.1,
  // Phase 2: stack
  STACK_COPIES: 16,
  /** Interval between copies shrinks from START to END (accelerates). */
  STACK_INTERVAL_START: 0.09,
  STACK_INTERVAL_END: 0.03,
  STACK_FIRST_OFFSET_PX: 150,
  STACK_FONT_WEIGHT: 900,
  // Phase 3: seal
  SEAL: 0.15,
  // Phase 5: wait
  PRELOAD_TIMEOUT: 3,
  // Phase 6: tunnel exit
  TUNNEL: 1.1,
  TUNNEL_EASE: "expo.inOut",
  /** Soft trailing edge of the black layer, in vw. */
  TUNNEL_EDGE_VW: 15,
  LIGHT_BLEED_FROM: 0.6,
  LIGHT_BLEED: 0.8,
  LIGHT_BLEED_OFFSET: 0.2,
  PAGE_SCALE_FROM: 1.04,
  PAGE_SETTLE_EASE: "expo.out",
  // Guards
  /** Force the reveal if the overlay has been black this long (§8.5). */
  BLACK_SAFETY: 5,
  /** Map morph while black (§8.4). */
  MAP_MORPH: 0.01,
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
  TUNNEL_CUTOFF_START_HZ: 300,
  TUNNEL_CUTOFF_END_HZ: 10000,
} as const;

/** prefers-reduced-motion variants (§12). */
export const REDUCED = {
  PALIMPSEST_FADE: 0.25,
  PAINT_FADE: 0.2,
} as const;
