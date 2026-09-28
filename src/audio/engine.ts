/**
 * The sound engine (spec §9). Module-level singletons only, never created in
 * effects, so React StrictMode can't double them (§4.2).
 *
 *   sources ─┬─> ui bus ─────────┐
 *            ├─> transition bus ─┼─> master gain ─> limiter ─> destination
 *            └─> ambient bus ────┘
 *
 * Lifecycle:
 * 1. preloadSounds() at app start, while the gate shows: fetch + decode every
 *    discovered file on an OfflineAudioContext (exempt from autoplay policy).
 * 2. unlock() inside the gate gesture, synchronously: creates the one real
 *    AudioContext and resumes it. Creating it earlier makes Chrome warn.
 * 3. play() anywhere after that.
 */
import { MASTER_GAIN, SOUNDS, SOUND_FILES, variantKeys, type Bus, type SoundDef, type SoundId } from "../config/sounds";
import { AUDIO } from "../config/timings";
import { SAMPLE_RATE, synthPlaceholder } from "./procedural";

// ---------------------------------------------------------------------------
// Buffers
// ---------------------------------------------------------------------------

type Source = "file" | "placeholder";
interface Loaded {
  buffer: AudioBuffer | null; // null while a file is still decoding
  source: Source;
}

/** Keyed by file key: "gate.select", "paint.stroke.3". */
const buffers = new Map<string, Loaded>();
let preloadStarted = false;

function placeholderFor(id: SoundId, key: string): AudioBuffer {
  const variant = key === id ? 0 : Number(key.slice(id.length + 1)) - 1;
  return synthPlaceholder((SOUNDS[id] as SoundDef).placeholder, variant);
}

/**
 * Decode every discovered sound file and synthesize placeholders for the
 * rest. Idempotent. Resolves when every file has decoded or fallen back.
 */
export function preloadSounds(): Promise<void> {
  if (preloadStarted) return Promise.resolve();
  preloadStarted = true;

  // Module-level decoder: an offline context never triggers autoplay rules,
  // and AudioBuffers are not tied to the context that decoded them.
  const decoder = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  const missing: string[] = [];
  const jobs: Promise<void>[] = [];

  for (const id of Object.keys(SOUNDS) as SoundId[]) {
    for (const key of variantKeys(id)) {
      const url = SOUND_FILES.get(key);
      if (!url) {
        missing.push(key);
        buffers.set(key, { buffer: placeholderFor(id, key), source: "placeholder" });
        continue;
      }
      buffers.set(key, { buffer: null, source: "file" });
      jobs.push(
        fetch(url)
          .then((r) => r.arrayBuffer())
          .then((data) => decoder.decodeAudioData(data))
          .then((buffer) => void buffers.set(key, { buffer, source: "file" }))
          .catch((err) => {
            if (import.meta.env.DEV) console.warn(`[audio] "${key}" failed to decode; using placeholder.`, err);
            buffers.set(key, { buffer: placeholderFor(id, key), source: "placeholder" });
          }),
      );
    }
  }

  if (import.meta.env.DEV && missing.length) {
    console.info(`[audio] ${missing.length} sounds use synthesized placeholders (no file in assets-src/sounds/):`, missing.join(", "));
  }
  return Promise.all(jobs).then(() => undefined);
}

/** Dev inspection: where each file key's audio comes from. */
export function soundReport(): Record<string, Source | "decoding"> {
  const out: Record<string, Source | "decoding"> = {};
  for (const [key, l] of buffers) out[key] = l.buffer ? l.source : "decoding";
  return out;
}

// ---------------------------------------------------------------------------
// Context + graph
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let buses: Record<Bus, GainNode> | null = null;
let muted = false;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/** Subscribe to mute / unlock changes (for useSyncExternalStore). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const isMuted = () => muted;
export const isUnlocked = () => ctx !== null;
/** For procedural graphs in later milestones. Null before unlock. */
export const getContext = () => ctx;
export const getBus = (bus: Bus) => buses?.[bus] ?? null;

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

/**
 * Create and resume the AudioContext. MUST be called synchronously inside a
 * user gesture handler, before any await (Safari only honours the unlock in
 * the gesture's call stack). Called even when muted, so unmuting later has a
 * running context (§6.4).
 */
export function unlock({ muted: startMuted }: { muted: boolean }): void {
  muted = startMuted;

  if (ctx) {
    void ctx.resume();
    applyMute();
    notify();
    return;
  }

  // Safari: mix with the user's music; the silent switch mutes us. Never
  // "playback", which would pause their music (§9.7).
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (session) {
    try {
      session.type = "ambient";
    } catch {
      /* unsupported value */
    }
  }

  ctx = new AudioContext({ latencyHint: "interactive" });
  void ctx.resume();

  const limiter = new DynamicsCompressorNode(ctx, AUDIO.LIMITER);
  limiter.knee.value = 0;
  limiter.connect(ctx.destination);

  master = new GainNode(ctx, { gain: muted ? 0 : MASTER_GAIN });
  master.connect(limiter);

  buses = {
    ui: new GainNode(ctx),
    transition: new GainNode(ctx),
    ambient: new GainNode(ctx),
  };
  for (const bus of Object.values(buses)) bus.connect(master);

  installLifecycle(ctx);
  notify();
}

