import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { readToken } from "../lib/tokens";
import { prefersReducedMotion } from "../lib/motion";
import { MAP_BUTTON } from "../config/timings";
import scribbleSvg from "../../assets-src/svg/portfolio-scribble.svg?raw";

/**
 * The Map pill, top-right on station pages (design/mockups-v2). Hover draws
 * portfolio-scribble.svg under "Map". Click opens the keychain: the pill turns
 * black and reads "Close". Escape closes it too.
 */
export default function MapButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const scribbleRef = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  const path = () => scribbleRef.current!.querySelector("path");

  const draw = (on: boolean) => {
    const reduced = prefersReducedMotion();
    gsap.to(path(), {
      drawSVG: on ? "100%" : "0%",
      duration: reduced ? 0 : on ? MAP_BUTTON.SCRIBBLE_DRAW : MAP_BUTTON.SCRIBBLE_UNDRAW,
      ease: MAP_BUTTON.SCRIBBLE_EASE,
      overwrite: true,
    });
  };

  useLayoutEffect(() => {
    gsap.set(path(), { drawSVG: "0%" });
  }, []);

  // Pill colours follow `open` (instant on mount).
  useLayoutEffect(() => {
    gsap.to(ref.current, {
      backgroundColor: readToken(open ? "--color-map-open" : "--color-map-pill"),
      color: readToken(open ? "--color-map-open-text" : "--color-map-pill-text"),
      duration: first.current ? 0 : MAP_BUTTON.COLOR,
      overwrite: "auto",
    });
    first.current = false;
    if (open) draw(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onToggle();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onToggle]);

  const hover = (on: boolean) => {
    if (open) return;
    draw(on);
    if (!on) return;
    play("link.hover");
  };

  return (
    <button
      ref={ref}
      type="button"
      className="map-button interactive"
      aria-expanded={open}
      aria-controls="keychain"
      onPointerEnter={(e) => e.pointerType !== "touch" && hover(true)}
      onPointerLeave={(e) => e.pointerType !== "touch" && hover(false)}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && hover(true)}
      onBlur={() => hover(false)}
      onClick={() => {
        play(open ? "station.hover" : "project.select");
        onToggle();
      }}
    >
      {open ? "Close" : "Map"}
      <span ref={scribbleRef} className="map-button__scribble" aria-hidden="true" dangerouslySetInnerHTML={{ __html: scribbleSvg }} />
    </button>
  );
}
