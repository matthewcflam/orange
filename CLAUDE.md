# CLAUDE.md — Matthew Lam Portfolio

The site is a personal portfolio whose navigation is a transit map. Its two defining qualities are **smooth, choreographed animation** and **fast, highly interactive sound design**. Every decision serves those two goals. When in doubt, choose the option that keeps animation at 60fps and sound instant.

This file holds the rules, milestones, open questions and gotchas. The detailed build spec (§1–§13) lives in **`docs/spec.md`**. Before starting each milestone, read the spec sections listed for it in §14.

**Stack (decided, do not substitute):** Vite · React 19 + TypeScript (strict) · single-page app · GSAP (Flip, Draggable, Inertia, DrawSVG, CustomEase; GSDevTools in dev only) · `@chenglou/pretext` · custom raw Web Audio engine · `vite-imagetools` · Fontsource · a small custom History API router. Never use View Transitions, `<audio>` for effects, or any animation library besides GSAP. Details and reasons: spec §1.

**All timing values go in `src/config/timings.ts`**, and all colors and fonts go in `src/config/tokens.css`. The user tunes them repeatedly.

---

## 0. Before you write any code

1. **View every mockup in `design/mockups/`** (`01-landing.png` … `08-projects-portfolio.png`, in flow order). They are desktop frames at **1440 × 1024**, which is the reference viewport. Where they contain known slips, the spec says so.
2. **Read `design/ASSETS.md`.** It is the source of truth for what each file in `assets-src/` is, which page it belongs to, its role, and which assets are still **missing**. If a filename in the spec disagrees with the repo, the repo and `ASSETS.md` win.
3. **Commit before scaffolding.** `npm create vite@latest .` offers to delete existing files in a non-empty dir; see spec §2.
4. **Check §15 (open questions).** Do not invent answers. Build a clearly marked placeholder (`// TODO(open-question #n)`) and keep going, or ask.
5. If an `assets-src/fonts/` folder appears, **ignore it**; fonts come from npm (spec §5). Tell the user it can be deleted.

---

## 14. Build order (milestones)

Finish and verify each milestone before starting the next. After each one, summarize what was built and what the user should check.

| # | Milestone | Read first |
|---|---|---|
| 1 | **Scaffold**: Vite + React + TS, installs, fonts, tokens, `lib/gsap.ts`, folder structure, `timings.ts`. Verify all five fonts render (Rendered Fonts panel). | §1, §2, §3, §5 |
| 2 | **Sound engine + gate**: buses, offline pre-decode, glob-discovered files with synth placeholders, variation, voice limits; gate UI with keyboard support, creating the context inside the gesture. Verify in Chrome: no autoplay warning, and no 404s with an empty `assets-src/sounds/`. Verify on the user's real iPhone over `vite --host`, debugged from Windows with inspect.dev. | §4, §6.1–6.4, §9 |
| 3 | **Transit map + router**: `TransitMap` full layout on home, custom router, placeholder pages, mini layout. | §4, §7.1, §7.3, §8.4 |
| 4 | **Gate → Home**: paint-over masks, fades, stagger (spray stubbed as a log line at `WHO_DELAY`). | §6.5, §6.6 |
| 5 | **Spray engine**: particles + hiss coupling. Tune with GSDevTools. | §7.2, §9.4 |
| 6 | ~~**Palimpsest**~~: **removed at the user's request** (see progress log). | ~~§8~~ |
| 7 | **Project shell + Oyster News**: layout, image pipeline, project list ellipse, link underline, parallax artifacts (placeholders for missing art). | §10 |
| 8 | **Obstacle text**: circle obstacle on Oyster News, then the ellipse-union mango on Mango. | §11 |
| 9 | **Portfolio page + placeholder polish**. | §10.2 |
| 10 | **Performance + accessibility pass**, then deploy config and the deploy checklist. | §12, §13 |

### Progress log (update after each milestone)

