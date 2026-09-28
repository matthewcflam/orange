// Fonts first, before anything renders (spec §5.2).
import "@fontsource/monofett";
import "@fontsource/megrim";
import "@fontsource-variable/newsreader";
import "@fontsource/fragment-mono";
import "@fontsource-variable/inter";

import "./config/tokens.css";
import "./global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { preloadSounds } from "./audio/engine";
import { setTransitionRunner } from "./lib/router";
import { palimpsest } from "./transition/palimpsest";

// The router owns scrolling (spec §4.3).
history.scrollRestoration = "manual";

// Fetch + decode every sound while the gate idles (spec §9.2). No AudioContext yet.
void preloadSounds();

// Every station-to-station navigation runs Palimpsest (spec §8).
setTransitionRunner(palimpsest);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
