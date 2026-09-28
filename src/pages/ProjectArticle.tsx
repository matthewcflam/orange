import { useRef, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { HERO_SIZES, type Picture } from "../lib/assets";
import { prefersReducedMotion } from "../lib/motion";
import { PROJECT } from "../config/timings";
import type { Hero, Project } from "../content/projects";

function ResponsivePicture({ picture, alt, eager }: { picture: Picture; alt: string; eager: boolean }) {
  return (
    <picture>
      {Object.entries(picture.sources).map(([format, srcset]) => (
        <source key={format} type={`image/${format}`} srcSet={srcset} sizes={HERO_SIZES} />
      ))}
      <img
        src={picture.img.src}
        width={picture.img.w}
        height={picture.img.h}
        alt={alt}
        decoding="async"
        fetchPriority={eager ? "high" : undefined}
        loading={eager ? "eager" : "lazy"}
      />
    </picture>
  );
}

function HeroBlock({ hero, eager }: { hero: Hero; eager: boolean }) {
  return (
    <div className={`project-hero project-hero--${hero.kind}`} style={{ "--h": hero.height } as React.CSSProperties}>
      {hero.kind === "image" ? (
        <ResponsivePicture picture={hero.picture} alt={hero.alt} eager={eager} />
      ) : (
        <span className="project-hero__label">{hero.label}</span>
      )}
    </div>
  );
}

/** External link, bottom-right, with a hand-drawn underline that redraws on
 *  hover (§10.1). TODO(open-question #13): the underline stroke art is
 *  missing; this path is a placeholder shaped like the mockup's. */
function ProjectLink({ href, label }: { href: string; label: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const redraw = () => {
    play("link.hover");
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      pathRef.current,
      { drawSVG: "0%" },
      { drawSVG: "100%", duration: PROJECT.LINK_UNDERLINE_DRAW, ease: PROJECT.LINK_UNDERLINE_EASE, overwrite: true },
    );
  };
  return (
    <a
      className="project-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerEnter={(e) => e.pointerType === "mouse" && redraw()}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && redraw()}
    >
      {label}
      <svg className="project-link__underline" viewBox="0 0 344 18" aria-hidden="true">
        <path ref={pathRef} d="M3 4C70 2.5 150 3.5 215 6.5S310 12.5 341 14" />
      </svg>
    </a>
  );
}

/**
 * A project's content inside the shell: the center column (heroes, body,
 * date) and the external link. `hero` replaces the image stack (Portfolio
 * draws its own).
 */
export default function ProjectArticle({ project, hero }: { project: Project; hero?: ReactNode }) {
  const firstImage = project.heroes.findIndex((h) => h.kind === "image");
  return (
    <>
      <article className="project__column">
        <h1 className="visually-hidden">{project.title}</h1>
        {hero ?? (
          <div className="project__heroes">
            {project.heroes.map((h, i) => (
              <HeroBlock key={i} hero={h} eager={i === firstImage} />
            ))}
          </div>
        )}
        {/* TODO(milestone 8): ObstacleText with the draggable obstacle (§11). */}
        <div className="project__body">
          {project.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="project__date">{project.date}</p>
      </article>
      {project.link && <ProjectLink {...project.link} />}
    </>
  );
}
