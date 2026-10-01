import { useLayoutEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { GATE_UI } from "../config/timings";
import { play, unlock } from "../audio/engine";
import { loadSoundPref, saveSoundPref, type SoundPref } from "../lib/prefs";
import "./gate.css";

export type GatePhase = "showing" | "leaving" | "done";

const OPTIONS: { pref: SoundPref; label: string; aria: string }[] = [
  { pref: "sound", label: "Sound", aria: "Enter with sound" },
  { pref: "muted", label: "Muted", aria: "Enter muted" },
];

interface Props {
  onSelect: (choice: SoundPref) => void;
}

/**
 * The audio gate's options (spec §6). Rendered inside shared chrome while
 * gatePhase !== "done" (§4.1). Real <button>s; hover or ↑/↓ moves the `>`
 * cursor, click / Enter / Space selects. On select they vanish at once
 * (gate/gateToHome.ts).
 */
export default function Gate({ onSelect }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const centers = useRef<number[]>([]);
  const selected = useRef(false);
  const [active, setActive] = useState(() => (loadSoundPref() === "muted" ? 1 : 0));
  const activeRef = useRef(active);
  useLayoutEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Measure option centers on mount and whenever an option changes size (resize,
  // font-size edits); never in pointer handlers (§12).
  useLayoutEffect(() => {
    const measure = () => {
      centers.current = buttonRefs.current.map((b) => (b ? b.offsetTop + b.offsetHeight / 2 : 0));
      gsap.set(cursorRef.current, { yPercent: -50, y: centers.current[activeRef.current] });
    };
    measure();
    buttonRefs.current[activeRef.current]?.focus({ preventScroll: true });
    const ro = new ResizeObserver(measure);
    buttonRefs.current.forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      if (centers.current.length === 0) return;
      gsap.to(cursorRef.current, {
        y: centers.current[active],
        duration: GATE_UI.CURSOR_SLIDE,
        ease: GATE_UI.CURSOR_EASE,
        overwrite: true,
      });
    },
    { dependencies: [active], scope: rootRef },
  );

  const moveTo = (index: number) => {
    if (selected.current) return;
    setActive(index);
    buttonRefs.current[index]?.focus({ preventScroll: true });
  };

  const select = (choice: SoundPref) => {
    if (selected.current) return;
    selected.current = true;
    // MUST come first, synchronously, before any await (§6.4).
    unlock({ muted: choice === "muted" });
    saveSoundPref(choice);
    play("gate.select");
    onSelect(choice);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      moveTo((active + (e.key === "ArrowDown" ? 1 : OPTIONS.length - 1)) % OPTIONS.length);
    }
  };

  return (
    <div ref={rootRef} className="gate interactive" role="group" aria-label="Choose how to enter" onKeyDown={onKeyDown}>
      <span ref={cursorRef} className="gate__cursor" aria-hidden="true">
        &gt;
      </span>
      {OPTIONS.map((o, i) => (
        <button
          key={o.pref}
          ref={(el) => {
            buttonRefs.current[i] = el;
          }}
          type="button"
          className={`gate__option gate__option--${o.pref}`}
          aria-label={o.aria}
          tabIndex={i === active ? 0 : -1}
          onPointerEnter={() => moveTo(i)}
          onFocus={() => setActive(i)}
          onClick={() => select(o.pref)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
