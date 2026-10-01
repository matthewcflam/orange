# Asset manifest

Source of truth for `assets-src/`. Mockups in `design/mockups-v2/` (current, 1767×1024) and `design/mockups-v1/` (the old design, still the reference for the project article) are reference only and are never imported. All filenames are lowercase-with-hyphens.

## SVG (`assets-src/svg/`)

None of these SVGs has element IDs. Reference paths by document order.

| File | Page | Role | Notes |
|---|---|---|---|
| `who-spray.svg` | home | **guide paths** for the "who?" spray engine; not displayed | 910×302, 5 stroked paths, `#FF7700`, 30px stroke. Draw order = document order: 0 `w`, 1 `h`, 2 `o`, 3 `?` hook, 4 `?` dot |
| `portfolio-scribble.svg` | station pages (Map pill) | squiggle drawn under "Map" on hover | 119×49, 1 path, `#FF7700`; stretched to the mockup's 78×85 box (non-scaling stroke) |
| `new-portfolio.svg` | Projects list | orange loop around "This Portfolio" (active) | 212×139, 1 path; DrawSVG in |
| `new-oyster.svg` | Projects list | orange speech-box outline around "Oyster News" (active) | 224×124, 1 path; DrawSVG in |
| `new-mango.svg` | Projects list | orange loop around "Mango" (active) | 180×131, 1 path; DrawSVG in |
| `speech.svg` | station pages | the orange speech bubble from "Matthew Lam" | 173×137: a 162×80 rect (r 6) + tail. Rebuilt in HTML/SVG by `chrome/SpeechBubble.tsx` (the rect has to resize to its text) |
| `doug-keychain.svg` | keychain | Doug, the dog charm, with his chain and split ring | 304×252, placed 1:1 at keychain box (102, −160) as in `Menu Open (3).png`. `?charm` → AVIF/WebP 300/600w |
| `compass-keychain.svg` | keychain | the Compass Card charm, with its ring | 387×354, placed 1:1 at keychain box (302, 120). `?charm` like Doug |
| `mango.svg` | Mango | **draggable obstacle** in the body text | 39×67. Two filled ellipses (`#FFA62A`) plus a green stem stroke (`#76C933`). The text wraps around the ellipse union (spec §11.4). |

## Images (`assets-src/images/`)

| File | Page | Role | Notes |
|---|---|---|---|
| `oyster-news.png` | Oyster News | hero #2 (Vancouver news map) | 1771×996 RGBA |
| `mango.png` | Mango | hero #2 (MineMotion gesture control + Minecraft screenshot) | 1716×1028 RGBA. This is **not** the draggable mango. |
| `portfolio-orange.png` | Portfolio | unused for now | 380×380 orange circle. The Portfolio hero circles are built in CSS/SVG. Possible drag obstacle; see open question #4. |

## Sounds (`assets-src/sounds/`)

Empty for now. Files are discovered at build time (spec §9.5), so adding one needs no code change. Name each `<id>.m4a` (AAC), with variants as `<id>.<n>.m4a`, e.g. `gate.select.m4a`, `paint.stroke.1.m4a` … `paint.stroke.4.m4a`, `palimpsest.thud.1.m4a` … `.3`. IDs are in spec §9.6. Any ID without a file plays a synthesized placeholder. The user likes the synthesized sounds and wants to keep them, so no files are required. Add files only if the user supplies them.

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
