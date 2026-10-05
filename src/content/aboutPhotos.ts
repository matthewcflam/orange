/**
 * About page photo (About (6).png): one box right of the copy, in mockup px.
 * The box matches me-final.png's aspect, so object-fit: cover crops nothing.
 * (me1–me4.jpg were the About (5) photos; they are unused now.)
 */
import type { Picture } from "../lib/assets";
import { frameSizes } from "../lib/frame";
import meFinal from "../../assets-src/images/me-final.png?hero";
import meFinalFrost from "../../assets-src/images/me-final.png?frost";
import meFinalFrostLight from "../../assets-src/images/me-final.png?frostlight";

export interface AboutPhoto {
  id: string;
  picture: Picture;
  /** Heavy frost: a tiny pre-blurred copy, inlined (data URI), so it's
   *  there before any image loads. */
  frost: string;
  /** Light frost: a small pre-blurred copy (URL). */
  frostLight: string;
  alt: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** <source sizes>: the box width in the --px frame. */
  sizes: string;
}

const photo = (
  id: string,
  [picture, frost, frostLight]: [Picture, string, string],
  alt: string,
  x: number,
  y: number,
  w: number,
  h: number,
): AboutPhoto => ({ id, picture, frost, frostLight, alt, x, y, w, h, sizes: frameSizes(w) });

/** In reveal order, top first. */
export const ABOUT_PHOTOS: AboutPhoto[] = [
  photo(
    "me-final",
    [meFinal, meFinalFrost, meFinalFrostLight],
    "Matthew giving two thumbs up on the seawall, English Bay behind him",
    941,
    278,
    447,
    465,
  ),
];
