/**
 * The About photos' defrost (user request). Each photo starts under frosted
 * glass: a pre-blurred copy (inlined, so it shows before anything loads), a
 * lighter blur, a milky wash and grain (pages/AboutPhoto.tsx). A photo melts
 * only once its sharp image and light frost are decoded, so it never pops in
 * mid-melt; a slow photo just stays frosted. Photos melt top first,
 * FROST.STAGGER apart, after whenPageShown() + FROST.DELAY. Only opacity
 * animates.
 */
import { gsap } from "../lib/gsap";
import { decodeUrl } from "../lib/assets";
import { whenPageShown } from "../lib/pageReveal";
import { FROST } from "../config/timings";

const wait = (s: number) => new Promise<void>((r) => gsap.delayedCall(s, r));

/** The photo's sharp <img> and light frost, decoded. Never rejects. */
function ready(el: HTMLElement, frostLight: string): Promise<void> {
  const img = el.querySelector<HTMLImageElement>(".about-photo__img img");
  const sharp = img ? img.decode().catch(() => undefined) : Promise.resolve();
  return Promise.all([sharp, decodeUrl(frostLight)]).then(() => undefined);
}

function melt(el: HTMLElement): gsap.core.Timeline {
  const q = gsap.utils.selector(el);
  return gsap
    .timeline({
      // Drop the frost layers once clear.
      onComplete: () => gsap.set(q(".about-photo__glass"), { display: "none" }),
    })
    .to(q(".about-photo__frost--heavy"), { opacity: 0, duration: FROST.HEAVY_S, ease: "power2.inOut" }, 0)
    .to(q(".about-photo__wash, .about-photo__grain"), { opacity: 0, duration: FROST.WASH_S, ease: "power1.inOut" }, 0)
    .to(q(".about-photo__frost--light"), { opacity: 0, duration: FROST.LIGHT_S, ease: "power2.out" }, FROST.LIGHT_AT);
}

/** Melt `photos` in order. Returns a cleanup that stops and kills it all. */
export function defrost(photos: { el: HTMLElement; frostLight: string }[]): () => void {
  let alive = true;
  const timelines: gsap.core.Timeline[] = [];
  // Start decoding now, not when each photo's turn comes.
  const readies = photos.map((p) => ready(p.el, p.frostLight));
  void (async () => {
    await whenPageShown();
    if (!alive) return;
    await wait(FROST.DELAY);
    for (let i = 0; i < photos.length; i++) {
      if (i > 0) await wait(FROST.STAGGER);
      await readies[i];
      if (!alive) return;
      timelines.push(melt(photos[i].el));
    }
  })();
  return () => {
    alive = false;
    for (const tl of timelines) tl.kill();
  };
}
