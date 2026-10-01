/**
 * What "Matthew Lam" is saying: the orange speech bubble on station pages
 * (chrome/SpeechBubble.tsx). Anything can call say(); each call is a new
 * utterance (even with the same text), so the bubble re-opens and its
 * auto-close timer restarts.
 */
import { useSyncExternalStore } from "react";

export interface Utterance {
  text: string;
  id: number;
}

let current: Utterance | null = null;
let seq = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function say(text: string): void {
  current = { text, id: ++seq };
  for (const l of listeners) l();
}

/** The latest utterance (null before the first). */
export function useSpeech(): Utterance | null {
  return useSyncExternalStore(subscribe, () => current);
}
