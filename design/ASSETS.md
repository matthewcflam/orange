# Asset manifest

Source of truth for `assets-src/`. Mockups in `design/mockups/` are reference only and are never imported. All filenames are lowercase-with-hyphens.

## SVG (`assets-src/svg/`)

None of these SVGs has element IDs. Reference paths by document order.

| File | Page | Role | Notes |
|---|---|---|---|
| `wip.svg` | gate + home (shared chrome) | hand-drawn "(wip)" under "Matthew Lam" | 113×54, 6 stroked paths, `#FF7700`, 5px stroke. Can be drawn on with DrawSVG. |
| `smiley.svg` | home | green hand-drawn smiley, top-right | 297×139, 3 stroked paths (2 eyes, mouth), `#41AE55`, 20px stroke |
| `who-spray.svg` | home | **guide paths** for the "who?" spray engine; not displayed | 910×302, 5 stroked paths, `#FF7700`, 30px stroke. Draw order = document order: 0 `w`, 1 `h`, 2 `o`, 3 `?` hook, 4 `?` dot |
| `oyster-scribble.svg` | project list | orange ellipse around "Oyster News" (active) | 282×50, 1 path, `#FF7700`; DrawSVG in |
| `mango-scribble.svg` | project list | orange ellipse around "Mango" (active) | 173×68, 1 path, `#FF7700`; DrawSVG in |
| `portfolio-scribble.svg` | project list | orange squiggle **under** "Portfolio" (active) | 119×49, 1 path, `#FF7700`; DrawSVG in |
| `mango.svg` | Mango | **draggable obstacle** in the body text | 39×67. Two filled ellipses (`#FFA62A`) plus a green stem stroke (`#76C933`). The text wraps around the ellipse union (spec §11.4). |

## Images (`assets-src/images/`)

| File | Page | Role | Notes |
|---|---|---|---|
| `oyster-news.png` | Oyster News | hero #2 (Vancouver news map) | 1771×996 RGBA |
| `mango.png` | Mango | hero #2 (MineMotion gesture control + Minecraft screenshot) | 1716×1028 RGBA. This is **not** the draggable mango. |
| `portfolio-orange.png` | Portfolio | unused for now | 380×380 orange circle. The Portfolio hero circles are built in CSS/SVG. Possible drag obstacle; see open question #4. |

## Sounds (`assets-src/sounds/`)

Empty for now. Files are discovered at build time (spec §9.5), so adding one needs no code change. Name each `<id>.m4a` (AAC), with variants as `<id>.<n>.m4a`, e.g. `gate.select.m4a`, `paint.stroke.1.m4a` … `paint.stroke.4.m4a`, `palimpsest.thud.1.m4a` … `.3`. IDs are in spec §9.6. Any ID without a file plays a synthesized placeholder.

## Missing (use labeled placeholders until supplied)

| Needed | Page | Seen in mockup |
|---|---|---|
| World news map hero (#1, wide strip) | Oyster News (and Mango, though probably copy-paste there) | `06`, `07` top image |
| "VERY important headline" tilted card | Oyster News | `06` left edge |
| "News" wordmark (large grey) | Oyster News | `06` bottom-left |
| "the world is yours" newspaper clipping | Oyster News | `06` bottom-left |
| Oyster logo / "Oyster" wordmark | Oyster News | `06` top-right |
| Link underline stroke (red-brown, ≈`#C8452F`) | all project pages | `06`–`07` bottom-right |
| Real Mango hero #1, link and date | Mango | open question #12 |
| Sound files (`.m4a`) | all | spec §9.6; placeholders are synthesized |
