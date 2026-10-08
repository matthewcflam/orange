import { useLayoutEffect, useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { CHROME } from "../config/timings";
import SocialLinks from "./SocialLinks";
import { layoutHome } from "./homeLayout";
import { onCompactChange } from "../lib/frame";
import "./chrome.css";

/**
 * "Matthew Lam" and the bio, shared chrome (spec §4.1) so the name stays put
 * from the gate to home (design/mockups-v2/Home Page (7).png). On the gate
 * only the name shows; the bio below it (`.name-block__bio`) is revealed by
 * the gate → home timeline. Faded out off home.
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

  // Compact layout: centre the name block and "who?" under the map, and
  // decide where "who?" goes (homeLayout.ts). Again whenever the block's
  // size (its bio wraps) or the window changes.
  useLayoutEffect(() => {
    const block = ref.current!;
    const layout = () => layoutHome(block);
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(block);
    // Next frame: TransitMap moves the block (--map-foot) on the same event.
    let frame = 0;
    const layoutSoon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    };
    window.addEventListener("resize", layoutSoon);
    const offCompact = onCompactChange(layoutSoon);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", layoutSoon);
      offCompact();
    };
  }, []);

  return (
    <div ref={ref} className="name-block">
      <p className="name-block__name">Matthew Lam</p>
      <div className="name-block__bio">
        <p>Software Developer based in Vancouver, CA<br />
        Computer Engineering at UBC (c/o 2028)</p>
        {/* <p>
          Computer Engineering at UBC (c/o 2028)<br />
          prev. SWE @ EnerSys<br />
          Web Development @ UBC Sailbot<br />
          Operations Lead @ Third Quadrant Design
        </p> */}
        <p>currently: trying to use figma at 120%</p>
        <SocialLinks />
      </div>
    </div>
  );
}
