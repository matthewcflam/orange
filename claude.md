# CLAUDE.md — Matthew Lam Portfolio

This file is the build spec for this repository. Read it fully before writing any code, and re-read the relevant section before starting each milestone.

The site is a personal portfolio whose navigation is a transit map. Its two defining qualities are **smooth, choreographed animation** and **fast, highly interactive sound design**. Every decision in this document serves those two goals. When in doubt, choose the option that keeps animation at 60fps and sound instant.

---

## 0. Before you write any code

1. **View every mockup in `design/mockups/`.** They are numbered in flow order. They are desktop frames at **1440 × 1024**; treat that as the reference viewport.
2. **Read `design/ASSETS.md`.** It is the source of truth for what each file in `assets-src/` is, which page it belongs to, and its role. If a filename in this document disagrees with the actual repo, the repo and `ASSETS.md` win.
3. **Inspect the SVGs in `assets-src/svg/`.** Check that layer IDs exist and that the "who?" drawing is made of stroked paths (see §8.2). Report any problems to the user rather than working around them silently.
4. **Check §15 (Open questions).** Do not invent answers to those questions. Build a clearly marked placeholder and keep going, or ask the user.
5. If a `assets-src/fonts/` folder exists, **ignore it.** Fonts are installed from npm (§5). Tell the user it can be deleted.

---

## 1. Tech stack (decided — do not substitute)

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite** | Fast dev server, hashed asset output, simple static deploy |
| UI | **React 19 + TypeScript (strict)** | Component model; `useGSAP` integration |
| App shape | **Single-page app** | One persistent `AudioContext` and one persistent transition overlay across all navigation. A full page load would destroy both. |
| Animation | **GSAP** (core + Flip, Draggable, InertiaPlugin, MotionPathPlugin, DrawSVGPlugin, CustomEase, GSDevTools in dev only) | Timeline control, scrubbing, plugins |
| Text reflow | **`@chenglou/pretext`** | Arithmetic text layout without DOM reflow; per-line widths for obstacle wrapping |
| Audio | **Custom engine on the raw Web Audio API** (no Howler, no Tone.js) | Procedural sound (noise, filter sweeps) and sample-accurate scheduling |
| Images | **`vite-imagetools`** | AVIF/WebP + responsive sizes generated at build time |
| Fonts | **Fontsource npm packages** | Self-hosted, hashed, cache-friendly (§5) |
| Routing | **Small custom router** (History API) | Route changes must happen *inside* the transition timeline, at the moment the screen is fully black. Off-the-shelf routers swap immediately. |

Do **not** use:
- The **View Transitions API** for Palimpsest. It is built for crossfades/morphs; Palimpsest has four choreographed phases that need a scrubbable timeline.
- The HTML **`<audio>` element** for sound effects. Its latency is unpredictable, especially on mobile.
- Animation libraries besides GSAP (no Framer Motion, no anime.js). One animation system, one ticker.

---

## 2. Installation

```bash
npm create vite@latest . -- --template react-ts
npm install gsap @gsap/react @chenglou/pretext
npm install @fontsource/monofett @fontsource/megrim @fontsource-variable/newsreader @fontsource/fragment-mono @fontsource-variable/inter
npm install -D vite-imagetools
```

### GSAP licensing gotcha
All GSAP plugins, including formerly paid "Club" plugins (DrawSVG, MorphSVG, SplitText, Inertia), are **free and included in the public `gsap` npm package**. Import them as `gsap/DrawSVGPlugin`, `gsap/InertiaPlugin`, etc.
- Do **not** create an `.npmrc` with a GreenSock auth token.
- Do **not** use the private `npm.greensock.com` registry.
- Instructions saying otherwise are outdated.

Register every plugin exactly once, in `src/lib/gsap.ts`, and import `gsap` from that module everywhere else:

```ts
// src/lib/gsap.ts
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Flip, Draggable, InertiaPlugin, MotionPathPlugin, DrawSVGPlugin, CustomEase, useGSAP);

if (import.meta.env.DEV) {
  // GSDevTools gives a scrubber for tuning timelines. Dev only.
  import("gsap/GSDevTools").then(({ GSDevTools }) => gsap.registerPlugin(GSDevTools));
}

export { gsap, Flip, Draggable, InertiaPlugin, CustomEase, useGSAP };
```

### Pretext API gotcha
Pretext is young and its API has changed between versions. **Before writing the text-wrap code, read `node_modules/@chenglou/pretext/README.md` and its `.d.ts` type files** to confirm the exact function names and signatures. The functions this spec expects are:
- `prepare(text, font)` / `prepareWithSegments(text, font)` — one-time measurement.
- `layout(prepared, maxWidth, lineHeight)` — returns `{ height, lineCount }`.
- `layoutWithLines(prepared, maxWidth, lineHeight)` — returns every line at one fixed width.
- A **variable-width, cursor-based** function (expected name `layoutNextLine`) that lays out one line at a time with a different `maxWidth` per line, returning the line and the next cursor. **This is the function the obstacle wrap depends on.** If its name or signature differs, adapt to what the package actually exports.

---

## 3. Project structure

