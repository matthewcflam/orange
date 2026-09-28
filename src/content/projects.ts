/**
 * Per-project copy and media (spec §10). Sizes are mockup px (1440×1024).
 * Page-specific extras (design artifacts, obstacles, the Portfolio circles)
 * live with each page in pages/projects/.
 */
import type { Picture } from "../lib/assets";
import oysterNewsMap from "../../assets-src/images/oyster-news.png?hero";
import mangoMineMotion from "../../assets-src/images/mango.png?hero";

export type ProjectSlug = "oyster-news" | "mango" | "portfolio";

export type Hero =
  | { kind: "image"; picture: Picture; alt: string; height: number }
  /** Art that hasn't been supplied yet (design/ASSETS.md "Missing"). */
  | { kind: "placeholder"; label: string; height: number };

export interface Project {
  slug: ProjectSlug;
  title: string;
  path: string;
  /** Stacked in the center column, 600 wide. Empty = the page draws its own. */
  heroes: Hero[];
  /** One string per paragraph. */
  body: string[];
  date: string;
  link: { href: string; label: string } | null;
}

// The copy in all three mockups. Mango and Portfolio reuse Oyster News's text.
const OYSTER_BODY = [
  "Some people scroll Instagram. Or TikTok. Some go outside. Me? I read the news. It got to the point I would wonder what else was going on in the world. Some people scroll Instagram. Or TikTok.",
  "Some go outside. Me? I read the news. It got to the point I would wonder what else was going on in the world. Some people scroll Instagram. Or TikTok. Some go outside. Me? I read the news. It got to the point I would wonder what else was going on in the world. Some people scroll Instagram. Or TikTok. Some go outside Me? I read the news. It got to the point I would wonder what else was going on in the world. Some people scroll Instagram.",
  "Or TikTok. Some go outside. Me?",
  "I read the news. It got to the point I would wonder what else was going on in the world.",
];

export const PROJECTS: readonly Project[] = [
  {
    slug: "oyster-news",
    title: "Oyster News",
    path: "/projects/oyster-news",
    heroes: [
      // TODO(open-question #13): world news map hero is missing.
      { kind: "placeholder", label: "world news map (art missing)", height: 150 },
      { kind: "image", picture: oysterNewsMap, alt: "Oyster News: a map of Vancouver with news headlines pinned where they happened", height: 377 },
    ],
    body: OYSTER_BODY,
    date: "Date: Aug. 2026 - Sept. 2026",
    link: { href: "https://oysternews.xyz/", label: "https://oysternews.xyz/" },
  },
  {
    slug: "mango",
    title: "Mango",
    path: "/projects/mango",
    heroes: [
      // TODO(open-question #12): the mockup's first hero is Oyster News's world map.
      { kind: "placeholder", label: "Mango hero (art missing)", height: 150 },
      { kind: "image", picture: mangoMineMotion, alt: "MineMotion: webcam body tracking beside the Minecraft game it controls", height: 372 },
    ],
    // TODO(open-question #12): real Mango copy, date and link.
    body: OYSTER_BODY,
    date: "Date: Aug. 2026 - Sept. 2026",
    link: null,
  },
  {
    slug: "portfolio",
    title: "Portfolio",
    path: "/projects/portfolio",
    heroes: [],
    // TODO(milestone 9): real Portfolio copy.
    body: OYSTER_BODY,
    date: "Date: Aug. 2026 - Sept. 2026",
    link: null,
  },
];

export const projectBySlug = (slug: ProjectSlug) => PROJECTS.find((p) => p.slug === slug)!;
export const projectByPath = (path: string) => PROJECTS.find((p) => p.path === path);
