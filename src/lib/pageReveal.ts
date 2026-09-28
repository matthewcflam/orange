/**
 * Whether the page layer is on screen. A page mounts while hidden (behind the
 * gate, or at commit while the transition has it faded out), so an entrance
 * animation waits for whenPageShown() instead of guessing a delay. The gate
 * and the transition runner mark the moments the page starts to appear.
 */
let shown = false;
let waiters: (() => void)[] = [];

export function markPageHidden(): void {
  shown = false;
}

export function markPageShown(): void {
  shown = true;
  const w = waiters;
  waiters = [];
  for (const fn of w) fn();
}

/** Resolves when the page starts to appear; immediately if it's already shown. */
export function whenPageShown(): Promise<void> {
  return shown ? Promise.resolve() : new Promise((resolve) => waiters.push(resolve));
}