```
portfolio/
├── CLAUDE.md
├── design/                      # reference only — never imported by the app
│   ├── mockups/                 # numbered PNG frames, flow order
│   └── ASSETS.md                # manifest: file → page → role → notes
├── assets-src/                  # full-quality originals, imported via vite-imagetools
│   ├── svg/
│   └── images/{oyster-news,mango,portfolio}/
├── public/
│   └── sounds/                  # final audio files (.m4a); may be empty early on
└── src/
    ├── main.tsx                 # font imports, global CSS, mounts <App/>
    ├── App.tsx                  # layer stack (§4)
    ├── config/
    │   ├── timings.ts           # EVERY duration/delay/ease constant lives here
    │   ├── tokens.css           # colors, font stacks, spacing
    │   ├── routes.ts            # route table + station metadata
    │   └── sounds.ts            # sound manifest (§9.6)
    ├── lib/
    │   ├── gsap.ts
    │   ├── router.ts            # custom router (§4.3)
    │   ├── assets.ts            # preload/decode helpers, hover prefetch
    │   └── fonts.ts             # font readiness gate (§5.4)
    ├── audio/
    │   ├── engine.ts            # AudioContext singleton, buses, playback
    │   ├── procedural.ts        # spray noise, tunnel rumble, placeholders
    │   └── useSound.ts          # React hook wrapper
    ├── gate/                    # landing page / audio gate (§6)
    │   ├── Gate.tsx
    │   └── paintOver.ts         # brush-mask paint animation
    ├── transit/
    │   ├── TransitMap.tsx       # one component, two layouts: "full" and "mini"
    │   └── stations.ts
    ├── transition/
    │   ├── TransitionOverlay.tsx  # persistent full-screen canvas + black layer
    │   └── palimpsest.ts          # the timeline factory (§8)
    ├── spray/
    │   └── sprayEngine.ts       # canvas spray renderer (§7.2)
    ├── textflow/
    │   ├── ObstacleText.tsx     # Pretext-driven paragraph
    │   ├── obstacles.ts         # circle + alpha-mask shapes
    │   └── justify.ts
    └── pages/
        ├── Home.tsx
        ├── ProjectLayout.tsx    # shared shell for project pages
        ├── projects/{OysterNews,Mango,Portfolio}.tsx
        └── placeholders/{About,Experience,Unknown,Inspo}.tsx
```

**All timing values go in `src/config/timings.ts`.** The user will tune them repeatedly; they must never be scattered through components.

---

## 4. Architecture

### 4.1 Layer stack (bottom to top, fixed z-order)

| z | Layer | Persistent? | Contents |
|---|---|---|---|
| 0 | **Page layer** | No — swaps per route | Current page content |
| 10 | **Shared chrome** | Yes | "Matthew Lam (wip)" name block (visible on gate and home only), mute toggle |
| 20 | **Transit map** | Yes | Single `TransitMap` instance; morphs between `full` (home) and `mini` (all other pages) via GSAP Flip |
| 30 | **Transition overlay** | Yes | Full-screen canvas for word stacking + black "tunnel" layer + light-bleed layer. `pointer-events: none` except while a transition runs |
| 40 | **Gate** | Until dismissed | Landing page (§6) |

The name block and transit map are **rendered once** and never unmounted, so they can stay perfectly still (or morph) while pages swap beneath them. This is what makes transitions feel continuous.

### 4.2 Singletons
These must exist exactly once per page session:
- `AudioContext` (via `audio/engine.ts`)
- The transition overlay and its canvas
- The router

**React StrictMode gotcha:** in development, StrictMode runs effects twice. If you create the `AudioContext`, register a Draggable, or start a timeline in a plain `useEffect`, you will get two contexts, double sounds, and duplicated animations — only in dev, which makes it confusing. Rules:
- Create singletons at **module level** (lazily, guarded), never inside effects.
- Use `useGSAP()` (from `@gsap/react`) for all component-scoped animations; it reverts them on cleanup automatically.
- Every `Draggable.create()` must be `kill()`ed in cleanup.

### 4.3 Router
Minimal custom router in `lib/router.ts`:
- State: `currentRoute`, `pendingRoute`, `isTransitioning`.
- `navigate(to)`: if `to === currentRoute` or a transition is running, do nothing. Otherwise run the Palimpsest timeline; the timeline calls `commitRoute(to)` (which does `history.pushState` and swaps the page) at the moment the screen is fully black.
- `popstate` (back/forward buttons) also runs Palimpsest, using `replace` semantics instead of push.
- Expose a `useRoute()` hook.

### 4.4 Routes

| Path | Page | Station |
|---|---|---|
| `/` | Home (full transit map) | — |
| `/about` | Placeholder | About |
| `/experience` | Placeholder | Experience |
| `/projects` | Redirects to `/projects/oyster-news` | Projects |
| `/projects/oyster-news` | Oyster News | Projects |
| `/projects/mango` | Mango | Projects |
| `/projects/portfolio` | Portfolio | Projects |
| `/unknown` | Placeholder (the "???" station) | ??? |
| `/inspo` | Placeholder | Inspo |

Station order along the line, left to right: **About → Experience → Projects → ??? → Inspo.** Experience sits on the upper track; the line descends diagonally from Experience to Projects, then runs along the lower track (see home mockup).

Placeholder pages use the project page shell (mini map top-left) with a centered "Coming soon" label, so Palimpsest can be tested against every station.

---

## 5. Fonts

### 5.1 The five fonts

| Use | Font | Package | CSS family name |
|---|---|---|---|
| "SOUND" option on gate | Monofett | `@fontsource/monofett` | `"Monofett"` |
| "Muted" option on gate | Megrim | `@fontsource/megrim` | `"Megrim"` |
| "Matthew Lam" name | Newsreader (variable) | `@fontsource-variable/newsreader` | `"Newsreader Variable"` |
| Station labels on transit map | Fragment Mono | `@fontsource/fragment-mono` | `"Fragment Mono"` |
| Body text, project titles, UI, Palimpsest heavy words | Inter (variable) | `@fontsource-variable/inter` | `"Inter Variable"` |

All five are open-licensed (SIL OFL) Google Fonts, fine for web use.

### 5.2 Imports
In `src/main.tsx`, before anything else renders:

```ts
import "@fontsource/monofett";
import "@fontsource/megrim";
import "@fontsource-variable/newsreader";
import "@fontsource/fragment-mono";
import "@fontsource-variable/inter";
```