| # | Status | Commit |
|---|---|---|
| 1 | Done. User confirmed all five fonts render. | `0ec6beb` |
| 2 | Done. User confirmed sound works. | `147c368` |
| 3 | Done. User verified; home map widened for wide screens. | `7f5f75e` |
| 4 | Done. User signed off. | `e3e879c` |
| 5 | Done. User signed off. | `10db1d0` |
| 6 | **Dropped.** Palimpsest was built (`918c887`), then the user asked to remove it and the black fade entirely and keep `tempTransition` (page fade + visible map morph) as the page transition. All Palimpsest code, config, tokens and sound IDs are gone. Spec §8 no longer applies; don't rebuild it unless asked. Ask the user what comes next (M7 is the project shell). | |
| – | **Between M6 and M7** (user requests): Home station added and ??? removed, minimap widened; "who?" sprays once and stays painted on return visits (open question #2); spray rattle cut; spray hiss and the whole site made quieter. | see git log |
| 7 | Built, **awaiting the user's sign-off**. Project shell, all three project pages (Portfolio's circles too), image pipeline, list scribbles, link underline, Oyster News artifacts with parallax. Raised with the user, unanswered: the mute toggle overlaps the Oyster logo top-right (open question #6); mango.png shows a window title-bar strip at the top (offered to crop via `object-position`). Next: M8 obstacle text (§11); body is 15px, see the project-pages decision. | `9443ece` |

**Decisions made while building (these override the spec's approximations):**
- **Colors**: sampled from the mockups into `tokens.css` (route `#0664DF`, mini-map border `#7C6C6C`, link underline `#BE4525`, Oyster circle `#D24F39`). `--color-station-active: #FFA62A` is used for both the mini-map current dot (the spec's `#F5B700` was unified into it).
- **Sizes measured against mockup ink**: name 39px (spec said ~34), SOUND 60px, Muted 45px (spec said ~40). Gate and name block match `01-landing.png` within ~2px.
- **Layout unit**: `--px: min(100vw / 1440, 100vh / 1024)` in `src/global.css`. Write mockup coordinates as `calc(N * var(--px))`. **Wide screens** (user-requested): home content that spans the width (map stations, smiley, later "who?") takes its *x positions* from `--vx: 100vw / 1440` (in the map: `layoutFor("full")` stretches station x the same way), so a 16:9 screen spreads out instead of leaving the right side empty. Sizes and y stay in `--px`; left-anchored chrome (name block, gate) stays in `--px`. Mobile layout is still open question #7.
- **Mute toggle** mounts only after the gate (on the gate, SOUND/Muted is the choice).
- **Files not listed in spec §3**: `src/global.css` (reset + layer classes), `src/chrome/` (`NameBlock.tsx` with `wip.svg` inlined via `?raw`, `MuteToggle.tsx`, `chrome.css`), `src/lib/prefs.ts` (`pref.sound`, storage wrapped in try/catch), `src/lib/tokens.ts` (`readToken()` to read CSS tokens from canvas/GSAP code). Pages add a `.css` beside the component (e.g. `gate/gate.css`).
- **Transit map** (`src/transit/`): one SVG with a 1440×1024 viewBox; geometry for both layouts is in `stations.ts` (measured from `02` and `06`, labels within ~2px). The mini map is **not** a uniform scale of the full one and the route stays 10px thick in both, so the morph tweens that geometry (`lerpLayout`) instead of using Flip on the SVG. Labels are placed by cap-top, using Fragment Mono's cap ratio measured on a canvas. Station hrefs are real links (Projects → `/projects/oyster-news`). **Stations (user change, overrides spec §4.4/§7.1):** Home → About (upper track) → Experience → Projects → Inspo (lower track); the ??? station and `/unknown` are gone. Home links to `/` and is the current (yellow) station on home. Full-layout label positions come from the user's redesign image, not `02-home.png`.
- **Router** (`src/lib/router.ts`): `navigate()`, `onNavClick()`, `useRoute()`, `setTransitionRunner(fn)`. A runner is `(to, commit) => Promise<void>`: call `commit()` once the old page is hidden (it flushes React synchronously), resolve when input can unlock; the router then runs `queued`. `tempTransition` is the registered runner. Route table and station list: `src/config/routes.ts`; path → component: `src/pages/Outlet.tsx`. Unknown paths redirect to `/`.
- **Name block** fades out off home (`CHROME.NAME_FADE`).
- **Gate → home** (`src/gate/gateToHome.ts`): one timeline built in `App.tsx` when `gatePhase` becomes `"leaving"`. The page (`<Outlet>`) mounts at "leaving" (not "done") so the timeline can hide and reveal the smiley. Square **A is the bottom-left one (79, 789)**. It alone covers the gate options, so it paints first and they're hidden by 0.45s, before the unmount at 0.5s. The `>` cursor sits partly outside A and fades out instead. Squares: `src/chrome/GreySquares.tsx`, brush passes generated from `PAINT`, `data-painted` swaps in a plain box. Deep links (open question #1): after the paint, the mini map and page fade in (`GATE.DEEP_LINK_FADE`). In dev the timeline is `window.__gateToHome` (scrub with `seek(t, false)`, since plain `seek` skips callbacks). `prefersReducedMotion()` lives in `src/lib/motion.ts`.
- **Sound loudness** (user feedback): the gate paint-over swish (`paint.stroke`) was "extremely loud" at gain 0.5 and is now 0.08. Overlapping or rapid-fire noise sounds stack up, so start new ones like this quiet (≈0.05–0.1) and let the user raise them. The user keeps asking for quieter, not louder: the spray rattle was cut, the hiss is down to 0.020 and the whole site is at `MASTER_GAIN` 0.5. Change only the sound the user names; leave the other volumes alone. **The paint-over sound is currently commented out** (`TODO(paint sound)` in `gate/gateToHome.ts`); the user will supply a replacement.
- **"who?" spray** (`src/spray/`): `sprayEngine.ts` is a plain class (canvas only, no React); `who.ts` decides when it runs (gate intro at `WHO_DELAY` via `introSpray()`, deep link → `skipIntroSpray()`, the first visit after a deep link → `whenIdle()` then spray; **every visit after it has sprayed once shows the same finished picture instantly, with no animation or sound** (user decision: on unmount `engine.finish()` fast-forwards a running spray silently and returns a `SprayPicture` (stamps, seed, drips, bitmap), and `engine.show()` restores it, blitting the bitmap if the canvas size is unchanged, else replaying); reduced motion → instant, silent). The can has a constant **flow** (`SPRAY.FLOW_DOTS_PER_S`), so slow stretches and the ?-dot get heavier paint; that replaces the spec's "dots scale with speed". Every stamp is recorded and dots come from a seeded PRNG, so a resize or DPR change replays the identical picture (a full replay costs ~200ms in headless Chrome; live frames ~2–3ms). Guide box sits at mockup (512, 537), centred at x 967 on `--vx`; ink matches `02-home.png` within a few px. Look and feel is all in `SPRAY` (timings.ts). Dev: `window.__whoSpray` is the latest spray timeline. Hiss graph: `audio/sprayHiss.ts`, levels in `SPRAY_HISS` (config/sounds.ts, gain 0.020: lowered in steps at the user's request, the last step by the user by hand); `spray.rattle` lowered to 0.1, then **commented out** (`TODO(spray rattle)` in `spray/sprayEngine.ts`): the user found the spray's first 500ms too loud; the rattle measured ~8 dB above the full hiss. The visual `RATTLE_LEAD` (0.25s before the first stroke) is unchanged. `router.whenIdle()` resolves when no transition is running.
- **Audio API** (`src/audio/engine.ts`): `preloadSounds()` (called in `main.tsx`), `unlock({ muted })`, `play(id, { when, gain, rate, pan, loop, vary })` returns a `Voice` (`stop(fade)`, `setGain(v, tc)`) or null, `setMuted()` (unmuted master = `MASTER_GAIN` in config/sounds.ts, 0.5 since the user asked for the whole site 50% quieter), `getContext()` / `getBus()` for procedural graphs (spray hiss). `procedural.ts` has `whiteNoise()` / `brownNoise()`. `STATION_HOVER_SEMITONES` + `semitonesToRate()` are in `config/sounds.ts` for §7.3.

- **Project pages** (M7): all three `/projects/*` paths render `pages/projects/Projects.tsx` under **one Outlet key**, so `ProjectLayout` (list + scribble) stays mounted and a project switch only crossfades `.project__swap` (`projectSwitch` in `tempTransition.ts`, placeholder for open question #3). Copy and heroes live in `content/projects.ts`; per-page extras in `pages/projects/` (`OysterNews.tsx` has the `ARTIFACTS` array: one entry per artifact, x/y in mockup px, `edge` left/right, parallax `depth`). Shared pieces: `pages/ProjectArticle.tsx` (column, `<picture>`, link), `pages/Artifacts.tsx`, `pages/project.css`. Column centre x 722 and list/link x use `--vx` like home. **Measured sizes override the spec**: body Inter **15/19** (line 1 breaks exactly as in `06`; `BODY_TEXT.sizePx` is 15), list 34px with -0.015em, link 22.5px semibold, hero radius 30. Browser Inter sets ~4–5% wider than the mockup's, so sizes come from cap height and widths from tracking. Oyster News artifacts and the world-map / Mango heroes are **CSS stand-ins** for missing art (`TODO(open-question #13/#12)`); Mango has no link yet.
- **Images**: `?hero` import preset in `vite.config.ts` → AVIF + WebP at 700/1400w as a `Picture` (types in `src/imagetools.d.ts`). `lib/assets.ts`: `preloadRoute()` decodes a route's heroes through a detached `<picture>`; station and project-list hover prefetch, and the transition waits for it up to `TEMP_NAV.PRELOAD_MAX_MS` before committing.
- **`lib/pageReveal.ts`**: `whenPageShown()` resolves when the page starts to appear (the gate at `OPTIONS_UNMOUNT`, the transition at fade-in). Entrance animations (the scribble draw) wait on it instead of guessing a delay.

**Page transition:** `src/transition/tempTransition.ts` (registered in `main.tsx`, timings in `TEMP_NAV`): page fades out, commits, fades in while the map morphs visibly (`lerpLayout`). Kept on purpose after Palimpsest was removed; the "TEMPORARY" labels stay until the user decides its replacement.

**Tooling notes:** headless checks use gstack `/browse` (dev server: `npm run dev`, port 5173). To sample mockup colors or compare ink bounding boxes, use `sharp` (installed with vite-imagetools); PIL and ffmpeg are not on this machine. Git's LF→CRLF warnings are harmless. Lint is `npm run lint` (oxlint; there is no ESLint config). `python` is the Windows Store stub and hangs, so use node for scripts.

---

## 15. Open questions — ask the user, don't guess

1. **Deep links**: after the gate on a deep link (e.g. `/projects/mango`), should the user see the gate → home sequence and then the page transition to Mango, or go straight from the paint-over to Mango? Placeholder: paint-over, then a short fade to the requested page.
2. ~~**"who?" on return visits**~~ **Resolved:** spray once; return visits show the finished picture, never a respray (even if the user left mid-spray).
3. **Switching projects** via the right-hand list: what transition? Placeholder: crossfade (spec §10.1).
4. **Portfolio page obstacle**: the mockup's wrap gaps match the Oyster News circle's position exactly, so they are probably copy-paste. Is there meant to be a draggable element (e.g. `portfolio-orange.png`)? Placeholder: none.
5. **Justified last lines**: confirm the stretched final lines in the mockups are Figma artifacts and last lines should be left-aligned.
6. **Mute toggle**: where should it live and how should it look after the gate? Placeholder: top-right corner.
7. **Mobile / narrow screens**: the mockups are desktop only. Placeholder: fluid scaling with `clamp()` down to ~900px; below that, stack the columns and shrink the map. Ask before designing more.
8. **About, Experience, Inspo**: no mockups yet. Placeholders only.
9. **Grey squares on home**: purely decorative, or placeholders for future content (images, a video)?
10. ~~**Real sound files**~~ **Resolved:** the IDs in spec §9.6 are correct. The user likes the synthesized placeholder sounds (`src/audio/procedural.ts`, voiced in `config/sounds.ts`), so **keep them as the actual sounds**. Don't retune them, replace them or add files unless the user asks. They may still drop in real `.m4a` files later.
11. **Grey square positions**: the home mockup and the transition mockups disagree. Placeholder: use the home mockup positions (spec §6.6).
12. **Mango page content**: the mockup's first hero (world map) and link (`oysternews.xyz`) are copied from Oyster News. What are the real Mango hero, link and date?
13. **Missing art**: world-map hero, Oyster News design artifacts, link underline stroke (see `ASSETS.md`). Placeholders until supplied.

---

## 16. Consolidated gotcha list

- **Audio**: decode with an `OfflineAudioContext` before the gesture, then *create* the real `AudioContext` and `resume()` synchronously inside the gesture handler, before any `await` (no Chrome warning) · create and resume even when muted · set `navigator.audioSession.type = "ambient"` first (the silent switch mutes sound by design; never `"playback"`, which pauses the user's music) · on iOS "interrupted", resume on the next pointerdown/keydown · never `<audio>` for effects · schedule rhythmic sounds on `ctx.currentTime`, not GSAP callbacks · one `AudioContext` only · source nodes are single-use · no hover sounds possible before the first gesture · sound files are discovered with `import.meta.glob` over `assets-src/sounds/`; never probe URLs (the dev server and SPA rewrite return `index.html` with status 200).
- **Fonts**: variable packages register `"Inter Variable"` / `"Newsreader Variable"` · Pretext font strings must exactly match rendered CSS · measure only after `document.fonts.load` · locally installed fonts can mask broken web fonts, check "Rendered Fonts" · font swap can land mid-animation, so the gate waits for fonts.
- **Pretext**: confirm the actual API in `node_modules` before coding · re-prepare if fonts or `<html lang>` change.
- **GSAP**: no Club token / private registry · register plugins once · use `useGSAP` for cleanup · kill Draggables on unmount.
- **React**: StrictMode double-runs effects in dev → module-level singletons.
- **Layers**: the gate is a *state* (`gatePhase`), not a z40 layer; its options render in shared chrome *before* the grey squares, so the paint genuinely covers them · white comes from `body` · everything else is `inert` while the gate shows.
- **Router**: `pushState` at click time; `commitRoute` never touches history · `popstate` mid-transition → `queued` (the latest wins) · `scrollRestoration = "manual"`.
- **SVG**: "who?" is 5 stroked paths (30px) in draw order, with no IDs; reference them by index · spray core σ must match the 30px stroke weight.
- **Rendering**: huge DOM text layers stutter → use bitmap + canvas · no full-page `filter` animation · handle `devicePixelRatio` on every canvas.
- **Assets**: lowercase-hyphen filenames; macOS and Windows ignore case, Linux hosts don't (a case-only rename on Windows needs `git mv`) · import every asset, never string URLs (so the Linux deploy build catches case errors) · the `prebuild` name check · don't pre-compress originals · colors come from the SVG sources (orange `#FF7700`, green `#41AE55`).
- **Deploy**: SPA rewrite rule or deep links 404 · immutable cache on hashed assets only · Safari checks run on the user's real iPhone (inspect.dev from Windows).
- **Pretext**: `layoutNextLine(prepared, cursor, maxWidth)` is the obstacle-wrap primitive · named fonts only (no `system-ui`) · integer px font sizes (Firefox rounds).
