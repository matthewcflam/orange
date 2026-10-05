import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import StationLayout from "./StationLayout";
import TrainLine from "./TrainLine";
import ResponsivePicture from "./ResponsivePicture";
import { JOBS, EXTRAS, type Job } from "../content/experience";
import { revealOnScroll } from "../lib/scrollReveal";
import { gsap } from "../lib/gsap";
import { pxScale } from "../lib/frame";
import { prefersReducedMotion } from "../lib/motion";
import { whenPageShown } from "../lib/pageReveal";
import { isUnderPointer } from "../lib/pointer";
import { EXPERIENCE } from "../config/timings";
import extras from "../../assets-src/svg/extras.svg";

/** Show or hide a job's photos (the later one lands on top, second). */
function setPhotos(els: HTMLElement[], on: boolean) {
  if (prefersReducedMotion()) {
    gsap.set(els, { autoAlpha: on ? 1 : 0 });
    return;
  }
  gsap.to(
    els,
    on
      ? {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: EXPERIENCE.PHOTO_IN,
          ease: EXPERIENCE.PHOTO_EASE,
          stagger: EXPERIENCE.PHOTO_STAGGER,
          overwrite: "auto",
        }
      : {
          autoAlpha: 0,
          scale: EXPERIENCE.PHOTO_SCALE_FROM,
          y: EXPERIENCE.PHOTO_Y * pxScale(),
          duration: EXPERIENCE.PHOTO_OUT,
          ease: "power2.in",
          overwrite: "auto",
        },
  );
}

const noHover = () => window.matchMedia("(hover: none)").matches;

/**
 * One job: a full-width band from its header's top to the foot of its copy.
 * The role and date hang left of the line; the photos show only while the
 * cursor is over the band or a shown photo (a tap toggles them on touch
 * screens).
 */
function JobRow({ job, extrasMark }: { job: Job; extrasMark?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shown = useRef(false);
  const hasPhotos = job.photos.length > 0;

  useLayoutEffect(() => {
    if (!hasPhotos) return;
    const els = photoRefs.current.filter((el): el is HTMLDivElement => el !== null);
    if (!prefersReducedMotion()) {
      gsap.set(els, { scale: EXPERIENCE.PHOTO_SCALE_FROM, y: EXPERIENCE.PHOTO_Y * pxScale() });
    }
    return () => {
      gsap.killTweensOf(els);
    };
  }, [hasPhotos]);

  const toggle = useCallback(
    (on: boolean) => {
      if (!hasPhotos || shown.current === on) return;
      shown.current = on;
      setPhotos(
        photoRefs.current.filter((el): el is HTMLDivElement => el !== null),
        on,
      );
    },
    [hasPhotos],
  );

  // The page can appear under a cursor that isn't moving, which fires no
  // pointerenter: open the job it's already resting on.
  useEffect(() => {
    if (!hasPhotos) return;
    let live = true;
    void whenPageShown().then(() => {
      if (live && isUnderPointer(sectionRef.current!)) toggle(true);
    });
    return () => {
      live = false;
    };
  }, [hasPhotos, toggle]);

  return (
    <section
      ref={sectionRef}
      className="experience__job"
      onPointerEnter={hasPhotos ? (e) => e.pointerType !== "touch" && toggle(true) : undefined}
      onPointerLeave={hasPhotos ? (e) => e.pointerType !== "touch" && toggle(false) : undefined}
      onClick={hasPhotos ? () => noHover() && toggle(!shown.current) : undefined}
    >
      <div className="experience__role" data-reveal>
        {extrasMark && <img className="experience__extras" src={extras} alt="Extras" />}
        <p className="experience__title">{job.role}</p>
        <p className="experience__date">{job.date}</p>
      </div>
      <h2 className="experience__company" data-reveal>
        {job.company}
      </h2>
      {job.body.map((para) => (
        <p key={para} className="experience__para" data-reveal>
          {para}
        </p>
      ))}
      {job.photos.map((p, i) => (
        <div
          key={p.picture.img.src}
          ref={(el) => {
            photoRefs.current[i] = el;
          }}
          className="experience__photo"
          style={{ "--x": p.x, "--dy": p.dy, "--w": p.w, "--h": p.h } as CSSProperties}
        >
          <ResponsivePicture picture={p.picture} alt={p.alt} eager sizes={p.sizes} />
        </div>
      ))}
    </section>
  );
}

/** Experience (design/mockups-v2/Experience (2).png): jobs, then the extras.
 *  Everything fades up as it's scrolled into view (lib/scrollReveal.ts). */
export default function Experience() {
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => revealOnScroll([...listRef.current!.closest(".station-page")!.querySelectorAll<HTMLElement>("[data-reveal]")]), []);

  return (
    <StationLayout className="experience" footerReveal>
      <TrainLine className="experience__line" />
      <div ref={listRef} className="experience__list">
        {JOBS.map((job) => (
          <JobRow key={job.company} job={job} />
        ))}
        <div className="experience__extras-group">
          {EXTRAS.map((job, i) => (
            <JobRow key={job.company} job={job} extrasMark={i === 0} />
          ))}
        </div>
      </div>
    </StationLayout>
  );
}
