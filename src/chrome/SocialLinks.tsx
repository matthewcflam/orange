import { useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { HOME } from "../config/timings";
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
 * GitHub, LinkedIn and a mail button that copies the address, with its
 * "copied" toast. Under the bio on home; top-right, beside the Map pill, on
 * station pages (`social-links--station`, scaled by --icon-scale).
 */
export default function SocialLinks({ className }: { className?: string }) {
  const toastRef = useRef<HTMLParagraphElement>(null);
  const toastTl = useRef<gsap.core.Timeline | null>(null);
  const [copied, setCopied] = useState(false);

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
    <div className={`social-links${className ? ` ${className}` : ""}`}>
      <a className="social-links__icon interactive" href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="GitHub" onPointerEnter={hover}>
        <FontAwesomeIcon icon={faGithub} aria-hidden="true" />
      </a>
      <a className="social-links__icon interactive" href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" onPointerEnter={hover}>
        <FontAwesomeIcon icon={faLinkedinIn} aria-hidden="true" />
      </a>
      <button type="button" className="social-links__icon social-links__icon--mail interactive" aria-label={`Copy email address (${EMAIL})`} onPointerEnter={hover} onClick={copyEmail}>
        <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
      </button>
      <p ref={toastRef} className="social-links__toast" role="status">
        {copied ? "email copied to clipboard!" : ""}
      </p>
    </div>
  );
}
