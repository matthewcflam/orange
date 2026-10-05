import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { pxScale } from "../lib/frame";
import { prefersReducedMotion } from "../lib/motion";
import { onNavClick, useRoute } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { routeFor, STATIONS } from "../config/routes";
import { KEYCHAIN as K, STATION } from "../config/timings";
import { STATION_HOVER_SEMITONES, semitonesToRate } from "../config/sounds";
import paper from "../../assets-src/images/texture.png?paper";
// import doug from "../../assets-src/svg/doug-keychain.svg?charm";
// import compass from "../../assets-src/svg/compass-keychain.svg?charm";
import "./keychain.css";

/**
 * Everything below is in mockup px, measured from the top-right 467×640 of
 * design/mockups-v2/Menu Open (3).png (mockup x 1300+), which the keychain
 * box is anchored to (the viewport's top-right corner).
 */

/** The charms, whole (chains and rings too) and 1:1 at their mockup spots,
 *  at their sources' own sizes. Doug's top and the Compass Card's right run
 *  off screen, as in the mockup. */
// TODO(charms): commented out at the user's request; uncomment the imports, CHARMS, the two <Charm>s and Charm() to bring Doug and the Compass Card back.
// const CHARMS = [
//   { id: "doug", picture: doug, at: { x: 102, y: -160 }, size: { x: 304, y: 252 } },
//   { id: "compass", picture: compass, at: { x: 302, y: 120 }, size: { x: 387, y: 354 } },
// ];

/** The key card: top-left corner, size, rotated -30° about that corner
 *  (keychain.css). Its right and top run off screen. Below, card px,
 *  measured from Group 67.png (the card alone, unrotated, 509×289). */
const CARD = { w: 509, h: 289 };

/** The blue bands across the top and bottom, and the faint strip across the middle. */
const BANDS = [
  { y: 0, h: 24 },
  { y: 269, h: 20 },
];
const STRIP = { y: 138, h: 38 };

/** Per station: its bubble's centre and its label's right edge and baseline. */
const STOPS = [
  { bubble: { x: 222.5, y: 74 }, right: 194.5, baseline: 86 },
  { bubble: { x: 222.5, y: 148 }, right: 194.5, baseline: 156.3 },
  { bubble: { x: 222.5, y: 224 }, right: 194.5, baseline: 233.3 },
];

/** The route: down from the top band, through the bubbles, into the bottom band. */
const ROUTE = [{ x: 268, y: -4 }, ...STOPS.map((s) => s.bubble), { x: 222.5, y: CARD.h + 4 }];

/** The small print: left edge and baseline. */
const META = [
  { text: "2026", left: 8, baseline: 53 },
  { text: "Lam", left: 11, baseline: 251 },
];

/**
 * The keychain the Map pill opens: the website's navigation, a still picture
 * of the station key card (stations right-aligned to their bubbles on the
 * route, under a paper texture) with Doug and a Compass Card. The current
 * station's bubble is orange; a hovered or focused station's bubble grows,
 * as on the home map.
 *
 * Mounted with the station chrome (StationChrome) and kept mounted. While
 * closed it is hidden and inert.
 */
