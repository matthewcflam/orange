/**
 * Experience page copy and photos (design/mockups-v2/Experience (3).png).
 * Photo boxes are mockup px: x from the page's left, dy from the job's
 * header cap top. Later photos sit on top. Each box matches its image's
 * aspect, so object-fit: cover crops nothing.
 */
import type { Picture } from "../lib/assets";
import { frameSizes } from "../lib/frame";
import enersys1 from "../../assets-src/images/enersys1.png?hero";
import enersys2 from "../../assets-src/images/enersys2.png?hero";
import sailbot1 from "../../assets-src/images/sailbot1.png?hero";
import sailbot2 from "../../assets-src/images/sailbot2.png?hero";
import tqd from "../../assets-src/images/tqd.png?hero";
import tqd2 from "../../assets-src/images/tqd2.png?hero";

export interface JobPhoto {
  picture: Picture;
  alt: string;
  x: number;
  dy: number;
  w: number;
  h: number;
  sizes: string;
}

export interface Job {
  role: string;
  date: string;
  company: string;
  body: string[];
  photos: JobPhoto[];
}

const photo = (picture: Picture, alt: string, x: number, dy: number, w: number, h: number): JobPhoto => ({
  picture,
  alt,
  x,
  dy,
  w,
  h,
  sizes: frameSizes(w),
});

export const JOBS: Job[] = [
  {
    role: "Software Engineering Co-op",
    date: "2026",
    company: "EnerSys",
    body: [
      "Built a battery diagnostic tool in C# and XAML for incorrect protocol configurations, accelerating troubleshooting and resolving a 6-month roadblock for Rogers Communications",
      "Led 3 cross-team technical demonstrations of the tool’s setup, core features, and use cases, aligning Tech Support and Controller teams on product capabilities and eliminating support escalations",
      "Resolved 10+ controller defects through root-cause analysis and targeted fixes, improving stability on 800+ sites",
      "Executed physical tests on battery systems, validating 90% of targeted functionality for the upcoming release",
    ],
    photos: [
      photo(enersys1, "Matthew smiling in front of the EnerSys logo", 1288, -45, 235, 176),
      photo(enersys2, "A meeting room demo at EnerSys, the tool on the big screen", 1432, 55, 229, 173),
    ],
  },
  {
    role: "Software Web Developer",
    date: "2026",
    company: "UBC Sailbot",
    body: [
      "Developed an interactive React dashboard featuring real-time telemetry, sensor data visualization, and animated UI for autonomous sailboat testing operations",
      "Collaborated in a team of 6 to develop a custom AIS data pipeline to replace a $25K/year commercial service",
      "Split a combined sensor feed into three using MongoDB, TypeScript, and Redux, improving data organization and supporting sensor-specific updates on the dashboard",
    ],
    photos: [
      photo(sailbot1, "The UBC Sailbot logo", 1547, -49, 128, 128),
      photo(sailbot2, "The UBC Sailbot team on campus", 1298, 42, 268, 201),
    ],
  },
  {
    role: "Operations Lead",
    date: "2024-2026",
    company: "UBC Third Quadrant Design",
    body: [
      "Shipped a full-stack hiring portal and reviewer board using React, Next.js, and Supabase, enabling real-time sync, reviewer authentication, and schema validation for 100+ applications",
      "Coordinated design iterations for a team of 4, producing the narrative, UX, and renders for an Iranian ice house retrofit submitted to the Buildner Re:Form architecture competition",
    ],
    photos: [
      photo(tqd, "The Third Quadrant Design logo", 1263, 11, 224, 108),
      photo(tqd2, "Poetry Night, the ice house retrofit competition board", 1395, 103, 303, 214),
    ],
  },
];

/** Under the hand-drawn "extras": no copy, no photos. */
export const EXTRAS: Job[] = [
  { role: "Lifeguard & Swim Instructor", date: "2025-2026", company: "UBC Aquatic Centre", body: [], photos: [] },
  { role: "Camp Instructor", date: "2025", company: "UBC Geering Up Engineering Outreach", body: [], photos: [] },
];

export const EXPERIENCE_PHOTOS = JOBS.flatMap((j) => j.photos);
