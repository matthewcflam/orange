import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { CHROME } from "../config/timings";
import wipSvg from "../../assets-src/svg/wip.svg?raw";
import "./chrome.css";

/**
 * "Matthew Lam (wip)", shared chrome (spec §4.1, §6.2). Rendered once and never
 * unmounted, at the same position on the gate and home; faded out elsewhere.
 * The SVG is inlined so its paths can be animated later.
 */
export default function NameBlock({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      // Set instantly on mount (e.g. a deep link); fade on later changes.
      gsap.to(ref.current, { autoAlpha: visible ? 1 : 0, duration: first.current ? 0 : CHROME.NAME_FADE, overwrite: true });
      first.current = false;
    },
    { dependencies: [visible] },
  );

  return (
    <div ref={ref} className="name-block">
      <p className="name-block__name">Matthew Lam</p>
      <div className="name-block__wip" aria-label="(work in progress)" role="img" dangerouslySetInnerHTML={{ __html: wipSvg }} />
    </div>
  );
}
