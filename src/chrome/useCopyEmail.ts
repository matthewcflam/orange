import { useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { HOME } from "../config/timings";
import { play } from "../audio/engine";
import { copyText } from "../lib/clipboard";
import { EMAIL } from "../content/contact";

/**
 * Copy the email address and show the "copied" toast (HOME.TOAST_*). Put
 * `toastRef` on a status element that renders "email copied to clipboard!"
 * while `copied` is true.
 */
export function useCopyEmail() {
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

  return { copyEmail, toastRef, copied };
}
