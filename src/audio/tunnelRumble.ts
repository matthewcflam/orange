/**
 * Tunnel rumble (spec §9.4): palimpsest.rumble (a file if one exists, else the
 * brown-noise placeholder) looping through a lowpass. Muffled at ~300 Hz while
 * the screen is black; the cutoff sweeps open as the tunnel slides away, the
 * audio version of driving out into daylight.
 */
import { AUDIO } from "../config/timings";
import { getBus, getContext, play } from "./engine";

export interface Rumble {
  /** Sweep the cutoff open over `duration` seconds, starting now. */
  open(duration: number): void;
  /** Fade out over `fade` seconds and release the nodes. Safe to call more than once. */
  stop(fade?: number): void;
}

/** Null before the gate unlocks audio. */
export function startRumble(): Rumble | null {
  const ctx = getContext();
  const bus = getBus("transition");
  if (!ctx || !bus) return null;

  const lowpass = new BiquadFilterNode(ctx, { type: "lowpass", frequency: AUDIO.TUNNEL_CUTOFF_START_HZ, Q: 0.7 });
  lowpass.connect(bus);
  const voice = play("palimpsest.rumble", { loop: true, destination: lowpass });
  if (!voice) {
    lowpass.disconnect();
    return null;
  }

  let stopped = false;
  return {
    open(duration) {
      if (stopped) return;
      const t = ctx.currentTime;
      lowpass.frequency.cancelScheduledValues(t);
      lowpass.frequency.setValueAtTime(lowpass.frequency.value, t);
      lowpass.frequency.exponentialRampToValueAtTime(AUDIO.TUNNEL_CUTOFF_END_HZ, t + duration);
    },
    stop(fade = AUDIO.VOICE_STEAL_FADE) {
      if (stopped) return;
      stopped = true;
      voice.stop(fade);
      setTimeout(() => lowpass.disconnect(), (fade + 0.1) * 1000);
    },
  };
}
