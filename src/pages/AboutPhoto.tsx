import { forwardRef } from "react";
import type { AboutPhoto as Photo } from "../content/aboutPhotos";
import ResponsivePicture from "./ResponsivePicture";

/**
 * One About photo. With `frost`, it sits under frosted glass that
 * pages/aboutFrost.ts melts: the blurs are baked at build time (`?frost`,
 * `?frostlight` in vite.config.ts), so there are no CSS filters.
 */
const AboutPhoto = forwardRef<HTMLDivElement, { photo: Photo; frost: boolean }>(function AboutPhoto({ photo, frost }, ref) {
  const style = {
    "--x": photo.x,
    "--y": photo.y,
    "--w": photo.w,
    "--h": photo.h,
  } as React.CSSProperties;

  return (
    <div ref={ref} className="about-photo" style={style}>
      <ResponsivePicture className="about-photo__img" picture={photo.picture} alt={photo.alt} eager sizes={photo.sizes} />
      {frost && (
        <div className="about-photo__glass" aria-hidden="true">
          <div className="about-photo__frost about-photo__frost--light" style={{ backgroundImage: `url(${photo.frostLight})` }} />
          <div className="about-photo__frost about-photo__frost--heavy" style={{ backgroundImage: `url(${photo.frost})` }} />
          <div className="about-photo__frost about-photo__wash" />
          <div className="about-photo__frost about-photo__grain" />
        </div>
      )}
    </div>
  );
});

export default AboutPhoto;
