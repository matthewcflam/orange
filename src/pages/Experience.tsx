import type { CSSProperties } from "react";
import StationLayout from "./StationLayout";
import TrainLine from "./TrainLine";

interface Entry {
  date: string;
  company: string;
  /** Cap top in mockup px (design/mockups-v2/Experience (1).png). */
  y: number;
}

/** Company names start at x 414; the Extras group at x 395. */
const JOBS: Entry[] = [
  { date: "2026", company: "EnerSys", y: 239 },
  { date: "2026", company: "UBC Sailbot", y: 752 },
  { date: "2024-2026", company: "UBC Third Quadrant Design", y: 935 },
];

const EXTRAS: Entry[] = [
  { date: "2025-2026", company: "UBC Aquatics Centre", y: 1351 },
  { date: "2025", company: "UBC Geering Up Engineering Outreach", y: 1415 },
];

function Row({ entry, x }: { entry: Entry; x: number }) {
  return (
    <div className="experience__row" style={{ "--y": entry.y, "--x": x } as CSSProperties}>
      <span className="experience__date">{entry.date}</span>
      <span className="experience__company">{entry.company}</span>
    </div>
  );
}

/** Experience (design/mockups-v2/Experience (1).png): taller than the window,
 *  so the page scrolls. The gaps under each job are left for copy to come. */
export default function Experience() {
  return (
    <StationLayout className="experience">
      <TrainLine className="experience__line" />
      {JOBS.map((e) => (
        <Row key={e.company} entry={e} x={414} />
      ))}
      <h2 className="experience__extras">Extras</h2>
      {EXTRAS.map((e) => (
        <Row key={e.company} entry={e} x={395} />
      ))}
    </StationLayout>
  );
}
