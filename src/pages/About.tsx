import { useLayoutEffect, useRef } from "react";
import StationLayout from "./StationLayout";
import AboutPhoto from "./AboutPhoto";
import { ABOUT_PHOTOS } from "../content/aboutPhotos";
import { GITHUB, LINKEDIN, SPOTIFY, LETTERBOXD } from "../content/contact";
import { defrost } from "./aboutFrost";
import { prefersReducedMotion } from "../lib/motion";
import { play } from "../audio/engine";
import { useCopyEmail } from "../chrome/useCopyEmail";
import line1 from "../../assets-src/svg/line1.svg";
import line2 from "../../assets-src/svg/line2.svg";
import line3 from "../../assets-src/svg/line3.svg";
import anything from "../../assets-src/svg/anything.svg";

const hover = (e: React.PointerEvent) => e.pointerType !== "touch" && play("link.hover");

function Ext({ href, children }: { href: string; children: string }) {
  return (
    <a className="about__link" href={href} target="_blank" rel="noopener noreferrer" onPointerEnter={hover}>
      {children}
    </a>
  );
}

/** About (design/mockups-v2/About (6).png): copy with hand-drawn marks
 *  (static, they show with the text) and a photo right of it
 *  (content/aboutPhotos.ts) that defrosts in (pages/aboutFrost.ts). */
export default function About() {
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frost = !prefersReducedMotion();
  const { copyEmail, toastRef, copied } = useCopyEmail();

  useLayoutEffect(() => {
    if (!frost) return;
    return defrost(ABOUT_PHOTOS.map((p, i) => ({ el: photoRefs.current[i]!, frostLight: p.frostLight })));
  }, [frost]);

  return (
    <StationLayout className="about">
      <div className="station-copy about__copy">
        <p>Hi, I’m Matthew</p>
        <p>I’m a curious, creative thinker that uses clever software and design to solve problems.</p>
        <p>In my free time, you could catch me:</p>
        <ul className="about__list">
          <li>
            <img className="about__dash" src={line1} alt="" />
            listening to <Ext href={SPOTIFY}>music</Ext>
          </li>
          <li>
            <img className="about__dash" src={line2} alt="" />
            catching a <Ext href={LETTERBOXD}>flick</Ext>
          </li>
          <li>
            <img className="about__dash about__dash--thin" src={line3} alt="" />
            working on <em>something</em>
          </li>
        </ul>
        <p className="about__connect">
          Connect with me about <img className="about__anything" src={anything} alt="anything" /> on{" "}
          <Ext href={GITHUB}>github</Ext>, <Ext href={LINKEDIN}>linkedin</Ext>, or{" "}
          <button type="button" className="about__link" onPointerEnter={hover} onClick={copyEmail}>
            email
          </button>{" "}
          <span className="about__smile">:)</span>
        </p>
        <p ref={toastRef} className="about__toast" role="status">
          {copied ? "email copied to clipboard!" : ""}
        </p>
      </div>
      {ABOUT_PHOTOS.map((photo, i) => (
        <AboutPhoto
          key={photo.id}
          ref={(el) => {
            photoRefs.current[i] = el;
          }}
          photo={photo}
          frost={frost}
        />
      ))}
    </StationLayout>
  );
}
