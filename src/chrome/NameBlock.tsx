import { useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { CHROME, HOME } from "../config/timings";
import { play } from "../audio/engine";
import { copyText } from "../lib/clipboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
// Per-icon imports: the packs' index files don't tree-shake (+26 kB gz).
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons/faLinkedinIn";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons/faEnvelope";
import "./chrome.css";

// Font Awesome styles come from the import above, not injected at runtime.
config.autoAddCss = false;

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
        <p>Vancouver, CA<br />
          Computer Engineering at UBC (c/o 2028)
        </p>
        <p>currently: trying to get a job :)</p>
        <div className="name-block__links">
          <a className="name-block__icon interactive" href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="GitHub" onPointerEnter={hover}>
            <FontAwesomeIcon icon={faGithub} aria-hidden="true" />
          </a>
          <a className="name-block__icon interactive" href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" onPointerEnter={hover}>
            <FontAwesomeIcon icon={faLinkedinIn} aria-hidden="true" />
          </a>
          <button type="button" className="name-block__icon name-block__icon--mail interactive" aria-label={`Copy email address (${EMAIL})`} onPointerEnter={hover} onClick={copyEmail}>
            <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
          </button>
          <p ref={toastRef} className="name-block__toast" role="status">
            {copied ? "email copied to clipboard!" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
