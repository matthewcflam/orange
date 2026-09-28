/**
 * Sound manifest (spec §9.6). IDs, variant counts, bus and voice limits only;
 * never file paths. Files are discovered at build time from
 * assets-src/sounds/<id>.m4a (variants: <id>.<n>.m4a). Any ID without a file
 * plays the synthesized `placeholder` below, so adding a real sound needs no
 * code change (spec §9.5).
 */

export type Bus = "ui" | "transition" | "ambient";

export type Placeholder =
  /** Pitched blip: oscillator shape, frequency, length, decay. */
  | { type: "tone"; wave: "sine" | "triangle" | "square"; freq: number; dur: number }
  /** Filtered white-noise burst. `cutoff` is a one-pole lowpass in Hz. */
  | { type: "noise"; cutoff: number; dur: number }
  /** Seamless brown-noise loop (rumble, drag grain). */
  | { type: "brown"; dur: number };

export interface SoundDef {
  bus: Bus;
  /** Round-robin variants, played as <id>.1 … <id>.n. Omit for a single file. */
  variants?: number;
  /** Max simultaneous voices; the oldest is faded out when exceeded. */
  voices?: number;
  /** Base gain before per-play variation. */
  gain?: number;
  placeholder: Placeholder;
}

export const SOUNDS = {
  "gate.select":       { bus: "ui", gain: 0.8, placeholder: { type: "tone", wave: "triangle", freq: 660, dur: 0.35 } },
  "gate.cursor":       { bus: "ui", gain: 0.15, placeholder: { type: "tone", wave: "sine", freq: 1200, dur: 0.04 } },
  // User: the paint-over was "extremely loud" at 0.5 (8 overlapping noise bursts stack up). Keep it quiet.
  "paint.stroke":      { bus: "transition", variants: 4, gain: 0.08, placeholder: { type: "noise", cutoff: 2500, dur: 0.22 } },
  // New noise sounds start quiet (see the paint.stroke note); raise to taste.
  "spray.rattle":      { bus: "ambient", gain: 0.1, placeholder: { type: "noise", cutoff: 6000, dur: 0.18 } },
  "station.hover":     { bus: "ui", gain: 0.25, placeholder: { type: "tone", wave: "sine", freq: 880, dur: 0.06 } },
  "station.click":     { bus: "ui", gain: 0.6, placeholder: { type: "tone", wave: "triangle", freq: 1320, dur: 0.4 } },
  "palimpsest.thud":   { bus: "transition", variants: 3, voices: 6, gain: 0.7, placeholder: { type: "tone", wave: "sine", freq: 70, dur: 0.25 } },
  "palimpsest.rumble": { bus: "transition", voices: 1, gain: 0.6, placeholder: { type: "brown", dur: 3 } },
  "drag.grain":        { bus: "ambient", voices: 1, gain: 0.4, placeholder: { type: "brown", dur: 2 } },
  "text.tick":         { bus: "ui", voices: 2, gain: 0.12, placeholder: { type: "tone", wave: "square", freq: 2400, dur: 0.015 } },
  "project.select":    { bus: "ui", gain: 0.5, placeholder: { type: "tone", wave: "triangle", freq: 990, dur: 0.18 } },
  "link.hover":        { bus: "ui", gain: 0.2, placeholder: { type: "tone", wave: "sine", freq: 1760, dur: 0.05 } },
  "mute.toggle":       { bus: "ui", gain: 0.5, placeholder: { type: "tone", wave: "triangle", freq: 520, dur: 0.12 } },
} satisfies Record<string, SoundDef>;

export type SoundId = keyof typeof SOUNDS;

/** station.hover pitch per station index (About → Inspo), in semitones: a
 *  pentatonic run, so moving along the line sounds like a scale (§7.3). */
export const STATION_HOVER_SEMITONES = [0, 2, 4, 7, 9] as const;
export const semitonesToRate = (st: number) => 2 ** (st / 12);

/** Procedural sounds are synthesized live, never loaded (spec §9.4). */
export const PROCEDURAL_IDS = ["spray.hiss"] as const;

/** spray.hiss (§9.4): looping white noise → highpass → bandpass → gain. The
 *  gain follows nozzle speed every frame (audio/sprayHiss.ts). Started quiet,
 *  like every noise sound here. */
export const SPRAY_HISS = {
  bus: "ambient",
  /** Gain at full nozzle speed. */
  gain: 0.08,
  highpassHz: 1500,
  bandpassHz: 4500,
  bandpassQ: 0.8,
} as const satisfies { bus: Bus; gain: number; highpassHz: number; bandpassHz: number; bandpassQ: number };

/** Build-time discovery: "/assets-src/sounds/gate.select.m4a" → hashed URL. */
const files = import.meta.glob("/assets-src/sounds/*.m4a", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Map a file key ("gate.select", "paint.stroke.2") to its URL. */
export const SOUND_FILES: ReadonlyMap<string, string> = new Map(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1, -".m4a".length), url]),
);

/** Every file key a sound can play: ["paint.stroke.1", …] or ["gate.select"]. */
export function variantKeys(id: SoundId): string[] {
  const n = (SOUNDS[id] as SoundDef).variants;
  return n ? Array.from({ length: n }, (_, i) => `${id}.${i + 1}`) : [id];
}