export default function Keychain({ open }: { open: boolean }) {
  const route = useRoute();
  const current = routeFor(route).station;
  const boxRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(SVGCircleElement | null)[]>([]);
  // Hover is kept per route, so a page change (under the transition cover) ends it.
  const [hover, setHover] = useState<{ route: string; index: number } | null>(null);
  const hovered = hover?.route === route ? hover.index : null;

  // Open/close: the whole box slides in diagonally from the top-right corner
  // and back out the same way. It only ever moves up and right from its
  // resting place, so what's off screen at rest stays off screen.
  const away = () => ({ x: K.SLIDE_PX * pxScale(), y: -K.SLIDE_PX * pxScale() });
  // Until the first open, the box is either pre-warming or parked away.
  const opened = useRef(false);
  useLayoutEffect(() => {
    // Pre-warm: paint the card once, in place but invisible (and inert), so
    // its first raster (shadow, rotation, noise tile) doesn't land on the
    // first frames of the first open. Then park it away and hidden.
    const box = boxRef.current!;
    gsap.set(box, { x: 0, y: 0, opacity: 0.001, visibility: "visible" });
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (!opened.current) gsap.set(box, { ...away(), autoAlpha: 0 });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  useLayoutEffect(() => {
    const box = boxRef.current!;
    const reduced = prefersReducedMotion();
    if (open) {
      if (!opened.current) gsap.set(box, away());
      opened.current = true;
      gsap.set(box, { autoAlpha: 1 });
      gsap.to(box, { x: 0, y: 0, duration: reduced ? 0 : K.OPEN, ease: K.OPEN_EASE, overwrite: true });
    } else if (opened.current) {
      gsap.to(box, {
        ...away(),
        duration: reduced ? 0 : K.CLOSE,
        ease: K.CLOSE_EASE,
        overwrite: true,
        onComplete: () => void gsap.set(box, { autoAlpha: 0 }),
      });
    }
  }, [open]);

  // Hover: the bubble grows, like a station dot on the home map.
  useEffect(() => {
    const grow = (i: number, on: boolean) =>
      gsap.to(bubbleRefs.current[i], {
        scale: on ? STATION.HOVER_SCALE : 1,
        duration: STATION.HOVER_DURATION,
        ease: STATION.HOVER_EASE,
        transformOrigin: "50% 50%",
        overwrite: "auto",
      });
    if (hovered === null) return;
    grow(hovered, true);
    return () => void grow(hovered, false);
  }, [hovered]);

  return (
    <div ref={boxRef} id="keychain" className="keychain" inert={!open}>
      {/* <Charm charm={CHARMS[0]} /> */}
      <div className="keychain__card">
        <svg className="keychain__route" viewBox={`0 0 ${CARD.w} ${CARD.h}`} aria-hidden="true">
          {BANDS.map((b) => (
            <rect key={b.y} className="keychain__band" x={0} y={b.y} width={CARD.w} height={b.h} />
          ))}
          <rect className="keychain__strip" x={0} y={STRIP.y} width={CARD.w} height={STRIP.h} />
          <polyline points={ROUTE.map((p) => `${p.x},${p.y}`).join(" ")} />
          {STOPS.map((s, i) => (
            <circle
              key={STATIONS[i].id}
              ref={(el) => {
                bubbleRefs.current[i] = el;
              }}
              className="keychain__bubble"
              data-here={STATIONS[i].id === current || undefined}
              cx={s.bubble.x}
              cy={s.bubble.y}
              r={12}
            />
          ))}
        </svg>
        <nav aria-label="Stations">
          {STATIONS.map((s, i) => {
            const isCurrent = s.id === current;
            const enter = () => {
              if (isCurrent) return;
              setHover({ route, index: i });
              play("station.hover", { rate: semitonesToRate(STATION_HOVER_SEMITONES[i]), vary: false });
              prefetchRoute(s.path);
            };
            const leave = () => setHover((h) => (h?.index === i ? null : h));
            return (
              <a
                key={s.id}
                href={s.path}
                className="keychain__station"
                style={{ left: `calc(${STOPS[i].right} * var(--px))`, top: `calc(${STOPS[i].baseline} * var(--px))` }}
                aria-current={isCurrent ? "page" : undefined}
                onClick={(e) => (isCurrent ? e.preventDefault() : onNavClick(e, s.path))}
                onPointerEnter={(e) => e.pointerType !== "touch" && enter()}
                onPointerLeave={leave}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && enter()}
                onBlur={leave}
              >
                {s.label}
                {/* The bubble belongs to the link too, so hovering or clicking it
                    selects the station, as on the home map. */}
                <span
                  className="keychain__hit"
                  style={{
                    left: `calc(100% + ${STOPS[i].bubble.x - STOPS[i].right} * var(--px))`,
                    top: `calc(0.864em + ${STOPS[i].bubble.y - STOPS[i].baseline} * var(--px))`,
                  }}
                />
              </a>
            );
          })}
        </nav>
        {META.map((m) => (
          <span
            key={m.text}
            className="keychain__meta"
            aria-hidden="true"
            style={{ left: `calc(${m.left} * var(--px))`, top: `calc(${m.baseline} * var(--px))` }}
          >
            {m.text}
          </span>
        ))}
        {/* The paper texture lies over everything (it's 30% alpha), as in the mockup. */}
        <div className="keychain__paper" style={{ backgroundImage: `url(${paper})` }} />
      </div>
      {/* <Charm charm={CHARMS[1]} /> */}
    </div>
  );
}

// function Charm({ charm: c }: { charm: (typeof CHARMS)[number] }) {
//   return (
//     <picture
//       className="keychain__charm"
//       style={{
//         left: `calc(${c.at.x} * var(--px))`,
//         top: `calc(${c.at.y} * var(--px))`,
//         width: `calc(${c.size.x} * var(--px))`,
//         height: `calc(${c.size.y} * var(--px))`,
//       }}
//     >
//       {Object.entries(c.picture.sources).map(([format, srcset]) => (
//         <source key={format} type={`image/${format}`} srcSet={srcset} sizes={`${Math.ceil((c.size.x / 1767) * 100)}vw`} />
//       ))}
//       <img src={c.picture.img.src} alt="" draggable={false} />
//     </picture>
//   );
// }
