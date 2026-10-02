import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { STATIONS } from "../config/routes";
import { STATION } from "../config/timings";
import { STATION_HOVER_SEMITONES, semitonesToRate } from "../config/sounds";
import { play } from "../audio/engine";
import { onNavClick } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { LABEL_BASE_SIZE, type Layout, layoutFor, stationY } from "./stations";
import "./transit.css";

/** Inter cap height / font size, so labels can be placed by their cap top as
 *  measured in the mockup. Fonts are loaded before first render. */
let capRatio: number | null = null;
function getCapRatio(): number {
  if (capRatio === null) {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `700 ${LABEL_BASE_SIZE}px "Inter Variable"`;
    capRatio = ctx.measureText("H").actualBoundingBoxAscent / LABEL_BASE_SIZE;
  }
  return capRatio;
}

/**
 * The transit map on home (spec §7.1). Rendered once and never unmounted; its
 * layer is hidden off home (App.tsx). Geometry is set imperatively from
 * stations.ts. Hidden (CSS) until the gate → home timeline reveals it
 * (gate/gateToHome.ts).
 */
export default function TransitMap({ visible }: { visible: boolean }) {
  const lineRef = useRef<SVGPathElement>(null);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const hitRefs = useRef<(SVGCircleElement | null)[]>([]);
  const focusRefs = useRef<(SVGCircleElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);

  const apply = (l: Layout) => {
    const line = lineRef.current!;
    line.setAttribute("d", `M${l.startX} ${l.upperY}H${l.bendX}L${l.x[1]} ${l.lowerY}H${l.endX}`);
    line.setAttribute("stroke-width", String(l.lineWidth));
    const cap = getCapRatio();
    const scale = l.labelSize / LABEL_BASE_SIZE;
    STATIONS.forEach((_, i) => {
      groupRefs.current[i]!.setAttribute("transform", `translate(${l.x[i]} ${stationY(l, i)})`);
      dotRefs.current[i]!.setAttribute("r", String(l.dotR));
      dotRefs.current[i]!.setAttribute("stroke-width", String(l.dotRing));
      hitRefs.current[i]!.setAttribute("r", String(l.hitR));
      focusRefs.current[i]!.setAttribute("r", String(l.dotR * STATION.HOVER_SCALE + 4));
      const baseline = l.labelTop[i] + cap * l.labelSize;
      labelRefs.current[i]!.setAttribute("transform", `translate(0 ${baseline}) scale(${scale})`);
    });
  };

  // Set on mount; re-fit to the viewport on resize.
  useLayoutEffect(() => {
    const fit = () => apply(layoutFor());
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const hover = (i: number, on: boolean) => {
    gsap.to(dotRefs.current[i], {
      scale: on ? STATION.HOVER_SCALE : 1,
      duration: STATION.HOVER_DURATION,
      ease: STATION.HOVER_EASE,
      transformOrigin: "50% 50%",
      overwrite: "auto",
    });
    if (!on) return;
    play("station.hover", { rate: semitonesToRate(STATION_HOVER_SEMITONES[i]), vary: false });
    prefetchRoute(STATIONS[i].path);
  };

  return (
    <nav aria-label="Stations">
      <svg className="transit-map" viewBox="0 0 1767 1024" aria-hidden={!visible}>
        <g>
          <path ref={lineRef} className="transit-map__line" />
          {STATIONS.map((s, i) => {
            return (
              <a
                key={s.id}
                href={s.path}
                className="station interactive"
                aria-label={s.label}
                onClick={(e) => onNavClick(e, s.path)}
                onPointerEnter={(e) => e.pointerType !== "touch" && hover(i, true)}
                onPointerLeave={(e) => e.pointerType !== "touch" && hover(i, false)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && hover(i, true)}
                onBlur={() => hover(i, false)}
              >
                <g
                  ref={(el) => {
                    groupRefs.current[i] = el;
                  }}
                >
                  <circle
                    ref={(el) => {
                      hitRefs.current[i] = el;
                    }}
                    className="station__hit"
                  />
                  <circle
                    ref={(el) => {
                      focusRefs.current[i] = el;
                    }}
                    className="station__focus"
                  />
                  <circle
                    ref={(el) => {
                      dotRefs.current[i] = el;
                    }}
                    className="station__dot"
                  />
                  <text
                    ref={(el) => {
                      labelRefs.current[i] = el;
                    }}
                    className="station__label"
                  >
                    {s.label}
                  </text>
                </g>
              </a>
            );
          })}
        </g>
      </svg>
    </nav>
  );
}
