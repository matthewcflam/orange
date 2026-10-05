// Fonts first, before anything renders (spec §5.2).
import "@fontsource/fragment-mono";
import "@fontsource-variable/inter";
import "@fontsource/jersey-25";

import "./config/tokens.css";
import "./global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { preloadSounds } from "./audio/engine";
import { setTransitionRunner } from "./lib/router";
import { pageTransition } from "./transition/pageTransition";
import { GATE } from "./config/timings";
import { initScroll } from "./lib/scroll";
import { prefetchRoute } from "./lib/assets";

// Page theme changes fade (only visible on a deep link's gate exit; elsewhere
// they happen under the transition cover).
document.documentElement.style.setProperty("--theme-fade", `${GATE.DEEP_LINK_FADE}s`);

// The router owns scrolling (spec §4.3).
history.scrollRestoration = "manual";
initScroll();

// Fetch + decode every sound while the gate idles (spec §9.2). No AudioContext yet.
void preloadSounds();

setTransitionRunner(pageTransition);

// A deep link's images (About photos, project heroes) download while the gate idles.
prefetchRoute(location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
