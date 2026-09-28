/**
 * Spray hiss (spec §9.4): a looping white-noise buffer through a highpass and
 * a bandpass. The spray engine sets its level every frame from the same
 * nozzle speed that drives the particles, so sound and paint stay locked.
 */
import { SPRAY_HISS } from "../config/sounds";
import { SPRAY } from "../config/timings";
import { getBus, getContext } from "./engine";
import { whiteNoise } from "./procedural";

export interface Hiss {
  /** 0 (silent, can lifted) … 1 (full). Smoothed, so call it every frame. */
  set(level: number): void;
  /** Fade out and release the nodes. Safe to call more than once. */
  stop(): void;
}

let noise: AudioBuffer | null = null;

/** Null before the gate unlocks audio. Starts silent. */
export function startHiss(): Hiss | null {
  const ctx = getContext();
  const bus = getBus(SPRAY_HISS.bus);
  if (!ctx || !bus) return null;

  noise ??= whiteNoise(2);
  const src = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true });
  // Random start point, so back-to-back sprays don't share an identical texture.
  const highpass = new BiquadFilterNode(ctx, { type: "highpass", frequency: SPRAY_HISS.highpassHz });
  const bandpass = new BiquadFilterNode(ctx, {
    type: "bandpass",
    frequency: SPRAY_HISS.bandpassHz,
    Q: SPRAY_HISS.bandpassQ,
  });
  const gain = new GainNode(ctx, { gain: 0 });
  src.connect(highpass).connect(bandpass).connect(gain).connect(bus);
  src.start(ctx.currentTime, Math.random() * noise.duration);

  let stopped = false;
  return {
    set(level) {
      if (stopped) return;
      gain.gain.setTargetAtTime(level * SPRAY_HISS.gain, ctx.currentTime, SPRAY.HISS_TIME_CONSTANT);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setTargetAtTime(0, t, SPRAY.HISS_TIME_CONSTANT);
      src.stop(t + SPRAY.HISS_TIME_CONSTANT * 6);
      src.onended = () => gain.disconnect();
    },
  };
}
