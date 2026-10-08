import { useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { HOME } from "../config/timings";

/**
 * A short status toast (HOME.TOAST_*): rises and fades in, holds, fades out.
 * Put `toastRef` on the toast element and render its text while `shown` is
 * true; `show()` again restarts it.
 */
export function useToast<T extends Element = HTMLParagraphElement>() {
  const toastRef = useRef<T>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [shown, setShown] = useState(false);

  const show = () => {
    setShown(true);
    tl.current?.kill();
    tl.current = gsap
      .timeline({ onComplete: () => setShown(false) })
      .fromTo(toastRef.current, { autoAlpha: 0, y: HOME.TOAST_RISE_PX }, { autoAlpha: 1, y: 0, duration: HOME.TOAST_IN, ease: HOME.TOAST_EASE })
      .to(toastRef.current, { autoAlpha: 0, duration: HOME.TOAST_OUT }, `+=${HOME.TOAST_HOLD}`);
  };

  return { toastRef, shown, show };
}