Vite copies the `.woff2` files into the build output with hashed filenames, so paths never break on deploy and files can be cached long-term. Fontsource splits each font by character set (latin, latin-ext, cyrillic…) with `unicode-range`, so browsers download only what the text uses.

### 5.3 Font tokens
In `src/config/tokens.css`:

```css
:root {
  --font-body:    "Inter Variable", system-ui, sans-serif;
  --font-name:    "Newsreader Variable", Georgia, serif;
  --font-station: "Fragment Mono", ui-monospace, monospace;
  --font-sound:   "Monofett", monospace;
  --font-muted:   "Megrim", sans-serif;
}
```

### 5.4 Font gotchas — read all of these

1. **Variable font family names have a " Variable" suffix.** The variable packages register `"Inter Variable"` and `"Newsreader Variable"`, not `"Inter"` / `"Newsreader"`. Using the short name silently falls back to a system font.
2. **Pretext font strings must match exactly.** The string passed to Pretext's `prepare()` must be the same font the DOM renders, e.g. `'400 16px "Inter Variable"'`. A mismatch makes Pretext measure with a fallback font and the obstacle wrapping will be subtly wrong (lines overflow or leave gaps). Build the Pretext font string from the **same constants** that produce the CSS, never type it twice.
3. **Never measure before fonts load.** Call Pretext `prepare()` only after the font is loaded (see gate below). If fonts change after preparing, re-prepare.
4. **Font swap mid-animation.** Fontsource uses `font-display: swap`, which shows a fallback then swaps. On this site a swap could land mid-animation or after text has been measured. So the app waits for fonts before showing the gate:

```ts
// src/lib/fonts.ts
export async function waitForFonts(timeoutMs = 2000) {
  await Promise.race([
    Promise.all([
      document.fonts.load('1em "Monofett"'),
      document.fonts.load('1em "Megrim"'),
      document.fonts.load('1em "Newsreader Variable"'),
      document.fonts.load('1em "Fragment Mono"'),
      document.fonts.load('400 16px "Inter Variable"'),
      document.fonts.load('900 16px "Inter Variable"'), // Palimpsest heavy weight
    ]),
    new Promise((r) => setTimeout(r, timeoutMs)), // never hang on a failed font
  ]);
}
```

   The gate fades in (short, ~300ms) once this resolves. The landing page is mostly white space, so the brief wait reads as intentional.
5. **Locally installed fonts hide broken web fonts.** If the developer's machine has any of these fonts installed (Inter is common), the browser may use the local copy when the web font fails, so the site looks perfect locally and broken for everyone else. Verify in Chrome DevTools → Elements → select text → Computed → **"Rendered Fonts"** must say **"Network resource"**, not "Local file". Include this in the deploy checklist (§13).
6. **Filename case sensitivity.** macOS treats `Mango.png` and `mango.png` as the same file; the Linux servers most hosts use do not. Keep **every** asset filename lowercase-with-hyphens, and match case exactly in imports. Fontsource handles its own files; this applies to everything in `assets-src/`.

---

## 6. Landing page (the audio gate)

Mockup: `design/mockups/01-landing.png` (confirm the actual filename).

### 6.1 Purpose
Browsers block audio until the user interacts with the page. The gate's click is that interaction. Everything after it, including the "who?" spray hiss, can play sound.

### 6.2 Layout (at 1440 × 1024)
- White background.
- "Matthew Lam" in Newsreader, ~34px, at roughly (104, 490). Directly below it, the orange hand-drawn "(wip)" (asset in `assets-src/svg/`, check `ASSETS.md`). **This name block lives in the shared chrome layer (z 10)** because it stays in exactly the same position on the home page.
- Bottom-left, two options stacked:
  - "SOUND" in Monofett (~40px) at roughly (100, 820).
  - "Muted" in Megrim (~40px) directly below.
- A `>` selection cursor sits to the left of the focused option.

### 6.3 Interaction
- Mouse hover or **arrow keys up/down** move the `>` to that option (quick GSAP slide, ~120ms, `power2.out`).
- **Click or Enter/Space** selects.
- Default focus: the option saved in `localStorage` key `pref.sound` (`"sound"` | `"muted"`); if none, "SOUND".
- The options must be real `<button>` elements (keyboard and screen-reader accessible), styled to match the mockup.
- **No hover sounds on the gate.** They cannot play before a user gesture. The first sound the user hears is their own selection click, so make that sound satisfying.

### 6.4 Audio unlock — critical details
The context is created and all sounds are fetched and decoded **before** the click, while the page idles on the gate. `decodeAudioData` works on a suspended context. Then:

```ts
function onSelect(choice: "sound" | "muted") {
  // MUST be the first thing in the handler, synchronous, before any await.
  audio.unlock({ muted: choice === "muted" });
  localStorage.setItem("pref.sound", choice);
  audio.play("gate.select");
  runGateToHome(choice);
}
```

