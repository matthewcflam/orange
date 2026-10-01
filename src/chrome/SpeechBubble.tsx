import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { play } from "../audio/engine";
import { pxScale } from "../lib/frame";
import { prefersReducedMotion } from "../lib/motion";
import { useSpeech } from "../lib/speech";
import { SPEECH } from "../config/timings";

/** The newest utterance any bubble has shown, so a remount (going home and
 *  back) doesn't replay an old line. */
let handledId = 0;

/** speech.svg's corner radius, mockup px. */
const SPEECH_RADIUS = 6;

/**
 * The orange speech bubble above "Matthew Lam" (speech.svg: a rounded rect
 * and a tail down to the name). Each say() pops it open like the iPhone's
 * Dynamic Island: a small pill at the tail springs to the text's size, and a
 * new line while open resizes it. It closes SPEECH.HOLD after the latest line.
 *
 * The body is fixed-width with a height measured from the text; the text sits
 * in a fixed-width inner box so it never reflows while the body morphs.
 */
export default function SpeechBubble() {
  const utterance = useSpeech();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const tailRef = useRef<SVGSVGElement>(null);
  const open = useRef(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const closer = useRef<gsap.core.Tween | null>(null);

  const close = () => {
    if (!open.current) return;
    open.current = false;
    closer.current?.kill();
    tl.current?.kill();
    const px = pxScale();
    const t = gsap.timeline();
    tl.current = t;
    if (prefersReducedMotion()) {
      t.to(rootRef.current, { autoAlpha: 0, duration: SPEECH.TEXT_IN });
      return;
    }
    t.to(textRef.current, { autoAlpha: 0, duration: SPEECH.TEXT_OUT }, 0)
      .to(tailRef.current, { scale: 0, duration: SPEECH.CLOSE * 0.6, ease: SPEECH.CLOSE_EASE }, 0)
      .to(
        bodyRef.current,
        { width: SPEECH.PILL_W_PX * px, height: SPEECH.PILL_H_PX * px, borderRadius: 999, duration: SPEECH.CLOSE, ease: SPEECH.CLOSE_EASE },
        0,
      )
      .to(rootRef.current, { autoAlpha: 0, duration: SPEECH.TEXT_OUT }, `>-${SPEECH.TEXT_OUT}`);
  };

  useLayoutEffect(() => {
    gsap.set(rootRef.current, { autoAlpha: 0 });
    return () => {
      tl.current?.kill();
      closer.current?.kill();
    };
  }, []);

  useLayoutEffect(() => {
    if (!utterance || utterance.id <= handledId) return;
    handledId = utterance.id;
    const root = rootRef.current!;
    const body = bodyRef.current!;
    const text = textRef.current!;
    const tail = tailRef.current!;
    const reduced = prefersReducedMotion();
    const px = pxScale();
    const pill = { width: SPEECH.PILL_W_PX * px, height: SPEECH.PILL_H_PX * px, borderRadius: 999 };

    const fit = () => {
      text.textContent = utterance.text;
      const cs = getComputedStyle(body);
      return {
        width: parseFloat(cs.getPropertyValue("--bubble-w")) * px,
        height: Math.max(parseFloat(cs.getPropertyValue("--bubble-min-h")) * px, text.offsetHeight + 2 * parseFloat(cs.paddingTop)),
      };
    };

    tl.current?.kill();
    const t = gsap.timeline();
    tl.current = t;
    if (reduced) {
      const size = fit();
      gsap.set(body, { ...size, borderRadius: "" });
      gsap.set([text, tail], { autoAlpha: 1, scale: 1 });
      t.to(root, { autoAlpha: 1, duration: SPEECH.TEXT_IN });
    } else if (!open.current) {
      const size = fit();
      gsap.set(root, { autoAlpha: 1 });
      gsap.set(body, pill);
      gsap.set(text, { autoAlpha: 0 });
      gsap.set(tail, { scale: 0 });
      t.to(body, { ...size, borderRadius: SPEECH_RADIUS * px, duration: SPEECH.OPEN, ease: SPEECH.OPEN_EASE }, 0)
        .to(tail, { scale: 1, duration: SPEECH.TAIL, ease: SPEECH.OPEN_EASE }, SPEECH.TAIL_DELAY)
        .to(text, { autoAlpha: 1, duration: SPEECH.TEXT_IN }, SPEECH.TEXT_IN_DELAY);
    } else {
      // Already open: swap the line, then spring to its size.
      t.to(text, { autoAlpha: 0, duration: SPEECH.TEXT_OUT })
        .add(() => {
          const size = fit();
          gsap.to(body, { ...size, duration: SPEECH.RESIZE, ease: SPEECH.RESIZE_EASE });
        })
        .to(text, { autoAlpha: 1, duration: SPEECH.TEXT_IN }, `+=${SPEECH.TEXT_IN_DELAY}`);
    }
    open.current = true;
    play("link.hover");

    closer.current?.kill();
    closer.current = gsap.delayedCall(SPEECH.HOLD, close);
  }, [utterance]);

  return (
    <div ref={rootRef} className="speech interactive" onClick={close}>
      <div ref={bodyRef} className="speech__body">
        <p ref={textRef} className="speech__text" role="status" aria-live="polite" />
      </div>
      {/* speech.svg's tail, from the rect's bottom-right corner to the name. */}
      <svg ref={tailRef} className="speech__tail" viewBox="117 56 48 77" aria-hidden="true">
        <path d="M164.606 132.494L117.654 60.1114L161.636 56.9023L164.606 132.494Z" />
      </svg>
    </div>
  );
}
