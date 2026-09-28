/** Persisted sound preference (spec §6.3, §9.8). Storage can throw (private mode, blocked). */
export type SoundPref = "sound" | "muted";

const KEY = "pref.sound";

export function loadSoundPref(): SoundPref {
  try {
    return localStorage.getItem(KEY) === "muted" ? "muted" : "sound";
  } catch {
    return "sound";
  }
}

export function saveSoundPref(pref: SoundPref): void {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* preference just won't persist */
  }
}
