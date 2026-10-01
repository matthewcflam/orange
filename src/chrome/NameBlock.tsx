import { useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { CHROME, HOME } from "../config/timings";
import { play } from "../audio/engine";
import { copyText } from "../lib/clipboard";
import "./chrome.css";

const EMAIL = "matthewcflam@gmail.com";
const GITHUB = "https://github.com/matthewcflam";
const LINKEDIN = "https://www.linkedin.com/in/matthewcflam/";

/**
 * "Matthew Lam" and the bio, shared chrome (spec §4.1) so the name stays put
 * from the gate to home (design/mockups-v2/Home Page (7).png). On the gate
 * only the name shows; the bio below it (`.name-block__bio`) is revealed by
 * the gate → home timeline. Faded out off home.
 */
export default function NameBlock({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLParagraphElement>(null);
  const toastTl = useRef<gsap.core.Timeline | null>(null);
  const first = useRef(true);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      // Set instantly on mount (e.g. a deep link); fade on later changes.
      gsap.to(ref.current, { autoAlpha: visible ? 1 : 0, duration: first.current ? 0 : CHROME.NAME_FADE, overwrite: true });
      first.current = false;
    },
    { dependencies: [visible] },
  );

  // NameBlock never unmounts, so the toast's timeline needs no GSAP context.
  const copyEmail = async () => {
    const ok = await copyText(EMAIL);
    if (!ok) return;
    play("project.select");
    setCopied(true);
    toastTl.current?.kill();
    toastTl.current = gsap
      .timeline({ onComplete: () => setCopied(false) })
      .fromTo(toastRef.current, { autoAlpha: 0, y: HOME.TOAST_RISE_PX }, { autoAlpha: 1, y: 0, duration: HOME.TOAST_IN, ease: HOME.TOAST_EASE })
      .to(toastRef.current, { autoAlpha: 0, duration: HOME.TOAST_OUT }, `+=${HOME.TOAST_HOLD}`);
  };

  const hover = (e: React.PointerEvent) => e.pointerType !== "touch" && play("link.hover");

  return (
    <div ref={ref} className="name-block">
      <p className="name-block__name">Matthew Lam</p>
      <div className="name-block__bio">
        <p>Vancouver, BC</p>
        <p>
          Computer Engineering at UBC (exp. 2028)
          <br />
          prev. SWE @ EnerSys
          <br />
          Web Development @ UBC Sailbot
          <br />
          Operations Lead @ Third Quadrant Design
        </p>
        <p>currently: trying to get a job :)</p>
        <div className="name-block__links">
          <a className="name-block__icon interactive" href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="GitHub" onPointerEnter={hover}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"
              />
            </svg>
          </a>
          <a className="name-block__icon interactive" href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" onPointerEnter={hover}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M0 0h24v24H0zm3.6 9.2V20h3.5V9.2zm1.75-5.3a2 2 0 1 0 0 4.05 2 2 0 0 0 0-4.05zM9.2 9.2V20h3.45v-5.35c0-1.41.27-2.78 2.02-2.78 1.72 0 1.75 1.61 1.75 2.87V20h3.45v-5.93c0-2.91-.63-5.15-4.03-5.15-1.63 0-2.73.9-3.18 1.75h-.05V9.2z"
              />
            </svg>
          </a>
          <button type="button" className="name-block__icon name-block__icon--mail interactive" aria-label={`Copy email address (${EMAIL})`} onPointerEnter={hover} onClick={copyEmail}>
            <svg viewBox="0 0 41 35" aria-hidden="true">
              <rect width="41" height="35" rx="8" fill="currentColor" />
              <path d="M10 13.5 20.5 20 31 13.5" fill="none" stroke="var(--color-bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p ref={toastRef} className="name-block__toast" role="status">
            {copied ? "email copied to clipboard!" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
