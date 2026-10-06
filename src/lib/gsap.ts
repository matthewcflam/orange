// The one place GSAP plugins are registered (spec §2). Import gsap from here
// everywhere else. All plugins ship in the public `gsap` package; never add a
// GreenSock auth token or private registry. Draggable + InertiaPlugin are only
// used by the obstacle text, so they register in the Projects chunk
// (textflow/textFlow.ts) and stay out of the main bundle.
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(DrawSVGPlugin, useGSAP);

if (import.meta.env.DEV) {
  // GSDevTools gives a scrubber for tuning timelines. Dev only, so it never
  // reaches the production bundle.
  import("gsap/GSDevTools").then(({ GSDevTools }) => gsap.registerPlugin(GSDevTools));
}

export { gsap, useGSAP };
