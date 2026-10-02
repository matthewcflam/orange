import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import { onNavClick } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { whenPageShown } from "../lib/pageReveal";
import { prefersReducedMotion } from "../lib/motion";
import { play } from "../audio/engine";
import { PROJECT } from "../config/timings";
import { PROJECTS, type ProjectSlug } from "../content/projects";
import StationLayout from "./StationLayout";
import TrainLine from "./TrainLine";
import portfolioScribble from "../../assets-src/svg/new-portfolio.svg?raw";
import oysterScribble from "../../assets-src/svg/new-oyster.svg?raw";
import mangoScribble from "../../assets-src/svg/new-mango.svg?raw";
import "./project.css";

/** The project list (design/mockups-v2 Portfolio/Oyster News/Mango): each
 *  item's name cap top in mockup px, and the hand-drawn mark around it when
 *  active (x/y: the SVG's top-left, drawn 1:1). */
const ITEMS: Record<ProjectSlug, { y: number; scribble: { svg: string; x: number; y: number; w: number } }> = {
  portfolio: { y: 249, scribble: { svg: portfolioScribble, x: 93, y: 196, w: 212 } },
  "oyster-news": { y: 562, scribble: { svg: oysterScribble, x: 93, y: 531, w: 224 } },
  mango: { y: 874, scribble: { svg: mangoScribble, x: 139, y: 844, w: 180 } },
};

/**
 * Shell of the Projects station: the title, the project list left of the
 * line, and the active project's media right of it. The shell stays mounted
 * while projects switch; everything per project sits in `.project__swap`,
 * which the transition crossfades (transition/pageTransition.ts). The line
 * drops in once, when the page opens.
 */
export default function ProjectLayout({ active, children }: { active: ProjectSlug; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shown = useRef<ProjectSlug | null>(null);

  // Scribble: the previous one fades, the active one draws in once the page
  // is on screen (immediately on a project switch).
  useLayoutEffect(() => {
    const q = gsap.utils.selector(rootRef);
    const current = q(`.project-list__scribble[data-slug="${active}"]`)[0];
    const path = current.querySelector("path");
    const prev = shown.current && shown.current !== active ? q(`.project-list__scribble[data-slug="${shown.current}"]`)[0] : null;
    shown.current = active;

    const tweens: gsap.core.Tween[] = [];
    gsap.set(
      q(".project-list__scribble").filter((el) => el !== current && el !== prev),
      { autoAlpha: 0 },
    );
    if (prev) tweens.push(gsap.to(prev, { autoAlpha: 0, duration: PROJECT.SCRIBBLE_OUT }));
    gsap.set(current, { autoAlpha: 1 });
    if (prefersReducedMotion()) {
      gsap.set(path, { drawSVG: "100%" });
      return () => tweens.forEach((t) => t.kill());
    }
    gsap.set(path, { drawSVG: "0%" });
    let alive = true;
    whenPageShown().then(() => {
      if (alive) tweens.push(gsap.to(path, { drawSVG: "100%", duration: PROJECT.SCRIBBLE_DRAW, ease: PROJECT.SCRIBBLE_EASE }));
    });
    return () => {
      alive = false;
      tweens.forEach((t) => t.kill());
    };
  }, [active]);

  return (
    <StationLayout className="project">
      <div ref={rootRef} className="project__rail">
        <nav className="project-list" aria-label="Projects">
          <ul>
            {PROJECTS.map((p) => {
              const isActive = p.slug === active;
              return (
                <li key={p.slug} style={{ "--y": ITEMS[p.slug].y } as CSSProperties}>
                  <a
                    href={p.path}
                    className="project-list__link"
                    aria-current={isActive ? "page" : undefined}
                    onClick={(e) => (isActive ? e.preventDefault() : onNavClick(e, p.path))}
                    onPointerEnter={(e) => {
                      prefetchRoute(p.path);
                      if (!isActive && e.pointerType !== "touch") play("link.hover");
                    }}
                  >
                    {p.listTitle}
                    <br />
                    {p.year}
                  </a>
                </li>
              );
            })}
          </ul>
          {PROJECTS.map((p) => {
            const s = ITEMS[p.slug].scribble;
            return (
              <span
                key={p.slug}
                className="project-list__scribble"
                data-slug={p.slug}
                aria-hidden="true"
                style={{ "--x": s.x, "--y": s.y, "--w": s.w } as CSSProperties}
                dangerouslySetInnerHTML={{ __html: s.svg }}
              />
            );
          })}
        </nav>
        <TrainLine className="project__line" />
      </div>
      <div className="project__swap">{children}</div>
    </StationLayout>
  );
}
