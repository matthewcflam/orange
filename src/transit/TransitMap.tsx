import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { STATIONS, routeFor } from "../config/routes";
import { STATION, TEMP_NAV } from "../config/timings";
import { STATION_HOVER_SEMITONES, semitonesToRate } from "../config/sounds";
import { play } from "../audio/engine";
import { onNavClick, useRoute } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { setScreenDoorClip } from "../fx/screenDoorEngine";
import { CARD, LABEL_BASE_SIZE, type Layout, type LayoutName, layoutFor, lerpLayout, stationY } from "./stations";
import "./transit.css";

/** Fragment Mono cap height / font size, so labels can be placed by their
 *  cap top as measured in the mockups. Fonts are loaded before first render. */
let capRatio: number | null = null;
function getCapRatio(): number {
  if (capRatio === null) {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = `${LABEL_BASE_SIZE}px "Fragment Mono"`;
    capRatio = ctx.measureText("H").actualBoundingBoxAscent / LABEL_BASE_SIZE;
  }
  return capRatio;
}

/**
 * The single transit map (spec §4.1, §7.1, §8.4). Rendered once and never
 * unmounted; "full" on home, "mini" (grey card, top-left) everywhere else.
 * Geometry is driven imperatively from stations.ts so a morph never re-renders.
 * Hidden (CSS) until the gate → home timeline reveals it (gate/gateToHome.ts).
 */
export default function TransitMap({ visible }: { visible: boolean }) {
  const route = useRoute();
  const currentStation = routeFor(route).station;
  const layoutName: LayoutName = route === "/" ? "full" : "mini";

  const lineRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const cardRef = useRef<SVGGElement>(null);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const hitRefs = useRef<(SVGCircleElement | null)[]>([]);
  const focusRefs = useRef<(SVGCircleElement | null)[]>([]);
  const labelRefs = useRef<(SVGTextElement | null)[]>([]);
  const shown = useRef<Layout | null>(null);
  const morph = useRef<gsap.core.Tween | null>(null);

  const apply = (l: Layout) => {
    shown.current = l;
    const line = lineRef.current!;
    line.setAttribute("d", `M${l.startX} ${l.upperY}H${l.x[1]}L${l.x[2]} ${l.lowerY}H${l.endX}`);
    line.setAttribute("stroke-width", String(l.lineWidth));
    clipRef.current!.setAttribute("width", String(l.clipW));
    clipRef.current!.setAttribute("height", String(l.clipH));
    setScreenDoorClip(l.clipW, l.clipH); // the dither covers the same box
    cardRef.current!.setAttribute("opacity", String(l.cardOpacity));
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

  // Layout: set on mount, morph on route change, re-fit the full layout on resize.
  useLayoutEffect(() => {
    const target = layoutFor(layoutName);
    morph.current?.kill();
    if (!shown.current) {
      apply(target);
    } else {
      const from = shown.current;
      const p = { t: 0 };
      morph.current = gsap.to(p, {
        t: 1,
        duration: TEMP_NAV.MAP_MORPH,
        ease: TEMP_NAV.MAP_MORPH_EASE,
        onUpdate: () => apply(lerpLayout(from, target, p.t)),
      });
    }
    const onResize = () => {
      if (morph.current?.isActive()) return;
      apply(layoutFor(layoutName));
    };
    window.addEventListener("resize", onResize);
    return () => {
      morph.current?.kill();
      window.removeEventListener("resize", onResize);
    };
  }, [layoutName]);

  const hover = (i: number, on: boolean) => {
    gsap.to(dotRefs.current[i], {
      scale: on ? STATION.HOVER_SCALE : 1,
      duration: STATION.HOVER_DURATION,
      ease: STATION.HOVER_EASE,
      transformOrigin: "50% 50%",
      overwrite: "auto",
    });
    if (!on) return;
    play("station.hover", { rate: semitonesToRate(STATION_HOVER_SEMITONES[i]) });
    prefetchRoute(STATIONS[i].path);
  };

  return (
    <nav aria-label="Stations">
      <svg className="transit-map" viewBox="0 0 1440 1024" aria-hidden={!visible}>
        <defs>
          <clipPath id="transit-clip">
            <rect ref={clipRef} x="0" y="0" />
          </clipPath>
        </defs>

        <g ref={cardRef} className={layoutName === "mini" ? "interactive" : undefined}>
          <rect className="transit-map__card-border" width={CARD.w + CARD.borderRight} height={CARD.h + CARD.borderBottom} />
          <rect className="transit-map__card" width={CARD.w} height={CARD.h} />
        </g>

        <g clipPath="url(#transit-clip)">
          <path ref={lineRef} className="transit-map__line" />
          {STATIONS.map((s, i) => {
            const isCurrent = s.id === currentStation;
            return (
              <a
                key={s.id}
                href={s.path}
                className={`station interactive${isCurrent ? " station--current" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={s.label}
                onClick={(e) => {
                  if (isCurrent) e.preventDefault(); // clicking the current station does nothing (§7.3)
                  else onNavClick(e, s.path);
                }}
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
