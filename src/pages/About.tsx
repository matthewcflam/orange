import { useLayoutEffect, useRef } from "react";
import StationLayout from "./StationLayout";
import TrainLine from "./TrainLine";
import AboutPhoto from "./AboutPhoto";
import { ABOUT_PHOTOS } from "../content/aboutPhotos";
import { defrost } from "./aboutFrost";
import { prefersReducedMotion } from "../lib/motion";

/** About (design/mockups-v2/About (4).png): copy, the line, and photos right
 *  of it (content/aboutPhotos.ts) that defrost in (pages/aboutFrost.ts). */
export default function About() {
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frost = !prefersReducedMotion();

  useLayoutEffect(() => {
    if (!frost) return;
    return defrost(ABOUT_PHOTOS.map((p, i) => ({ el: photoRefs.current[i]!, frostLight: p.frostLight })));
  }, [frost]);

  return (
    <StationLayout>
      <div className="station-copy about__copy">
        <p>Hello! I’m Matthew.</p>
        <p>I’m in my third year of computer engineering at the University of British Columbia.</p>
        <p>I like to solve problems with clever software and great design.</p>
        <p>Outside of school, I love:</p>
        <ul>
          <li>graphic design</li>
          <li>swimming</li>
          <li>cinema</li>
        </ul>
        <p>Currently: learning sound design!</p>
      </div>
      <TrainLine className="about__line" />
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
