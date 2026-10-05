import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { CHROME } from "../config/timings";
import SocialLinks from "./SocialLinks";
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