function applyMute() {
  if (!ctx || !master) return;
  // setTargetAtTime reaches ~95% in 3 time constants: a 50ms ramp, no click.
  master.gain.setTargetAtTime(muted ? 0 : MASTER_GAIN, ctx.currentTime, AUDIO.MUTE_RAMP / 3);
}

/** Mute or unmute with a short ramp. The caller persists the preference. */
export function setMuted(next: boolean): void {
  if (next === muted) return;
  muted = next;
  applyMute();
  notify();
}

function installLifecycle(context: AudioContext) {
  const tryResume = () => {
    if (context.state !== "running" && document.visibilityState === "visible") void context.resume();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void context.suspend();
    else tryResume();
  });

  // iOS can leave the context "interrupted" (calls, app switches) and refuse
  // a resume without a gesture, so resume on the next one (§9.3).
  window.addEventListener("pointerdown", tryResume, { capture: true });
  window.addEventListener("keydown", tryResume, { capture: true });
}

if (import.meta.hot) {
  // Dev only: a hot-reloaded engine module must not leave a second context running.
  import.meta.hot.dispose(() => void ctx?.close());
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

export interface PlayOptions {
  /** AudioContext time to start at. Schedule rhythmic sounds up front (§9.3). */
  when?: number;
  /** Multiplies the manifest gain. */
  gain?: number;
  /** Multiplies playbackRate (e.g. station.hover pitch by index). */
  rate?: number;
  /** -1 (left) … 1 (right). */
  pan?: number;
  loop?: boolean;
  /** Random ±rate/gain variation. Default: on, except for loops. */
  vary?: boolean;
}

export interface Voice {
  /** Fade out and stop. Safe to call more than once. */
  stop(fade?: number): void;
  /** Smoothly set gain (relative to the play's base gain), e.g. per frame. */
  setGain(value: number, timeConstant?: number): void;
}

interface ActiveVoice extends Voice {
  stopped: boolean;
}

const voices = new Map<SoundId, ActiveVoice[]>();
const roundRobin = new Map<SoundId, number>();

const spread = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

/** Next decoded variant in round-robin order, skipping any still decoding. */
function nextBuffer(id: SoundId): AudioBuffer | null {
  const keys = variantKeys(id);
  const start = roundRobin.get(id) ?? 0;
  for (let k = 0; k < keys.length; k++) {
    const i = (start + k) % keys.length;
    const buffer = buffers.get(keys[i])?.buffer;
    if (buffer) {
      roundRobin.set(id, i + 1);
      return buffer;
    }
  }
  return null;
}

/**
 * Play a sound. Returns a Voice handle (for loops and live gain), or null if
 * the engine isn't unlocked or the buffer isn't ready. Muted plays still run
 * (master gain is 0), so unmuting mid-loop just works.
 */
export function play(id: SoundId, opts: PlayOptions = {}): Voice | null {
  if (!ctx || !buses) return null;
  const buffer = nextBuffer(id);
  if (!buffer) return null;

  const context = ctx;
  const def = SOUNDS[id] as SoundDef;
  const vary = opts.vary ?? !opts.loop;
  const baseGain = (def.gain ?? 1) * (opts.gain ?? 1) * (vary ? spread(AUDIO.GAIN_VARIATION) : 1);

  const src = new AudioBufferSourceNode(context, {
    buffer,
    loop: opts.loop ?? false,
    playbackRate: (opts.rate ?? 1) * (vary ? spread(AUDIO.RATE_VARIATION) : 1),
  });
  const gain = new GainNode(context, { gain: baseGain });
  src.connect(gain);
  let tail: AudioNode = gain;
  if (opts.pan) {
    tail = new StereoPannerNode(context, { pan: opts.pan });
    gain.connect(tail);
  }
  tail.connect(buses[def.bus]);

  // Voice limit: fade out the oldest before adding a new one.
  const list = voices.get(id) ?? [];
  voices.set(id, list);
  const limit = def.voices ?? AUDIO.DEFAULT_VOICE_LIMIT;
  while (list.length >= limit) list[0].stop(AUDIO.VOICE_STEAL_FADE);

  const voice: ActiveVoice = {
    stopped: false,
    stop(fade = AUDIO.VOICE_STEAL_FADE) {
      if (voice.stopped) return;
      voice.stopped = true;
      const i = list.indexOf(voice);
      if (i >= 0) list.splice(i, 1);
      const t = context.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + fade);
      src.stop(t + fade + 0.005);
    },
    setGain(value, timeConstant = 0.015) {
      if (voice.stopped) return;
      gain.gain.setTargetAtTime(baseGain * value, context.currentTime, timeConstant);
    },
  };
  list.push(voice);

  src.onended = () => {
    voice.stopped = true;
    const i = list.indexOf(voice);
    if (i >= 0) list.splice(i, 1);
    tail.disconnect();
    if (tail !== gain) gain.disconnect();
  };

  src.start(Math.max(opts.when ?? 0, context.currentTime));
  return voice;
}
