import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import { onNavClick } from "../lib/router";
import { prefetchRoute } from "../lib/assets";
import { whenPageShown } from "../lib/pageReveal";
import { prefersReducedMotion } from "../lib/motion";
import { PROJECT } from "../config/timings";
import { PROJECTS, type ProjectSlug } from "../content/projects";
import oysterScribble from "../../assets-src/svg/oyster-scribble.svg?raw";
import mangoScribble from "../../assets-src/svg/mango-scribble.svg?raw";
import portfolioScribble from "../../assets-src/svg/portfolio-scribble.svg?raw";
import "./project.css";

/** Hand-drawn mark on the active project (design/ASSETS.md): an ellipse
 *  around Oyster News and Mango, a squiggle under Portfolio. x/y are the SVG's
 *  top-left in mockup px (06–08), drawn 1:1. */
const SCRIBBLES: Record<ProjectSlug, { svg: string; x: number; y: number; w: number }> = {
  "oyster-news": { svg: oysterScribble, x: 1076, y: 482, w: 282 },
  mango: { svg: mangoScribble, x: 1090, y: 513, w: 173 },
  portfolio: { svg: portfolioScribble, x: 1124, y: 613, w: 119 },
};

/**
 * Shared shell for the project pages (spec §10.1). The mini map is global
 * chrome. The project list stays mounted while projects switch; everything
 * per project (column, link, artifacts) sits in `.project__swap`, which the
 * transition crossfades (transition/tempTransition.ts).
 */
export default function ProjectLayout({ active, children }: { active: ProjectSlug; children: ReactNode }) {
  const listRef = useRef<HTMLUListElement>(null);
  const shown = useRef<ProjectSlug | null>(null);

  // Scribble: the previous one fades, the active one draws in once the page
  // is on screen (immediately on a project switch).
  useLayoutEffect(() => {
    const q = gsap.utils.selector(listRef);
    const current = q(`[data-slug="${active}"]`)[0];
    const path = current.querySelector("path");
    const prev = shown.current && shown.current !== active ? q(`[data-slug="${shown.current}"]`)[0] : null;
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
    <div className="project">
      <div className="project__swap">{children}</div>

      <nav className="project-list" aria-label="Projects">
        <ul ref={listRef}>
          {PROJECTS.map((p) => {
            const isActive = p.slug === active;
            const s = SCRIBBLES[p.slug];
            return (
              <li key={p.slug}>
                <a
                  href={p.path}
                  className="project-list__link"
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => (isActive ? e.preventDefault() : onNavClick(e, p.path))}
                  onPointerEnter={() => prefetchRoute(p.path)}
                >
                  {p.title}
                </a>
                <span
                  className="project-list__scribble"
                  data-slug={p.slug}
                  aria-hidden="true"
                  style={{ "--x": s.x, "--y": s.y, "--w": s.w } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: s.svg }}
                />
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
