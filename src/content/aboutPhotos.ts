/**
 * About page photos (About (5).png). The page mirrors about the line (mockup
 * x 884, the page centre): the photos' left edge sits as far right of the
 * line as the copy's longest line ends left of it (122.3 in browser Inter),
 * and their right edge (1657) as far from the page edge as the copy's left
 * (111). me3/me4 sizes and heights are from the mockup; the column gap is
 * widened to fill. me1 and me2 aren't in it, so they mirror them in the row
 * below (my placement, user to tune). Boxes are mockup px; each photo is
 * cropped to its box with object-fit: cover.
 */
import type { Picture } from "../lib/assets";
import me1 from "../../assets-src/images/me1.jpg?hero";
import me2 from "../../assets-src/images/me2.jpg?hero";
import me3 from "../../assets-src/images/me3.jpg?hero";
import me4 from "../../assets-src/images/me4.jpg?hero";
import me1Frost from "../../assets-src/images/me1.jpg?frost";
import me2Frost from "../../assets-src/images/me2.jpg?frost";
import me3Frost from "../../assets-src/images/me3.jpg?frost";
import me4Frost from "../../assets-src/images/me4.jpg?frost";
import me1FrostLight from "../../assets-src/images/me1.jpg?frostlight";
import me2FrostLight from "../../assets-src/images/me2.jpg?frostlight";
import me3FrostLight from "../../assets-src/images/me3.jpg?frostlight";
import me4FrostLight from "../../assets-src/images/me4.jpg?frostlight";

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

const sizes = (w: number) =>
  `(min-aspect-ratio: 1767/1024) ${((w / 1024) * 100).toFixed(2)}vh, ${((w / 1767) * 100).toFixed(2)}vw`;

const photo = (
  id: string,
  [picture, frost, frostLight]: [Picture, string, string],
  alt: string,
  x: number,
  y: number,
  w: number,
  h: number,
): AboutPhoto => ({ id, picture, frost, frostLight, alt, x, y, w, h, sizes: sizes(w) });

/** In reveal order, top first. */
export const ABOUT_PHOTOS: AboutPhoto[] = [
  photo("me4", [me4, me4Frost, me4FrostLight], "Matthew standing in an alley by the dumpsters", 1326, 201, 331, 303),
  photo("me3", [me3, me3Frost, me3FrostLight], "Matthew in a grey hoodie against a brick wall", 1007.3, 293, 225, 299),
  photo("me1", [me1, me1Frost, me1FrostLight], "Matthew as a kid in the back of a car", 1432, 574, 225, 300),
  photo("me2", [me2, me2Frost, me2FrostLight], "Matthew smiling on a bus", 1007.3, 662, 331, 248),
];
