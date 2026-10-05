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
  /** Measured from the click (user-confirmed). If it becomes "2s after the
   *  stations finish", the timeline position becomes ">+2". */
  WHO_DELAY: 2.0,
  /** TODO(open-question #1): deep link — the map and the requested page fade
   *  in (the name block fades out) instead of the home sequence. */
  DEEP_LINK_FADE: 0.4,
} as const;

/** "who?" spray engine (§7.2). Distances are mockup px (the 1767×1024 frame),
 *  which are also the units of who-spray.svg. */
export const SPRAY = {
  // The nozzle's speed, the lifts and the lead (so the spray's length) are
  // set per segment in config/sprayPace.ts, shaped by spray/paceModel.ts.
  /** Max distance between stamps so fast moves don't leave gaps. */
  STEP_PX: 2,
  /** Paint the can emits, in dots per second of stroke. Flow is constant, so
   *  slow parts of a stroke get heavier paint per px (density ∝ 1/speed), and
   *  a slower sprayPace means more paint overall. (18000 before the pace
   *  table; 21000 keeps the same total paint at its starting values.) */
  FLOW_DOTS_PER_S: 21000,
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

/** Home: the "email copied to clipboard!" toast by the icons. */
export const HOME = {
  TOAST_IN: 0.25,
  TOAST_EASE: "power2.out",
  TOAST_RISE_PX: 6,
  TOAST_HOLD: 1.6,
  TOAST_OUT: 0.4,
  /** The bio and icons fade in after the gate, with the map's labels. */
  BIO_IN: 0.8,
  BIO_IN_DURATION: 0.6,
} as const;

/** Shared chrome visibility (§4.1). */
export const CHROME = {
  /** Name block fades out off home and back in on home. */
  NAME_FADE: 0.3,
} as const;

/**
 * Page transition between pages (transition/pageTransition.ts), copied from
 * 2xa.studio: a cover dithers in over everything, "Now arriving at: <name>"
 * scramble-types on it, the page swaps underneath, then the cover dithers away
 * bottom to top. The cover is dark leaving home, light leaving a station page.
 * Defaults are 2xa's own values.
 */
export const TRANSITION = {
  /** Cover fills in (progress 0 → 1). expo.out: ~90% covered by 0.35s. */
  SHOW: 1,
  SHOW_EASE: "expo.out",
  /** Cover stays solid after the page swap, before clearing. */
  HOLD: 1,
  /** Cover clears (progress 1 → 0). expo.out: mostly gone by ~0.8s. */
  HIDE: 3,
  HIDE_EASE: "expo.out",
  /** Input unlocks once the clearing cover's progress drops below this. */
  UNLOCK_PROGRESS: 0.05,

  // ---- Dither shader (2xa's uniforms) ----
  /** Simplex noise frequency of the wipe edge (aspect-corrected). */
  NOISE_FREQ: 0.5,
  /** How far the noise pushes the edge, in screen heights. */
  NOISE_STRENGTH: 0.8,
  /** Half-width of the dithered band, in screen heights. Wider = more dots. */
  EDGE_SMOOTH: 1.0,
  /** Bayer dither cell, device px. */
  DITHER_PX: 3,
  /** Optional chunky pixelation of the whole field, CSS px (0 = off). */
  PIXEL_SIZE: 0,
  MAX_DPR: 2,

  // ---- Title scramble (2xa's typer) ----
  TITLE_FPS: 20,
  /** Scramble variants each character passes through on its way in/out. */
  TITLE_CYCLES: 3,
  /** Fraction of the type-in spent scrambling (the rest is staggered starts). */
  TITLE_CYCLE_LENGTH: 0.5,

  /** Reduced motion: the cover just fades in and out. */
  REDUCED_FADE: 0.2,

  // ---- Under the cover ----
  /** The page swap waits up to this long for the next page's images (§10.3). */
  PRELOAD_MAX_MS: 800,
} as const;

/**
 * The vertical lines on station pages drop in like a train leaving a station
 * (lib/trainLine.ts): they accelerate, cruise at top speed, then brake.
 * Distances are mockup px, so the feel doesn't change with the window size;
 * a longer line (Experience) cruises for longer.
 */
export const LINE = {
  /** Acceleration and braking, mockup px/s². */
  ACCEL_PX_S2: 1500,
  /** Top speed, mockup px/s. */
  TOP_SPEED_PX_S: 900,
  /** After the page starts to appear, before the line sets off. */
  DELAY: 0.15,
} as const;

/** About photos: the frosted glass melts clear once the page is on screen
 *  (pages/AboutPhoto.tsx). Seconds. Look (blur, wash, grain) is in tokens.css. */
export const FROST = {
  /** After the page starts to appear, before the first photo melts. */
  DELAY: 0.25,
  /** Between photos, in content/aboutPhotos.ts order (top first). */
  STAGGER: 0.15,
  /** The heavy blur fades out. */
  HEAVY_S: 1.2,
  /** The milky wash and grain fade out (from the start, with the heavy blur). */
  WASH_S: 1.1,
  /** The light blur starts fading at this time, and takes this long. */
  LIGHT_AT: 0.5,
  LIGHT_S: 1.0,
} as const;

/** Experience (pages/Experience.tsx). Seconds unless noted. */
export const EXPERIENCE = {
  /** Scroll reveal (lib/scrollReveal.ts): each element fades up once as it
   *  enters the window. Rise in mockup px. */
  REVEAL_Y: 24,
  REVEAL_DURATION: 0.8,
  REVEAL_EASE: "power3.out",
  /** Between elements that enter together (the first screen cascades). */
  REVEAL_STAGGER: 0.06,
  /** After the page starts to appear, before the first screen reveals. */
  REVEAL_DELAY: 0.2,
  /** Reveal once this fraction of an element is in the window. (A fraction,
   *  not a margin above the bottom edge: elements at the page's foot, like
   *  the footer, could never scroll past such a line.) */
  REVEAL_THRESHOLD: 0.25,
  /** Hover photos: in while the cursor is over a job, out when it leaves. */
  PHOTO_IN: 0.45,
  PHOTO_OUT: 0.25,
  /** The photo on top lands this much after the one below. */
  PHOTO_STAGGER: 0.07,
  /** Photos grow from this scale and rise PHOTO_Y mockup px. */
  PHOTO_SCALE_FROM: 0.94,
  PHOTO_Y: 12,
  PHOTO_EASE: "power3.out",
} as const;

/** Station-page chrome: the Map pill (top-right). */
export const MAP_BUTTON = {
  /** portfolio-scribble.svg draws under "Map" on hover, undraws on leave. */
  SCRIBBLE_DRAW: 0.4,
  SCRIBBLE_UNDRAW: 0.25,
  SCRIBBLE_EASE: "power2.out",
  /** Pill colour change between Map and Close. */
  COLOR: 0.2,
} as const;

/**
 * The keychain the Map pill opens (keychain/): a static picture
 * (design/mockups-v2/Menu Open (3).png) that drops in from above as one piece.
 */
export const KEYCHAIN = {
  /** Open: the keychain slides in along the card's length from off screen
   *  right, SLIDE_PX (mockup px); close: it slides back out the same way. */
  SLIDE_PX: 500,
  OPEN: 0.5,
  OPEN_EASE: "power3.out",
  CLOSE: 0.45,
  CLOSE_EASE: "power2.in",
} as const;

/** Station hover/click on the home map (§7.3). */
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
  /** Placeholder project switch crossfade (§15 #3): the center column and
   *  link fade out drifting up, then fade in rising from below. */
  SWITCH_OUT: 0.35,
  SWITCH_IN: 0.45,
  SWITCH_OFFSET_PX: 8,
  SWITCH_EASE_OUT: "power2.in",
  SWITCH_EASE_IN: "power2.out",
  /** Link underline redraws on hover. */
  LINK_UNDERLINE_DRAW: 0.4,
  LINK_UNDERLINE_EASE: "power2.out",
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

/** Smooth wheel scrolling (Lenis, lib/scroll.ts). Touch stays native. */
export const SCROLL = {
  /** Fraction of the remaining distance covered per frame: lower = floatier. */
  LERP: 0.1,
  WHEEL_MULTIPLIER: 1,
} as const;

/** The cursor (chrome/Cursor.tsx): a dot that opens into a ring over
 *  anything clickable. Sizes in screen px (it doesn't scale with the frame). */
export const CURSOR = {
  DOT_PX: 10,
  RING_PX: 22,
  RING_STROKE_PX: 1.5,
  /** Dot ↔ ring. */
  GROW: 0.2,
  GROW_EASE: "power3.out",
} as const;

/** The scroll thumb (chrome/ScrollBar.tsx) that replaces the native scrollbar
 *  on mouse devices. Display only; shows while scrolling. Sizes in screen px. */
export const SCROLLBAR = {
  WIDTH_PX: 4,
  /** Gap from the right and top/bottom edges. */
  INSET_PX: 3,
  MIN_THUMB_PX: 40,
  OPACITY: 0.5,
  FADE_IN: 0.15,
  FADE_OUT: 0.4,
  /** Seconds after the last scroll frame before it fades out. */
  IDLE: 0.8,
} as const;
