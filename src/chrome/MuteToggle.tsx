import { useEffect } from "react";
import { play, setMuted, getContext } from "../audio/engine";
import { useMuted } from "../audio/useSound";
import { saveSoundPref } from "../lib/prefs";
import { AUDIO } from "../config/timings";

function toggle(muted: boolean) {
  const next = !muted;
  setMuted(next);
  saveSoundPref(next ? "muted" : "sound");
  // Plays on unmute only, once the master ramp is up (§9.6).
  const ctx = getContext();
  if (!next && ctx) play("mute.toggle", { when: ctx.currentTime + AUDIO.MUTE_RAMP });
}

/**
 * Persistent sound on/off control, shared chrome (spec §9.8). Placeholder
 * position and look: TODO(open-question #6). Shortcut: M.
 */
export default function MuteToggle({ enabled }: { enabled: boolean }) {
  const muted = useMuted();

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "m" && e.key !== "M") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      toggle(muted);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, muted]);

  return (
    <button
      type="button"
      className="mute-toggle interactive"
      aria-label="Sound"
      aria-pressed={!muted}
      aria-keyshortcuts="M"
      title="Sound (M). The iPhone silent switch mutes sound."
      onClick={() => toggle(muted)}
    >
      sound {muted ? "off" : "on"}
    </button>
  );
}
