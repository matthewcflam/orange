/**
 * Procedural audio (spec §9.4, §9.5). Buffers are written sample by sample
 * with the AudioBuffer constructor, which needs no AudioContext, so all of this
 * is safe before the gate gesture. Live-synthesized sounds (spray hiss, tunnel
 * sweep) build their node graphs in later milestones on top of these buffers.
 */
import type { Placeholder } from "../config/sounds";

export const SAMPLE_RATE = 48000;

function makeBuffer(seconds: number): AudioBuffer {
  return new AudioBuffer({
    numberOfChannels: 1,
    length: Math.max(1, Math.round(seconds * SAMPLE_RATE)),
    sampleRate: SAMPLE_RATE,
  });
}

/** Short fade in/out so buffers never click at their edges. */
function edgeFade(data: Float32Array, fadeSeconds = 0.004) {
  const n = Math.min(Math.round(fadeSeconds * SAMPLE_RATE), data.length >> 1);
  for (let i = 0; i < n; i++) {
    const g = i / n;
    data[i] *= g;
    data[data.length - 1 - i] *= g;
  }
}

/** Looping white noise, e.g. for the spray hiss (§9.4). */
export function whiteNoise(seconds = 2): AudioBuffer {
  const buf = makeBuffer(seconds);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Seamlessly looping brown noise (tunnel rumble, drag grain). The tail is
 * crossfaded into the head so the loop point is continuous.
 */
export function brownNoise(seconds = 3): AudioBuffer {
  const buf = makeBuffer(seconds);
  const d = buf.getChannelData(0);
  const xfade = Math.round(0.05 * SAMPLE_RATE);
  const raw = new Float32Array(d.length + xfade);
  let last = 0;
  for (let i = 0; i < raw.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    raw[i] = last * 3.5;
  }
  for (let i = 0; i < d.length; i++) {
    d[i] = i < xfade ? raw[i] * (i / xfade) + raw[d.length + i] * (1 - i / xfade) : raw[i];
  }
  return buf;
}

/**
 * Stand-in for a sound whose file doesn't exist yet. Each ID has a distinct
 * pitch or color (config/sounds.ts) so timing is audible during development;
 * variants are detuned so round-robin is audible too.
 */
export function synthPlaceholder(p: Placeholder, variant = 0): AudioBuffer {
  if (p.type === "brown") return brownNoise(p.dur);

  const buf = makeBuffer(p.dur);
  const d = buf.getChannelData(0);

  if (p.type === "tone") {
    const freq = p.freq * (1 + 0.06 * variant);
    const decay = 5 / p.dur;
    for (let i = 0; i < d.length; i++) {
      const t = i / SAMPLE_RATE;
      const phase = (t * freq) % 1;
      const osc =
        p.wave === "sine" ? Math.sin(2 * Math.PI * phase)
        : p.wave === "triangle" ? 1 - 4 * Math.abs(phase - 0.5)
        : phase < 0.5 ? 0.5 : -0.5;
      d[i] = osc * Math.exp(-decay * t) * 0.8;
    }
  } else {
    // One-pole lowpass over white noise, shaped as a swell then decay.
    const cutoff = p.cutoff * (1 + 0.15 * variant);
    const a = Math.exp((-2 * Math.PI * cutoff) / SAMPLE_RATE);
    let y = 0;
    for (let i = 0; i < d.length; i++) {
      y = (1 - a) * (Math.random() * 2 - 1) + a * y;
      const x = i / d.length;
      d[i] = y * Math.sin(Math.PI * Math.sqrt(x)) * 2.5;
    }
  }

  edgeFade(d);
  return buf;
}