- **`ctx.resume()` must be called synchronously inside the click/keydown handler.** Safari only honours the unlock if it happens in the same synchronous call stack as the gesture. Any `await` before `resume()` can break it.
- **Resume the context even when "Muted" is chosen**, and set master gain to 0. Otherwise unmuting later has no running context. (The mute toggle click is also a gesture, but don't rely on that.)
- The gate appears **on every fresh page load**, including deep links (e.g. someone opens `/projects/mango` directly). Browsers require a new gesture each load. After the gate, the user lands on the route they requested (see §15 open question on the deep-link animation).

### 6.5 Gate → Home animation
All values live in `timings.ts`. Times are seconds from the click.

| Time | Event |
|---|---|
| 0.00 | Selection click sound |
| 0.00 | Grey square A begins painting over the gate options |
| 0.25 | Grey square B begins painting (overlaps A) |
| 0.50 | Gate options fully covered → remove gate layer (`autoAlpha: 0` on gate content) |
| 0.60 | Transit route line fades in (0.6s, `power2.out`) |
| 0.70 | Stations fade in, staggered **left to right** (About → Inspo), 0.08s apart, with a 6px upward settle |
| 0.80 | Station labels fade in, same stagger |
| 1.00 | Green smiley fades in (0.8s) |
| 2.00 | "who?" spray begins (§7.2) |

The 2.0s is **measured from the click** (user-confirmed assumption; keep it a single constant, `GATE.WHO_DELAY`). If the user changes it to "2s after the stations finish", the timeline position becomes `">+2"`.

Sketch:

```ts
export function gateToHome(choice: "sound" | "muted") {
  const tl = gsap.timeline();
  tl.add(paintSquare(squareA), 0)
    .add(paintSquare(squareB), T.GATE.SQUARE_B_OFFSET)
    .set(gateOptions, { autoAlpha: 0 }, T.GATE.OPTIONS_HIDE)
    .to(route, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, T.GATE.ROUTE_IN)
    .from(stationDots, { autoAlpha: 0, y: 6, stagger: 0.08, duration: 0.4 }, T.GATE.STATIONS_IN)
    .from(stationLabels, { autoAlpha: 0, stagger: 0.08, duration: 0.4 }, T.GATE.LABELS_IN)
    .to(smiley, { autoAlpha: 1, duration: 0.8 }, T.GATE.SMILEY_IN)
    .add(() => spray.play("who"), T.GATE.WHO_DELAY);
  return tl;
}
```

### 6.6 Paint-over technique (grey squares)
A fade or straight wipe will not read as paint. Each grey square (`#D9D9D9`, positions from the home mockup: two overlapping rectangles bottom-left, roughly (92, 738, 289×152) and (159, 800, 289×152)) is revealed through a **brush-stroke mask**:

1. For each square, define 3–4 thick (~60–80px) overlapping zigzag stroke paths that together fully cover it, like a roller going back and forth.
2. Give the strokes rough, bristly edges with an SVG filter: `feTurbulence` (fractal noise, baseFrequency ~0.04, 2 octaves) → `feDisplacementMap` (scale ~8–12).
3. Use the stroked paths (white on black) as an SVG `<mask>` on the grey `<rect>`.
4. Animate each stroke with DrawSVG (`drawSVG: "0%" → "100%"`), strokes staggered so they overlap. Total per square ≈ 0.45s.
5. Once a square is fully painted, **swap the masked version for a plain solid rect** so the filter stops costing anything.

Sound: a wet roller swish per stroke (`paint.stroke`, 3–4 variants, randomized pitch).

**Stroke ends:** make sure the final stroke overshoots the square's edges so no unpainted corner remains. Test at several viewport sizes.

---

## 7. Home page

Mockup: `design/mockups/02-home.png`.

### 7.1 Layout
- Transit map, **full** layout, spanning the top half:
  - Blue route line (≈`#0A64E0`, ~8px stroke). Upper track at y≈205 from x=0 to Experience (x≈420); diagonal down to Projects (x≈686, y≈365); lower track continues to the right edge.
  - Station dots: white fill, blue ring, r≈11px. About (92, 205), Experience (420, 205), Projects (686, 365), ??? (1022, 365), Inspo (1323, 365).
  - Labels in Fragment Mono ~34px: "About" below its dot, "Experience" above its dot, "Projects", "???", "Inspo" below theirs.
- Green hand-drawn smiley top-right (asset SVG, ≈`#45B052`).
- Name block (shared chrome) at the same position as on the gate.
- The two grey squares bottom-left (left painted from the gate transition; on later visits to home they are simply present).
- The orange "who?" spray, center-right (≈ x 490–1400, y 560–800).

Sample exact colors from the mockups; the values here are approximations. Put final values in `tokens.css`.

**Build the transit map in code (SVG), not from an exported image.** It animates and changes state.

### 7.2 "who?" spray engine
The "who?" drawing ships as an SVG of **stroked paths in drawing order** (`assets-src/svg/who-spray.svg`, IDs per `ASSETS.md`). The paths are guides only; they are not displayed.

Rendering, on a `<canvas>` sized to the spray area:
1. **Handle device pixel ratio**: canvas backing size = CSS size × `devicePixelRatio`, then `ctx.scale(dpr, dpr)`. Otherwise it looks blurry on retina screens.
2. Load the SVG paths into hidden `<path>` elements (or `Path2D` + a length table) and read `getTotalLength()` / `getPointAtLength()`.
3. A GSAP timeline tweens a `progress` value per stroke (0 → length). Ease each stroke like a hand gesture (`power1.inOut`), with 80–150ms pauses between strokes (the can lifts off).
4. Each frame, step from the previous point to the current point in small increments (≤2px) so fast moves don't leave gaps. At each step, stamp **30–80 dots** in a Gaussian scatter around the point:
   - Core: dense, small radius (σ ≈ 4px), high alpha.
   - Overspray: sparse, wide radius (σ ≈ 14px), low alpha.
   - Occasional larger "spit" droplet (~1 in 40 stamps).
   - Density scales **inversely with speed**: slow = heavier paint.
5. Stamp onto the canvas and **never clear it** during the spray; paint accumulates.
6. Optional polish: at stroke ends where the nozzle lingers, spawn 1–2 slow drips (thin vertical lines growing downward over ~1s).
7. Color: the orange token (≈`#FF7A00`), with per-dot alpha variation.

Keep the particle math outside React. The engine is a plain class; React only mounts the canvas.

**Sound coupling (important):** the spray hiss is procedural (§9.4) and its gain is driven by the **same nozzle-speed value** as the particles, every frame. When a stroke lifts, the hiss cuts; it resumes on the next stroke. A short can-rattle sample (`spray.rattle`) plays ~250ms before the first stroke. This tight sync is what makes the effect feel physical.

**When does "who?" respray?** On first arrival after the gate: yes, at `WHO_DELAY`. On later returns to home via Palimpsest: respray it, faster (duration × 0.6), starting right after the tunnel exit completes. (See §15 — confirm with the user.)

**Reduced motion:** draw the finished spray instantly (render all stamps in one frame), no hiss.

### 7.3 Station interactions (home and mini map)
- **Hover**: dot scales to 1.25 (`back.out`), `station.hover` tick sound (quiet, pitch varies by station index so moving along the line sounds like a scale).
- **Hover also prefetches** that station's page assets (§10.3).
- **Click**: runs Palimpsest (§8). Clicking the current station does nothing.
- Stations are `<button>`s (or links with `href` for proper semantics, click intercepted by the router).

---

## 8. Palimpsest (station-to-station transition)

Mockups: `03-transition-1.png` → `04-transition-2.png` → `05-transition-3.png` (confirm names).

### 8.1 Phases
All values in `timings.ts`; a full run should feel quick, roughly 2.5–3s including the tunnel.

| Phase | Time (s) | What happens | Sound |
|---|---|---|---|
| 1. Dot | 0.00–0.38 | Clicked station dot fills white → yellow (≈`#F5B700`), scale 1 → 1.6 (`back.out(3)`, 0.18s) → 1 (0.2s) | `station.click` chime |
| 2. Stack | ~0.30–1.20 | The station name in **Inter Variable weight 900**, huge, stacks up in repeated copies until the screen is nearly black | `palimpsest.thud` per copy, pre-scheduled |
| 3. Seal | ~1.20–1.35 | Black layer fades to opacity 1 over the canvas, guaranteeing 100% black | — |
| 4. Swap | at black | `commitRoute(next)`: push history, mount new page underneath, morph transit map layout if needed | Rumble begins, filtered low |
| 5. Wait | 0 to 3s max | `await` next page's images (`img.decode()`) and fonts. Usually instant thanks to hover prefetch | Rumble continues |
| 6. Tunnel exit | 1.1s | Black layer slides left (`xPercent: -100`, `expo.inOut`), revealing the new page | Lowpass sweep ~300 Hz → ~10 kHz as it slides |

Sketch:

```ts
export function palimpsest(from: Route, to: Route, clickedDot: SVGElement) {
  lockInput();
  const tl = gsap.timeline({ onComplete: unlockInput });
  tl.to(clickedDot, { fill: YELLOW, scale: 1.6, duration: 0.18, ease: "back.out(3)", transformOrigin: "50% 50%" })
    .to(clickedDot, { scale: 1, duration: 0.2 })
    .add(stackWords(to.label), "-=0.1")
    .to(blackLayer, { opacity: 1, duration: 0.15 })
    .add(() => commitRoute(to))
    .add(waitFor(preloadRoute(to), 3000))  // pauses the timeline until resolved
    .to(tunnel, { xPercent: -100, duration: 1.1, ease: "expo.inOut" })
    .from(lightBleed, { opacity: 0.6, duration: 0.8 }, "<0.2")
    .from(pageRoot, { scale: 1.04, duration: 1.1, ease: "expo.out" }, "<");
  return tl;
}
```

Implement `waitFor` by pausing the timeline and resuming when the promise resolves (or the timeout hits).

### 8.2 Word stacking (Phase 2) — performance-critical
From the mockups: copies of the word appear one after another, each offset vertically (~150px apart at first), overlapping, then accelerate and fill in until the frame is almost solid black (the Transition 3 frame shows the dense state).

**Do not create dozens of DOM nodes of 400px black text.** The browser rasterizes each huge text layer separately, which causes dropped frames. Instead:
1. Render the word **once** to an offscreen canvas at the needed size (font-size chosen so the word spans the viewport width; Inter 900; black).
2. On the overlay canvas, `drawImage` that bitmap repeatedly at successive offsets. 12–20 copies, with intervals shrinking (e.g. 90ms → 30ms) so the stack accelerates.
3. Copies spread both downward and upward from the first so coverage fills the whole frame.
4. Phase 3's black layer seals any gaps; the text never covers every pixel on its own.

Handle DPR on this canvas too.

### 8.3 Tunnel exit (Phase 6)
A hard-edged black panel sliding left looks like a wipe. Three details sell the tunnel:
1. The black layer's **trailing (right) edge is a soft gradient** (~15vw from black to transparent), not a hard line.
2. A **white light-bleed overlay** starts at ~0.6 opacity and fades to 0, like eyes adjusting to daylight. **Animate an overlay's opacity; do not animate CSS `filter: brightness()` on the page** (full-page filters are expensive).
3. The new page settles from `scale: 1.04` to `1`.

### 8.4 Transit map morph
The home page shows the map `full`; every other page shows it `mini` in a grey card top-left (≈ `#D9D9D9` card, ~381×157px, with a darker ≈`#7A6E6E` border on the right and bottom, see project mockups). Current station's dot is yellow/orange.

Use **GSAP Flip**: capture state, toggle the layout class/props, `Flip.from(state, …)`. Do the morph while the screen is black (Phase 4) so the user sees the result as the tunnel opens. Mini-map stations are clickable and run Palimpsest too.

### 8.5 Guards
- Ignore all navigation input while a transition runs (`lockInput`).
- Back/forward during a transition: queue the latest request and run it after.
- If the tab is hidden mid-transition, let GSAP complete (it will catch up); don't leave the overlay stuck black. Add a safety: if the overlay is black for >5s, force-reveal.

---

## 9. Sound engine

### 9.1 Graph

```
sources ─┬─> ui bus ─────────┐
         ├─> transition bus ─┼─> master gain ─> DynamicsCompressor (limiter) ─> destination
         └─> ambient bus ────┘
```

- `new AudioContext({ latencyHint: "interactive" })`, created lazily at module level (singleton, see StrictMode gotcha §4.2).
- Limiter settings: threshold −6 dB, ratio 20, attack 0.003, release 0.1. It keeps spam-clicking from clipping.
- Master gain 0 when muted. Mute changes ramp over 50ms (`setTargetAtTime`) to avoid clicks.

### 9.2 Loading
- On app start (while the gate is showing), fetch every file in the sound manifest and `decodeAudioData` into `AudioBuffer`s. This works while the context is suspended.
- Playback = new `AudioBufferSourceNode` per play; they are cheap and one-shot by design.

### 9.3 Playback features
`audio.play(id, opts?)` where opts can include `when` (context time), `gain`, `rate`, `pan`.
- **Variation**: randomize playbackRate ±4–6% and gain ±10% per play, and round-robin through variants (`paint.stroke.1..4`). Prevents the repetitive "machine gun" effect.
- **Voice limits**: per-sound cap (e.g. 4). When exceeded, fade out (10ms) and stop the oldest.
- **Scheduling**: for anything rhythmic (Palimpsest thuds), compute all times from `ctx.currentTime` at timeline start and schedule them upfront with `source.start(when)`. GSAP callbacks fire on animation frames and can drift ~16ms, which is fine for one-off clicks but audible in a rhythm.
- **Tab hidden**: `ctx.suspend()` on `visibilitychange` hidden, `resume()` on visible.

### 9.4 Procedural sounds (`audio/procedural.ts`)
- **Spray hiss**: a looping 2s white-noise `AudioBuffer` → highpass ~1.5 kHz → bandpass ~4.5 kHz (Q ≈ 0.8) → gain. The gain is set every frame from nozzle speed with `setTargetAtTime(value, now, 0.015)` so it follows smoothly without zipper noise.
- **Tunnel rumble**: brown/pink noise (or a sample, if provided) → lowpass. Cutoff starts ~300 Hz during the black screen and sweeps exponentially to ~10 kHz over the tunnel-exit duration (`exponentialRampToValueAtTime`), while gain fades out at the end. The muffled-to-open sweep is the audio version of exiting a tunnel.

### 9.5 Placeholder sounds
Real sound files may not exist yet. For every manifest entry whose file is missing, the engine must fall back to a **synthesized placeholder** (short oscillator blip or noise burst with a distinct pitch per ID) and log a single dev-only warning. This keeps timing audible during development. Swapping in real files later must require **no code changes**, only adding the file.

### 9.6 Sound manifest (`src/config/sounds.ts`)
Files go in `public/sounds/` as **`.m4a` (AAC)**, which plays in every major browser.

| ID | Trigger | Notes |
|---|---|---|
| `gate.select` | SOUND/Muted chosen | The first sound anyone hears; make it good |
| `gate.cursor` | `>` moves (only after unlock, e.g. revisiting settings) | Very quiet |
| `paint.stroke` (×4 variants) | Each paint-over stroke | Wet roller swish |
| `spray.rattle` | Before first spray stroke | Can shake |
| `spray.hiss` | Procedural | §9.4 |
| `station.hover` | Hover a station | Pitch by station index |
| `station.click` | Click a station | Chime |
| `palimpsest.thud` (×3 variants) | Each stacked word | Pre-scheduled |
| `palimpsest.rumble` | Swap + tunnel | Procedural fallback allowed |
| `drag.grain` | Dragging an obstacle | Looping; gain = drag velocity |
| `text.tick` | Reflow changes the line count | Very quiet, voice-limited to 2 |
| `project.select` | Choosing a project in the right-hand list | |
| `link.hover` | Hover external link | |
| `mute.toggle` | Toggling sound | Plays on unmute only |

### 9.7 Audio gotchas
- `resume()` synchronously in the gesture handler (§6.4).
- Resume even when muted (§6.4).
- Never use `<audio>` for effects.
- **iPhone silent switch mutes Web Audio.** Nothing to fix in code; mention it in the mute toggle's tooltip if a tooltip exists.
- Don't create `AudioContext`s per component or per sound; one only.
- Don't reuse an `AudioBufferSourceNode`; they are single-use.

### 9.8 Mute toggle
A small persistent control in the shared chrome layer. Position isn't in the mockups (§15); use bottom-left in Fragment Mono ("sound on / off") as a placeholder. Persists to `pref.sound`. Keyboard shortcut `M`.

---

## 10. Project pages

Mockups: `06-projects-portfolio.png`, `07-projects-mango.png`, `08-projects-oyster-news.png` (confirm names).

### 10.1 Shared shell (`ProjectLayout.tsx`)
At 1440 × 1024:
- Mini transit map card top-left (§8.4).
- Center column, x ≈ 420–1020 (~600px wide):
  - Hero media block(s), rounded corners (~24–28px radius).
  - Body paragraph, **Inter ~16px, line-height ~19px, justified**, in an `ObstacleText` component (§11).
  - "Date: Aug. 2026 - Sept. 2026" line below, left-aligned, ~60px under the body.
- Right column (x ≈ 1120): project list in Inter ~36px: "Oyster News", "Mango", "Portfolio". The active project gets an **orange hand-drawn ellipse** around it (SVG asset; animate in with DrawSVG, ~0.5s, when the page appears or the selection changes). On the Portfolio page the mockup shows a squiggle underline instead; check `ASSETS.md`.
- Bottom-right: external link in Inter semibold (e.g. `https://oysternews.xyz/`) with an orange hand-drawn underline stroke. Hover: underline redraws, `link.hover` sound.

Switching between projects via the right-hand list is **not** a station change, so it should **not** run full Palimpsest (§15 asks what it should be). Placeholder: the center column crossfades (0.35s out / 0.45s in, slight 8px vertical offset), the ellipse redraws on the new item, `project.select` sound.

### 10.2 Page specifics
- **Oyster News**: two hero images (world news map, then Vancouver news map). Draggable **orange-red circle** (≈`#D9503A`, diameter ≈ 44px, check mockup) inside the body text; text wraps around it (§11). Floating **design artifacts** around the page edges (the tilted "VERY important headline" card, the large "News" wordmark, the Oyster logo top-right, etc.): animate only `transform`/`opacity`; add a subtle mouse parallax (max ~12px, different depth per artifact, smoothed with `gsap.quickTo`). More artifacts will be added later; build the positions from a data array so adding one is a one-line change. Placeholder slots per `ASSETS.md`.
- **Mango**: hero image(s) per `ASSETS.md`. Draggable **mango** image (transparent PNG) inside the body text; text wraps around its **actual shape** (§11.4).
- **Portfolio**: overlapping grey and orange circles as the hero (build in CSS/SVG). The mockup body text shows wrap gaps but no visible obstacle; see §15.

### 10.3 Images (`vite-imagetools`)
- Import originals from `assets-src/images/...` with imagetools query params to generate **AVIF + WebP at 1×/2× sizes**, and render `<picture>` with `srcset`/`sizes`.
- Hero images: `fetchpriority="high"` on the first one of each page; everything else `loading="lazy"`.
- `lib/assets.ts` exposes `preloadRoute(route)`, which creates `Image` objects for the route's above-the-fold images and awaits `img.decode()`. Called on **station hover** (prefetch) and awaited in Palimpsest Phase 5.
- Never pre-compress originals; the pipeline does it.

---

## 11. Obstacle text (Pretext)

### 11.1 Behaviour
The body paragraph on Oyster News and Mango has a draggable obstacle. As the user drags it, the text reflows around it in real time, leaving a gap on each line the obstacle touches (see the mockups: lines split into a left and right part around the circle).

### 11.2 Algorithm
Once, after fonts are ready (§5.4):
- `prepareWithSegments(text, FONT_STRING)` per paragraph. Cache the result.

Per frame, only when the obstacle moved (throttled to `requestAnimationFrame`):
1. Walk down the text box one line-height at a time. Line `i` occupies the band `[top + i·lh, top + (i+1)·lh]`.
2. For each band, ask the obstacle for its **horizontal blocked interval** in that band (plus padding, ~10px each side). No overlap → one slot, full width.
3. Overlap → up to two slots: left `[0, blockStart]` and right `[blockEnd, width]`. Drop a slot narrower than ~40px (too narrow to hold a word; let the text skip it).
4. Fill each slot in order with the variable-width line function (`layoutNextLine` or equivalent, §2), carrying the cursor forward from slot to slot and line to line.
5. Continue until the text is exhausted. The resulting height may change; update the container height.

### 11.3 Rendering
- A **pool of absolutely positioned `<span>`s**, reused between frames. Position via `transform: translate(x, y)` only. Only write to spans whose text or position changed.
- **Justification** (the mockups are justified): for each line fragment, compute extra space = slot width − natural width, divide across the word gaps, and apply it as `word-spacing` on that span. **Do not justify** the last line of a paragraph, or a fragment that ends a paragraph; otherwise you get the stretched "Or   TikTok.   Some   go" line that appears in the mockups (that's a Figma artifact, not the design intent — confirm in §15).
- Also leave a fragment unjustified if the required spacing would exceed ~3× a normal space; left-align it instead.
- **Accessibility**: the visible spans are `aria-hidden="true"`. A visually hidden (not `display:none`) real `<p>` holds the full text for screen readers, search engines, and copy/paste.
- Recompute on container resize (`ResizeObserver`), debounced to one frame.

### 11.4 Obstacle shapes (`obstacles.ts`)
Common interface: `blockedInterval(bandTop, bandBottom): [start, end] | null`.
- **Circle** (Oyster News): for the band, find the y inside the band closest to the circle's center, `dy`; if `|dy| < r`, half-width = `√(r² − dy²)` → interval `[cx − hw, cx + hw]`.
- **Alpha mask** (Mango): on load, draw the mango PNG to an offscreen canvas at its display size, read the pixels once, and build a per-row table of the leftmost and rightmost pixel with alpha > 32. For a band, take the min left / max right over the rows the band covers, offset by the mango's current position. Rebuild the table if the display size changes.

### 11.5 Dragging
- GSAP `Draggable` (type `"x,y"`) with `inertia: true` (InertiaPlugin) so a flicked obstacle glides and settles while the text keeps reflowing.
- Bounds: the text container (the obstacle can't leave it).
- `onDrag` / `onThrowUpdate` → request a reflow for the next frame.
- Cursor: `grab` / `grabbing`. Touch works via Draggable; set `touch-action: none` on the obstacle.
- Sound: `drag.grain` loop, gain = smoothed velocity; `text.tick` when the total line count changes.
- Keyboard: when focused, arrow keys nudge the obstacle 10px (Shift = 40px).

---

## 12. Performance rules (non-negotiable)

1. Animate only `transform` and `opacity`. Exceptions: SVG stroke drawing (DrawSVG) and the paint-mask strokes during their short run.
2. No layout reads (`getBoundingClientRect`, `offsetHeight`) inside pointer, scroll, or animation-frame handlers. Measure once, cache, invalidate on resize.
3. Many particles or copies → **canvas**, never DOM.
4. All canvases handle `devicePixelRatio`.
5. No full-page CSS `filter` animations; use overlays.
6. All loading hides behind the black screen or behind the gate.
7. `will-change: transform` only on elements that are actually animating, removed afterward.
8. Target: 60fps on a mid-range laptop during Palimpsest and while dragging. Check with Chrome DevTools Performance panel (CPU 4× slowdown) before calling a milestone done.

### Reduced motion (`prefers-reduced-motion: reduce`)
- Palimpsest collapses to a 250ms crossfade to black and back (keep the click sound).
- Spray draws instantly.
- Paint-over becomes a 200ms fade.
- Parallax off; inertia off (the obstacle still drags).

---

## 13. Deployment

- Static SPA build (`npm run build` → `dist/`). Vercel or Netlify both work.
- **SPA fallback gotcha**: deep links like `/projects/mango` will **404 on a static host** unless every path is rewritten to `index.html`. Add the host's rewrite config:
  - Vercel: `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
  - Netlify: `public/_redirects` → `/*  /index.html  200`
- Cache headers: hashed assets (`/assets/*`) → `Cache-Control: public, max-age=31536000, immutable`. `index.html` → no-cache.

### Deploy checklist (run on the deployed URL, not localhost)
1. **Rendered fonts**: DevTools → Elements → Computed → "Rendered Fonts" shows **"Network resource"** for all five fonts (§5.4, gotcha 5).
2. **Network → Font filter**: every font is a `.woff2` with status 200.
3. **Test on a phone** (no locally installed fonts, real Safari audio rules).
4. Deep link directly to `/projects/mango` in a fresh tab: gate appears, then Mango loads. No 404.
5. Choose SOUND on the gate in **Safari**: the select sound plays. Choose Muted, then unmute: sounds play without reloading.
6. No console errors; no 404s in the Network tab (check filename case).

---

## 14. Build order (milestones)

Finish and verify each before starting the next. After each milestone, summarize what was built and what the user should check.

1. **Scaffold**: Vite + React + TS, installs (§2), fonts (§5), tokens, `lib/gsap.ts`, folder structure, `timings.ts`. Verify all five fonts render (Rendered Fonts panel).
2. **Sound engine + gate**: engine with buses, loading, placeholders, variation, voice limits; gate UI with keyboard support and synchronous unlock. Verify in Chrome **and** Safari.
3. **Transit map + router**: `TransitMap` full layout on home, custom router, placeholder pages, mini layout.
4. **Gate → Home**: paint-over masks, fades, stagger (spray stubbed as a log line at `WHO_DELAY`).
5. **Spray engine**: particles + hiss coupling. Tune with GSDevTools.
6. **Palimpsest**: all six phases, Flip map morph, input lock, back/forward, preload wait, reduced-motion variant.
7. **Project shell + Oyster News**: layout, images pipeline, project list ellipse, link underline, parallax artifacts.
8. **Obstacle text**: circle obstacle on Oyster News, then alpha-mask mango on Mango.
9. **Portfolio page + placeholders polish**.
10. **Performance + accessibility pass**, then deploy config and the §13 checklist.

---

## 15. Open questions — ask the user, don't guess

Build a clearly marked placeholder (comment `// TODO(open-question #n)`) and continue.

1. **Deep links**: after the gate on a deep link (e.g. `/projects/mango`), should the user see the gate → home sequence and then Palimpsest to Mango, or go straight from the paint-over to Mango? Placeholder: paint-over, then a short fade to the requested page.
2. **"who?" on return visits**: respray every time the user returns home, or only the first time? Placeholder: faster respray each return.
3. **Switching projects** via the right-hand list: what transition? Placeholder: crossfade (§10.1).
4. **Portfolio page obstacle**: the mockup shows wrap gaps in the text but no visible obstacle. Is there a draggable element on that page (e.g. the orange circle from the hero)?
5. **Justified last lines**: confirm the stretched final lines in the mockups are Figma artifacts and last lines should be left-aligned.
6. **Mute toggle**: where should it live and how should it look after the gate?
7. **Mobile / narrow screens**: mockups are desktop only. Placeholder: fluid scaling with `clamp()` down to ~900px; below that, stack the columns and shrink the map. Ask before designing more.
8. **About, Experience, ???, Inspo**: no mockups yet. Placeholders only.
9. **Grey squares on home**: are they purely decorative, or placeholders for future content (images, a video)?
10. **Real sound files**: the user will supply them; confirm the IDs in §9.6 match what they plan to record.

---

## 16. Consolidated gotcha list

Everything above that has bitten or will bite this project, in one place:

- **Audio**: `resume()` synchronously in the gesture handler, before any `await` · resume even when muted · decode buffers before the gesture · never `<audio>` for effects · schedule rhythmic sounds on `ctx.currentTime`, not GSAP callbacks · one `AudioContext` only · source nodes are single-use · iPhone silent switch mutes Web Audio · no hover sounds possible before the first gesture.
- **Fonts**: variable packages register `"Inter Variable"` / `"Newsreader Variable"` · Pretext font strings must exactly match rendered CSS · measure only after `document.fonts.load` · locally installed fonts can mask broken web fonts, check "Rendered Fonts" · font swap can land mid-animation, so the gate waits for fonts.
- **Pretext**: confirm the actual API in `node_modules` before coding · re-prepare if fonts or `<html lang>` change.
- **GSAP**: no Club token / private registry · register plugins once · use `useGSAP` for cleanup · kill Draggables on unmount.
- **React**: StrictMode double-runs effects in dev → module-level singletons.
- **SVG**: "who?" must be stroked paths in draw order, not outlined shapes · layer names exported as IDs.
- **Rendering**: huge DOM text layers stutter → bitmap + canvas for Palimpsest · no full-page `filter` animation · handle `devicePixelRatio` on every canvas.
- **Assets**: lowercase filenames; macOS ignores case, Linux hosts don't · don't pre-compress originals.
- **Deploy**: SPA rewrite rule or deep links 404 · immutable cache on hashed assets only.
