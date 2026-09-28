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
| 6 | **Palimpsest**: all six phases, Flip map morph, input lock, back/forward, preload wait, overlay resets, reduced-motion variant. | §8, §12 |
| 7 | **Project shell + Oyster News**: layout, image pipeline, project list ellipse, link underline, parallax artifacts (placeholders for missing art). | §10 |
| 8 | **Obstacle text**: circle obstacle on Oyster News, then the ellipse-union mango on Mango. | §11 |
| 9 | **Portfolio page + placeholder polish**. | §10.2 |
| 10 | **Performance + accessibility pass**, then deploy config and the deploy checklist. | §12, §13 |

---

## 15. Open questions — ask the user, don't guess

1. **Deep links**: after the gate on a deep link (e.g. `/projects/mango`), should the user see the gate → home sequence and then Palimpsest to Mango, or go straight from the paint-over to Mango? Placeholder: paint-over, then a short fade to the requested page.
2. **"who?" on return visits**: respray every time the user returns home, or only the first time? Placeholder: faster respray each return.
3. **Switching projects** via the right-hand list: what transition? Placeholder: crossfade (spec §10.1).
4. **Portfolio page obstacle**: the mockup's wrap gaps match the Oyster News circle's position exactly, so they are probably copy-paste. Is there meant to be a draggable element (e.g. `portfolio-orange.png`)? Placeholder: none.
5. **Justified last lines**: confirm the stretched final lines in the mockups are Figma artifacts and last lines should be left-aligned.
6. **Mute toggle**: where should it live and how should it look after the gate? Placeholder: top-right corner.
7. **Mobile / narrow screens**: the mockups are desktop only. Placeholder: fluid scaling with `clamp()` down to ~900px; below that, stack the columns and shrink the map. Ask before designing more.
8. **About, Experience, ???, Inspo**: no mockups yet. Placeholders only.
9. **Grey squares on home**: purely decorative, or placeholders for future content (images, a video)?
10. **Real sound files**: the user will supply them; confirm the IDs in spec §9.6 match what they plan to record.
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
- **Layers**: the gate is a *state* (`gatePhase`), not a z40 layer; its options render in shared chrome *before* the grey squares, so the paint genuinely covers them · white comes from `body` · everything else is `inert` while the gate shows · one idempotent `resetOverlay()` on complete, interrupt and the 5s safety.
- **Router**: `pushState` at click time; `commitRoute` at black never touches history · `popstate` mid-transition → `queued` (the latest wins) · `scrollRestoration = "manual"`.
- **SVG**: "who?" is 5 stroked paths (30px) in draw order, with no IDs; reference them by index · spray core σ must match the 30px stroke weight.
- **Rendering**: huge DOM text layers stutter → bitmap + canvas for Palimpsest · no full-page `filter` animation · handle `devicePixelRatio` on every canvas.
- **Assets**: lowercase-hyphen filenames; macOS and Windows ignore case, Linux hosts don't (a case-only rename on Windows needs `git mv`) · import every asset, never string URLs (so the Linux deploy build catches case errors) · the `prebuild` name check · don't pre-compress originals · colors come from the SVG sources (orange `#FF7700`, green `#41AE55`).
- **Deploy**: SPA rewrite rule or deep links 404 · immutable cache on hashed assets only · Safari checks run on the user's real iPhone (inspect.dev from Windows).
- **Pretext**: `layoutNextLine(prepared, cursor, maxWidth)` is the obstacle-wrap primitive · named fonts only (no `system-ui`) · integer px font sizes (Firefox rounds).
