import type { CSSProperties } from "react";
import { say } from "../lib/speech";
import StationLayout from "./StationLayout";
import TrainLine from "./TrainLine";

interface Entry {
  date: string;
  company: string;
  /** Cap top in mockup px (design/mockups-v2/Experience (1).png). */
  y: number;
  /** What the speech bubble says when the company is clicked.
   *  TODO(open-question #16): placeholder lines. */
  quip: string;
}

/** Company names start at x 414; the Extras group at x 395. */
const JOBS: Entry[] = [
  { date: "2026", company: "EnerSys", y: 239, quip: "Placeholder: EnerSys quip." },
  { date: "2026", company: "UBC Sailbot", y: 752, quip: "Placeholder: Sailbot quip." },
  { date: "2024-2026", company: "UBC Third Quadrant Design", y: 935, quip: "Placeholder: Third Quadrant quip." },
];

const EXTRAS: Entry[] = [
  { date: "2025-2026", company: "UBC Aquatics Centre", y: 1351, quip: "Cool beans." },
  { date: "2025", company: "UBC Geering Up Engineering Outreach", y: 1415, quip: "Placeholder: Geering Up quip." },
];

function Row({ entry, x }: { entry: Entry; x: number }) {
  return (
    <div className="experience__row" style={{ "--y": entry.y, "--x": x } as CSSProperties}>
      <span className="experience__date">{entry.date}</span>
      <button type="button" className="experience__company" onClick={() => say(entry.quip)}>
        {entry.company}
      </button>
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
