// The one place GSAP plugins are registered (spec §2). Import gsap from here
// everywhere else. All plugins ship in the public `gsap` package; never add a
// GreenSock auth token or private registry.
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Flip, Draggable, InertiaPlugin, DrawSVGPlugin, CustomEase, useGSAP);

if (import.meta.env.DEV) {
  // GSDevTools gives a scrubber for tuning timelines. Dev only, so it never
  // reaches the production bundle.
  import("gsap/GSDevTools").then(({ GSDevTools }) => gsap.registerPlugin(GSDevTools));
}

export { gsap, Flip, Draggable, InertiaPlugin, CustomEase, useGSAP };
