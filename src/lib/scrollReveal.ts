/**
 * Scroll reveal (Experience, user request): each element fades up once, as it
 * enters the window. Lenis drives the native window scroll, so an
 * IntersectionObserver sees it. Nothing runs until the page is on screen;
 * then the elements already in view cascade in together, and the rest follow
 * as they're scrolled to. Reduced motion: everything just shows.
 */
import { gsap } from "./gsap";
import { pxScale } from "./frame";
import { prefersReducedMotion } from "./motion";
import { whenPageShown } from "./pageReveal";
import { EXPERIENCE } from "../config/timings";

const inDocumentOrder = (a: Element, b: Element) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

/** Hide `els` now (call from a layout effect, so they never flash) and reveal
 *  them on scroll. Returns a cleanup. */
export function revealOnScroll(els: HTMLElement[]): () => void {
  if (prefersReducedMotion() || els.length === 0) return () => {};
  gsap.set(els, { opacity: 0, y: EXPERIENCE.REVEAL_Y * pxScale() });

  let alive = true;
  let io: IntersectionObserver | null = null;
  const tweens: gsap.core.Tween[] = [];

  void whenPageShown().then(() => {
    if (!alive) return;
    let first = true;
    io = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        if (entering.length === 0) return;
        for (const el of entering) io!.unobserve(el);
        tweens.push(
          gsap.to(entering.sort(inDocumentOrder), {
            opacity: 1,
            y: 0,
            duration: EXPERIENCE.REVEAL_DURATION,
            ease: EXPERIENCE.REVEAL_EASE,
            stagger: EXPERIENCE.REVEAL_STAGGER,
            delay: first ? EXPERIENCE.REVEAL_DELAY : 0,
            clearProps: "opacity,transform",
          }),
        );
        first = false;
      },
      { threshold: EXPERIENCE.REVEAL_THRESHOLD },
    );
    for (const el of els) io.observe(el);
  });

  return () => {
    alive = false;
    io?.disconnect();
    for (const t of tweens) t.kill();
  };
}
