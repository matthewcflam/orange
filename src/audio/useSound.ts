import { useSyncExternalStore } from "react";
import { isMuted, isUnlocked, subscribe } from "./engine";

/** Re-renders when the mute state changes. */
export function useMuted(): boolean {
  return useSyncExternalStore(subscribe, isMuted);
}

/** Re-renders once the AudioContext exists. */
export function useAudioUnlocked(): boolean {
  return useSyncExternalStore(subscribe, isUnlocked);
}
