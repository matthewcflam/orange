# Build spec — Matthew Lam Portfolio

Detailed spec referenced from `CLAUDE.md`. Section numbers are stable; `CLAUDE.md` holds §0 (before you code), §14 (milestones), §15 (open questions) and §16 (gotchas).

---

## 1. Tech stack (decided — do not substitute)

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite** | Fast dev server, hashed asset output, simple static deploy |
| UI | **React 19 + TypeScript (strict)** | Component model; `useGSAP` integration |
| App shape | **Single-page app** | One persistent `AudioContext` and one persistent transition overlay across all navigation. A full page load would destroy both. |
| Animation | **GSAP** (core + Flip, Draggable, InertiaPlugin, DrawSVGPlugin, CustomEase, GSDevTools in dev only) | Timeline control, scrubbing, plugins |
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

**Scaffold safely.** The repo root is not empty (`CLAUDE.md`, `docs/`, `design/`, `assets-src/`). `npm create vite@latest .` prompts on a non-empty dir, and one option is *"Remove existing files and continue"* — never pick it. Scaffold into a temp dir and move the generated files in (don't overwrite existing ones), or choose "Ignore files". Make sure everything is committed first.

```bash
npm create vite@latest . -- --template react-ts   # see warning above
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
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Flip, Draggable, InertiaPlugin, DrawSVGPlugin, CustomEase, useGSAP);

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

Checked against the Pretext README (Sep 2026): `prepareWithSegments(text, font, opts?)` and `layoutNextLine(prepared, start: LayoutCursor, maxWidth): LayoutLine | null` exist, plus a cheaper `layoutNextLineRange` with the same arguments. `LayoutCursor` is `{ segmentIndex, graphemeIndex }`; pass the previous line's `end` as the next `start`. Also from the README:
- Use a **named** font. `system-ui` and `-apple-system` are unsafe for accurate measurement.
- Firefox measures canvas text at a **rounded** font size, so keep body text at integer px sizes.
- Pretext has no justification, which is why §11.3 does it with `word-spacing`.

---

## 3. Project structure

```
orange/
├── CLAUDE.md                    # slim entry point: rules, milestones, open questions, gotchas
├── docs/spec.md                 # this file (§1–§13)
├── design/                      # reference only — never imported by the app
│   ├── mockups/                 # 01-landing.png … 08-projects-portfolio.png, flow order
│   └── ASSETS.md                # manifest: file → page → role → notes
├── assets-src/                  # full-quality originals, imported via vite-imagetools
│   ├── svg/
│   ├── images/                  # flat, lowercase-hyphen names (see ASSETS.md)
│   └── sounds/                  # <sound-id>.m4a, discovered at build time (§9.5); may be empty
├── scripts/
│   └── check-asset-names.mjs    # prebuild: fail on non-lowercase-hyphen names in assets-src/
└── src/
    ├── main.tsx                 # font imports, global CSS, mounts <App/>
    ├── App.tsx                  # layer stack (§4)
    ├── config/
    │   ├── timings.ts           # EVERY duration/delay/ease constant lives here
    │   ├── tokens.css           # colors, font stacks, spacing
    │   ├── routes.ts            # route table + station metadata
    │   └── sounds.ts            # sound manifest (§9.6)
    ├── content/
    │   └── projects.ts          # per-project copy: title, body, date, link, images
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
    │   ├── obstacles.ts         # circle + ellipse-union shapes
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
| 10 | **Shared chrome** | Yes | "Matthew Lam (wip)" name block (visible on gate and home only), the two grey squares (home only, painted in during gate → home, §6.6), mute toggle |
| 20 | **Transit map** | Yes | Single `TransitMap` instance; morphs between `full` (home) and `mini` (all other pages) via GSAP Flip |
| 30 | **Transition overlay** | Yes | Full-screen canvas for word stacking + black "tunnel" layer + light-bleed layer. `pointer-events: none` except while a transition runs |

The page background is white, painted by `body`. No layer has an opaque full-screen background except the transition overlay while it runs.

**The gate is a state, not a layer.** The app holds `gatePhase: "showing" | "leaving" | "done"`:
- Shared chrome renders, in DOM order within one stacking context: the name block, then the **gate options** (SOUND/Muted and the `>` cursor, mounted only while `gatePhase !== "done"`), then the **grey squares**. Because the squares come later in the DOM, the brush-mask paint really covers the options (§6.6). Nothing is faked with a fade.
- While `gatePhase !== "done"`, the transit map is hidden and the page layer renders nothing. On a deep link, nothing behind the gate is visible. Everything outside the gate buttons is `inert`, so keyboard focus can't leave them.
- The squares show on the gate (unpainted) and on home (painted). On a deep link they fade out with the placeholder fade to the requested page (§15 #1).

The name block and transit map are **rendered once** and never unmounted, so they can stay perfectly still (or morph) while pages swap beneath them. This is what makes transitions feel continuous.

### 4.2 Singletons
These must exist exactly once per page session:
- `AudioContext` (via `audio/engine.ts`; created inside the gate gesture, §6.4)
- The `OfflineAudioContext` used for decoding (module level)
- The transition overlay and its canvas
- The router

**React StrictMode gotcha:** in development, StrictMode runs effects twice. If you create the `AudioContext`, register a Draggable, or start a timeline in a plain `useEffect`, you will get two contexts, double sounds, and duplicated animations — only in dev, which makes it confusing. Rules:
- Create singletons at **module level** (lazily, guarded), never inside effects.
- Use `useGSAP()` (from `@gsap/react`) for all component-scoped animations; it reverts them on cleanup automatically.
- Every `Draggable.create()` must be `kill()`ed in cleanup.

### 4.3 Router
Minimal custom router in `lib/router.ts`:
**Model: the URL changes when the user acts; the page catches up at black.** This matches how the Navigation API commits URLs, and it means history can never get out of sync with what the user did.
- State: `currentRoute` (what's on screen), `isTransitioning`, `queued: string | null`.
- `navigate(to)` (station, link or mini-map click): if `to === currentRoute` or input is locked, do nothing. Otherwise call `history.pushState` **immediately**, then run Palimpsest.
- `commitRoute(to)`, called by the timeline when the screen is fully black, **never touches history**. It sets `currentRoute`, swaps the page, updates `document.title` and scrolls to top.
- `popstate` (back/forward): the browser has already moved the URL. If idle, run Palimpsest to `location.pathname`. If a transition is running, set `queued = location.pathname`; the latest wins. When the transition completes, if `queued` differs from `currentRoute`, run again.
- Set `history.scrollRestoration = "manual"` at startup; the router owns scrolling.
- Expose a `useRoute()` hook. Keep one internal entry point, `go(path, { push })`, so the History API code could later be swapped for the Navigation API (`navigation.addEventListener("navigate", …)`, Baseline since Jan 2026) without touching callers. Don't do that now: Safari lacks `precommitHandler`, and iOS 18-and-older visitors would still need this fallback.

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
6. **Filename case sensitivity.** macOS **and Windows** (NTFS, and this repo has `core.ignorecase=true`) treat `Mango.png` and `mango.png` as the same file; the Linux servers most hosts use do not. On Windows, a case-only rename needs `git mv`. Keep **every** asset filename lowercase-with-hyphens, and match case exactly in imports. Fontsource handles its own files; this applies to everything in `assets-src/`. Two guards:
   - **Import every asset; never reference one by a string URL.** The deploy build runs on Linux, where a wrong-case import fails the build instead of shipping a 404.
   - `scripts/check-asset-names.mjs` runs as `prebuild` and fails on any `assets-src/` filename that doesn't match `^[a-z0-9.-]+$`.
   - Don't set `core.ignorecase=false` on Windows; it causes phantom changes.

---

## 6. Landing page (the audio gate)

Mockup: `design/mockups/01-landing.png`.

### 6.1 Purpose
Browsers block audio until the user interacts with the page. The gate's click is that interaction. Everything after it, including the "who?" spray hiss, can play sound.

### 6.2 Layout (at 1440 × 1024)
- White background, painted by `body`. The gate is a state rendered inside shared chrome, not a separate layer (§4.1).
- "Matthew Lam" in Newsreader, ~34px, at roughly (112, 490). Directly below it, the orange hand-drawn "(wip)" (`assets-src/svg/wip.svg`). **This name block lives in the shared chrome layer (z 10)** and stays in exactly the same position on the home page. The home mockup draws it ~29px further left (x≈83); that is a mockup slip (user-confirmed). Use the landing position on both.
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
All sounds are fetched and decoded **before** the click, while the page idles on the gate, using a module-level `OfflineAudioContext`. An offline context is exempt from autoplay policy, and `AudioBuffer`s aren't tied to the context that decoded them. The real `AudioContext` is **created inside the gesture**. Creating it earlier makes Chrome log "The AudioContext was not allowed to start".

```ts
function onSelect(choice: "sound" | "muted") {
  // MUST be the first thing in the handler, synchronous, before any await.
  // unlock(): set navigator.audioSession.type = "ambient" if supported,
  // new AudioContext({ latencyHint: "interactive" }), ctx.resume(), build buses.
  audio.unlock({ muted: choice === "muted" });
  localStorage.setItem("pref.sound", choice);
  audio.play("gate.select");
  runGateToHome(choice);
}
```

- **Create the context and call `resume()` synchronously inside the click/keydown handler.** Safari only honours the unlock if it happens in the same synchronous call stack as the gesture. Any `await` before it can break it. Enter/Space keydown counts as a gesture.
- **Create and resume the context even when "Muted" is chosen**, and set master gain to 0. Otherwise unmuting later has no running context. (The mute toggle click is also a gesture, but don't rely on that.)
- The gate appears **on every fresh page load**, including deep links (e.g. someone opens `/projects/mango` directly). Browsers require a new gesture each load. After the gate, the user lands on the route they requested (see §15 open question on the deep-link animation).

### 6.5 Gate → Home animation
All values live in `timings.ts`. Times are seconds from the click.

| Time | Event |
|---|---|
| 0.00 | Selection click sound |
| 0.00 | Grey square A begins painting over the gate options. The squares sit after the options in the DOM (§4.1), so the paint really covers them |
| 0.25 | Grey square B begins painting (overlaps A) |
| 0.50 | Squares complete → unmount the gate options, `gatePhase = "done"` |
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
    .add(() => setGatePhase("done"), T.GATE.OPTIONS_UNMOUNT)
    .to(route, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, T.GATE.ROUTE_IN)
    .from(stationDots, { autoAlpha: 0, y: 6, stagger: 0.08, duration: 0.4 }, T.GATE.STATIONS_IN)
    .from(stationLabels, { autoAlpha: 0, stagger: 0.08, duration: 0.4 }, T.GATE.LABELS_IN)
    .to(smiley, { autoAlpha: 1, duration: 0.8 }, T.GATE.SMILEY_IN)
    .add(() => spray.play("who"), T.GATE.WHO_DELAY);
  return tl;
}
```

### 6.6 Paint-over technique (grey squares)
A fade or straight wipe will not read as paint. Each grey square (`#D9D9D9`, positions from the **home** mockup: two overlapping rectangles bottom-left, roughly (142, 715, 289×186) and (79, 789, 289×176). The transition mockups show a different arrangement, (92, 738) and (159, 800); see §15 #11) is revealed through a **brush-stroke mask**:

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
- Green hand-drawn smiley top-right (`smiley.svg`, `#41AE55`).
- Name block (shared chrome) at the same position as on the gate.
- The two grey squares bottom-left (left painted from the gate transition; on later visits to home they are simply present).
- The orange "who?" spray, center-right (≈ x 490–1400, y 560–800).

Sample exact colors from the mockups; the values here are approximations. Put final values in `tokens.css`.

**Build the transit map in code (SVG), not from an exported image.** It animates and changes state.

### 7.2 "who?" spray engine
The "who?" drawing ships as an SVG of **stroked paths in drawing order** (`assets-src/svg/who-spray.svg`: 5 `<path>`s, no IDs, **document order = draw order**: w, h, o, ?-hook, ?-dot). The paths are guides only; they are not displayed. They are stroked at **30px**, which sets the target line weight of the spray.

Rendering, on a `<canvas>` sized to the spray area:
1. **Handle device pixel ratio**: canvas backing size = CSS size × `devicePixelRatio`, then `ctx.scale(dpr, dpr)`. Otherwise it looks blurry on retina screens.
2. Load the SVG paths into hidden `<path>` elements (or `Path2D` + a length table) and read `getTotalLength()` / `getPointAtLength()`.
3. A GSAP timeline tweens a `progress` value per stroke (0 → length). Ease each stroke like a hand gesture (`power1.inOut`), with 80–150ms pauses between strokes (the can lifts off).
4. Each frame, step from the previous point to the current point in small increments (≤2px) so fast moves don't leave gaps. At each step, stamp **30–80 dots** in a Gaussian scatter around the point:
   - Core: dense, radius σ ≈ 7–8px (so ±2σ ≈ the 30px guide stroke width), high alpha.
   - Overspray: sparse, wide radius (σ ≈ 16–20px), low alpha.
   - Both σ values are tunable constants (in `timings.ts` / a spray config), not literals.
   - Occasional larger "spit" droplet (~1 in 40 stamps).
   - Density scales **inversely with speed**: slow = heavier paint.
5. Stamp onto the canvas and **never clear it** during the spray; paint accumulates. (Clear it once *before* a respray on return to home.)
6. Optional polish: at stroke ends where the nozzle lingers, spawn 1–2 slow drips (thin vertical lines growing downward over ~1s).
7. Color: the orange token (`#FF7700`), with per-dot alpha variation.

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

Mockups: `03-transition-1.png` (first copies) → `04-transition-2.png` (dense stack) → `05-transition-3.png` (black screen, annotated "< Slide out animation (like exiting a tunnel)").

### 8.1 Phases
All values in `timings.ts`; a full run should feel quick, roughly 2.5–3s including the tunnel.

| Phase | Time (s) | What happens | Sound |
|---|---|---|---|
| 1. Dot | 0.00–0.38 | Clicked station dot fills white → yellow (≈`#F5B700`), scale 1 → 1.6 (`back.out(3)`, 0.18s) → 1 (0.2s) | `station.click` chime |
| 2. Stack | ~0.30–1.20 | The station name in **Inter Variable weight 900**, huge, stacks up in repeated copies until the screen is nearly black | `palimpsest.thud` per copy, pre-scheduled |
| 3. Seal | ~1.20–1.35 | Black layer fades to opacity 1 over the canvas, guaranteeing 100% black | — |
| 4. Swap | at black | Clear the stack canvas; `commitRoute(next)` (history was already written at click time, §4.3): mount the new page underneath, morph the transit map layout if needed | Rumble begins, filtered low |
| 5. Wait | 0 to 3s max | `await` next page's images (`img.decode()`) and fonts. Usually instant thanks to hover prefetch | Rumble continues |
| 6. Tunnel exit | 1.1s | Black layer slides left (`xPercent: -100`, `expo.inOut`), revealing the new page | Lowpass sweep ~300 Hz → ~10 kHz as it slides |

Sketch:

```ts
export function palimpsest(from: Route, to: Route, clickedDot: SVGElement) {
  lockInput();
  const tl = gsap.timeline({ onComplete: resetOverlay, onInterrupt: resetOverlay });
  tl.to(clickedDot, { fill: YELLOW, scale: 1.6, duration: 0.18, ease: "back.out(3)", transformOrigin: "50% 50%" })
    .to(clickedDot, { scale: 1, duration: 0.2 })
    .add(stackWords(to.label), "-=0.1")
    .to(blackLayer, { opacity: 1, duration: 0.15 })
    .add(() => { clearStackCanvas(); commitRoute(to); })
    .add(waitFor(preloadRoute(to), 3000))  // pauses the timeline until resolved
    .to(tunnel, { xPercent: -100, duration: 1.1, ease: "expo.inOut" })
    .from(lightBleed, { opacity: 0.6, duration: 0.8 }, "<0.2")
    .from(pageRoot, { scale: 1.04, duration: 1.1, ease: "expo.out" }, "<");
  return tl;
}
```

Implement `waitFor` by pausing the timeline and resuming when the promise resolves (or the timeout hits).

### 8.2 Word stacking (Phase 2) — performance-critical
From the mockups: copies of the word appear one after another, each offset vertically (~150px apart at first), overlapping, then accelerate and fill in until the frame is almost solid black (`04-transition-2.png` shows the dense state).

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

**Reset after every run: `resetOverlay()`.** `transition/palimpsest.ts` exports one idempotent function, safe to call twice. It:
- clears the stack canvas;
- sets the tunnel to `xPercent: 0, autoAlpha: 0` and the light-bleed to `opacity: 0`;
- restores `pointer-events: none` on the overlay;
- calls `unlockInput()`, then runs `queued` if set (§4.3).

It is called from the timeline's `onComplete` and `onInterrupt` (any `kill()`) and from the >5s black-screen safety (§8.5). Separately, the stack canvas is cleared at Phase 4 while the screen is black; otherwise the words reappear as the tunnel slides away.

### 8.4 Transit map morph
The home page shows the map `full`; every other page shows it `mini` in a grey card top-left (≈ `#D9D9D9` card, ~381×157px, with a darker ≈`#7A6E6E` border on the right and bottom, see project mockups). Current station's dot is yellow/orange.

Use **GSAP Flip**: capture state, toggle the layout class/props, `Flip.from(state, …)`. Do the morph while the screen is black (Phase 4) so the user sees the result as the tunnel opens. Mini-map stations are clickable and run Palimpsest too.

### 8.5 Guards
- Ignore all navigation input while a transition runs (`lockInput`).
- Back/forward during a transition: the URL has already moved. Store it in `queued` (the latest wins), and run it from `resetOverlay()` (§4.3, §8.3). Clicks during a transition are simply ignored; they never write history.
- If the tab is hidden mid-transition, let GSAP complete (it will catch up); don't leave the overlay stuck black. Add a safety: if the overlay is black for >5s, force the reveal and call `resetOverlay()`.

---

## 9. Sound engine

### 9.1 Graph

```
sources ─┬─> ui bus ─────────┐
         ├─> transition bus ─┼─> master gain ─> DynamicsCompressor (limiter) ─> destination
         └─> ambient bus ────┘
```

- `new AudioContext({ latencyHint: "interactive" })`, a singleton held in `audio/engine.ts`, **created inside the gate gesture** by `audio.unlock()` (§6.4), guarded so it's created only once (StrictMode, §4.2). Before creating it, set `navigator.audioSession.type = "ambient"` where supported (Safari only). This is a deliberate choice: sounds mix with the user's music, and the iPhone silent switch mutes them.
- Limiter settings: threshold −6 dB, ratio 20, attack 0.003, release 0.1. It keeps spam-clicking from clipping.
- Master gain 0 when muted. Mute changes ramp over 50ms (`setTargetAtTime`) to avoid clicks.

### 9.2 Loading
- On app start (while the gate is showing), fetch every **discovered** sound file (§9.5) and decode it with a module-level `new OfflineAudioContext(1, 1, 48000)`. The resulting `AudioBuffer`s play in the real context later; a sample-rate mismatch is resampled automatically, which is fine for SFX. The procedural buffers (noise) can be built the same way.
- Playback = new `AudioBufferSourceNode` per play; they are cheap and one-shot by design.

### 9.3 Playback features
`audio.play(id, opts?)` where opts can include `when` (context time), `gain`, `rate`, `pan`.
- **Variation**: randomize playbackRate ±4–6% and gain ±10% per play, and round-robin through variants (`paint.stroke.1..4`). Prevents the repetitive "machine gun" effect.
- **Voice limits**: per-sound cap (e.g. 4). When exceeded, fade out (10ms) and stop the oldest.
- **Scheduling**: for anything rhythmic (Palimpsest thuds), compute all times from `ctx.currentTime` at timeline start and schedule them upfront with `source.start(when)`. GSAP callbacks fire on animation frames and can drift ~16ms, which is fine for one-off clicks but audible in a rhythm.
- **Tab hidden**: `ctx.suspend()` on `visibilitychange` hidden. Try `resume()` on visible, but don't rely on it: iOS can leave the context `"interrupted"` (calls, app switches) and refuse a resume without a gesture. So also register one capture-phase `pointerdown`/`keydown` listener that calls `resume()` whenever `ctx.state !== "running"`.

### 9.4 Procedural sounds (`audio/procedural.ts`)
- **Spray hiss**: a looping 2s white-noise `AudioBuffer` → highpass ~1.5 kHz → bandpass ~4.5 kHz (Q ≈ 0.8) → gain. The gain is set every frame from nozzle speed with `setTargetAtTime(value, now, 0.015)` so it follows smoothly without zipper noise.
- **Tunnel rumble**: brown/pink noise (or a sample, if provided) → lowpass. Cutoff starts ~300 Hz during the black screen and sweeps exponentially to ~10 kHz over the tunnel-exit duration (`exponentialRampToValueAtTime`), while gain fades out at the end. The muffled-to-open sweep is the audio version of exiting a tunnel.

### 9.5 Placeholder sounds
Real sound files may not exist yet. **Discover them at build time; never probe at runtime.** Probing doesn't work: the Vite dev server and the SPA rewrite (§13) both answer a missing file with `index.html` and status 200. Probing also adds 404s.

```ts
// src/config/sounds.ts
const files = import.meta.glob("/assets-src/sounds/*.m4a",
  { eager: true, query: "?url", import: "default" }) as Record<string, string>;
// "/assets-src/sounds/gate.select.m4a" -> hashed URL
```

The engine resolves each ID, or `id.n` for variants (`paint.stroke.1` … `.4`), against this map. Found → fetch and decode. Not found, or decode rejects → the engine must fall back to a **synthesized placeholder** (short oscillator blip or noise burst with a distinct pitch per ID) and log a single dev-only warning. This keeps timing audible during development. Swapping in real files later requires **no code changes**: drop `<id>.m4a` into `assets-src/sounds/` and rebuild. Real files also get hashed, immutable-cacheable URLs.

### 9.6 Sound manifest (`src/config/sounds.ts`)
Files go in `assets-src/sounds/`, named `<id>.m4a` (variants `<id>.<n>.m4a`), as **`.m4a` (AAC)**, which plays in every major browser. The manifest lists IDs, variant counts and bus; it never lists file paths.

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
- Create the context and `resume()` synchronously in the gesture handler (§6.4); decode beforehand with the `OfflineAudioContext`.
- Create and resume even when muted (§6.4).
- Never use `<audio>` for effects.
- **iPhone silent switch mutes Web Audio.** This is deliberate (`audioSession.type = "ambient"`, §9.1). Don't switch to `"playback"`: it would pause the user's music. The mute toggle's tooltip says "iPhone silent switch mutes sound".
- Don't create `AudioContext`s per component or per sound; one only.
- Don't reuse an `AudioBufferSourceNode`; they are single-use.

### 9.8 Mute toggle
A small persistent control in the shared chrome layer. Position isn't in the mockups (§15); use a small **top-right** corner control in Fragment Mono ("sound on / off") as a placeholder. Bottom-left collides with the gate options, the home grey squares and the Oyster News artifacts, and bottom-right collides with project links. Persists to `pref.sound`. Keyboard shortcut `M`.

---

## 10. Project pages

Mockups: `06-projects-oyster-news.png`, `07-projects-mango.png`, `08-projects-portfolio.png`.

### 10.1 Shared shell (`ProjectLayout.tsx`)
At 1440 × 1024:
- Mini transit map card top-left (§8.4).
- Center column, x ≈ 420–1020 (~600px wide):
  - Hero media block(s), rounded corners (~24–28px radius).
  - Body paragraph, **Inter ~16px, line-height ~19px, justified**, in an `ObstacleText` component (§11).
  - "Date: Aug. 2026 - Sept. 2026" line below, left-aligned, ~60px under the body.
- Right column (x ≈ 1120): project list in Inter ~36px: "Oyster News", "Mango", "Portfolio". The active project gets an **orange hand-drawn ellipse** around it (SVG asset; animate in with DrawSVG, ~0.5s, when the page appears or the selection changes). On the Portfolio page the mockup shows a squiggle underline instead; check `ASSETS.md`.
- Bottom-right: external link in Inter semibold (e.g. `https://oysternews.xyz/`) with a red-brown (≈`#C8452F`, sample from mockup) hand-drawn underline stroke (asset **missing**; use a placeholder path, see `ASSETS.md`). Hover: underline redraws, `link.hover` sound.

Switching between projects via the right-hand list is **not** a station change, so it should **not** run full Palimpsest (§15 asks what it should be). Placeholder: the center column crossfades (0.35s out / 0.45s in, slight 8px vertical offset), the ellipse redraws on the new item, `project.select` sound.

### 10.2 Page specifics
- **Oyster News**: two hero images (world news map, then Vancouver news map). Draggable **orange-red circle** (≈`#D9503A`, diameter ≈ 44px, check mockup) inside the body text; text wraps around it (§11). Floating **design artifacts** around the page edges (the tilted "VERY important headline" card, the large "News" wordmark, the Oyster logo top-right, etc.): animate only `transform`/`opacity`; add a subtle mouse parallax (max ~12px, different depth per artifact, smoothed with `gsap.quickTo`). More artifacts will be added later; build the positions from a data array so adding one is a one-line change. Placeholder slots per `ASSETS.md`.
- **Mango**: hero image(s) per `ASSETS.md`. Draggable **mango** (`svg/mango.svg`: two filled ellipses + stem) inside the body text; text wraps around its **actual shape** as an analytic ellipse union (§11.4). `images/mango.png` is the MineMotion screenshot hero, not the obstacle. The mockup's first hero (world map) and link (`oysternews.xyz`) are copy-paste leftovers from Oyster News; use placeholders until real content arrives.
- **Portfolio**: overlapping grey and orange circles as the hero (build in CSS/SVG). The mockup body text shows wrap gaps but no visible obstacle. They sit at exactly the same position as the Oyster News circle, so they are probably a copy-paste artifact; see §15 #4. The mockup's mini map is also missing the About, ??? and Inspo dots, probably a slip. Render all five dots.

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
- **Ellipse union** (Mango): the mango is two ellipses (see `mango.svg`: centers (22.5, 35.6) r(16.5, 30.5) and (19, 31.6) r(19, 26.5) in a 39×67 viewBox, scaled to display size). For each ellipse, find the y in the band closest to its center; if `|dy| < ry`, half-width = `rx·√(1 − dy²/ry²)`. Union the per-ellipse intervals (min start / max end; they always overlap). Ignore the thin stem, or pad the top band slightly. Exact, allocation-free, same math family as the circle.
- (Fallback for future irregular obstacles: rasterize to an offscreen canvas and build a per-row alpha > 32 extent table.)

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
6. No console errors or warnings, including no Chrome autoplay warning (the context is created in the gesture, §6.4). No 404s in the Network tab.
7. Safari checks (items 3 and 5) run on the user's **real iPhone**. From the Windows dev machine, debug with inspect.dev (or `ios-webkit-debug-proxy`). During development, test over LAN with `vite --host`. Playwright WebKit does not reproduce Safari's audio unlock rules. Check with the silent switch **on** too: sound should be muted, by design (§9.7).

---
