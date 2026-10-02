#!/usr/bin/env node
/**
 * Starting values for src/config/sprayPace.ts, from the handwriting speed
 * model in src/spray/paceModel.ts (power law + start/end ramps + the
 * word-end rush). Prints the file; `--write` replaces it (hand edits are lost).
 *
 *   node scripts/spray-pace.mjs            # print
 *   node scripts/spray-pace.mjs --write    # overwrite src/config/sprayPace.ts
 *
 * Needs Node ≥ 22.18 / 23.6 (runs the .ts model with type stripping).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sampleGuide, segmentTimes, speedShape } from "../src/spray/paceModel.ts";

// ---- Targets (the model only sets proportions; these set the totals) ----
/** The whole spray, lead to the ?-dot's end, in ms (the old TOTAL_S). */
const TOTAL_MS = 2500;
const LEAD_MS = 250;
/** Can lifts after w, h, o and the ?-hook. */
const LIFTS_MS = [110, 120, 100, 140];
/** The ?-dot: the nozzle dwells and builds a blob. */
const DOT_MS = 150;
const LETTERS = ["w", "h", "o", "?", "."];

const root = fileURLToPath(new URL("..", import.meta.url));
const svg = readFileSync(`${root}assets-src/svg/who-spray.svg`, "utf8");
const ds = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
const guides = ds.map((d) => sampleGuide(d));
const last = guides.length - 2; // the ?-hook: the word's last real stroke

// Model time per segment at unit speed, then one K so the total hits TOTAL_MS.
const raw = guides.map((g, i) => (i === guides.length - 1 ? null : segmentTimes(g, speedShape(g, { finish: i === last }))));
const strokeRaw = raw.flat().filter((x) => x !== null).reduce((a, b) => a + b, 0);
const fixed = LEAD_MS + LIFTS_MS.reduce((a, b) => a + b, 0) + DOT_MS;
const k = strokeRaw / ((TOTAL_MS - fixed) / 1000);

const lines = [];
let total = LEAD_MS;
guides.forEach((g, i) => {
  const ms = raw[i] ? raw[i].map((t) => Math.max(1, Math.round((t / k) * 1000))) : [DOT_MS];
  const rows = ms.map((m, s) => {
    const len = g.anchors[s + 1] - g.anchors[s];
    const name = `${LETTERS[i]}${s} → ${LETTERS[i]}${s + 1}`;
    return `        ${String(m).padStart(4)}, // ${name.padEnd(10)} ${len.toFixed(0).padStart(4)}px  ${String(Math.round(len / (m / 1000))).padStart(5)} px/s`;
  });
  total += ms.reduce((a, b) => a + b, 0) + (LIFTS_MS[i] ?? 0);
  const lift = LIFTS_MS[i] !== undefined ? `\n      liftMs: ${LIFTS_MS[i]},` : "";
  lines.push(`    {\n      letter: "${LETTERS[i]}",\n      segmentsMs: [\n${rows.join("\n")}\n      ],${lift}\n    },`);
});

const out = `/**
 * "who?" spray pace: how long the nozzle takes between each pair of anchor
 * points in assets-src/svg/who-spray.svg, in ms. Edit freely; the spray lasts
 * as long as everything here adds up to (now ${total} ms).
 *
 * Points are named by letter and index along the path: w0 is the w's first
 * point. Within a segment the nozzle still slows on curves and speeds up on
 * straights (src/spray/paceModel.ts); these only set each segment's total.
 * The comments are the starting values' length and average speed; they go
 * stale once you edit (the dev overlay shows live numbers).
 *
 * Dev: open /?spray-debug to see every point labelled with its ms, coloured
 * by speed; save this file to replay, or press R.
 * Starting values: node scripts/spray-pace.mjs (handwriting model).
 */
export interface StrokePace {
  readonly letter: string;
  /** One value per segment: the path's anchor points − 1. */
  readonly segmentsMs: readonly number[];
  /** The can lifts off before the next stroke. */
  readonly liftMs?: number;
}

export const SPRAY_PACE: { readonly leadMs: number; readonly strokes: readonly StrokePace[] } = {
  /** Before the first stroke (the hiss starts here). */
  leadMs: ${LEAD_MS},
  strokes: [
${lines.join("\n")}
  ],
};
`;

if (process.argv.includes("--write")) {
  writeFileSync(`${root}src/config/sprayPace.ts`, out);
  console.log(`Wrote src/config/sprayPace.ts (${total} ms).`);
} else {
  process.stdout.write(out);
}
