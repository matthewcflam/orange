// Prebuild guard (spec §5.4 gotcha 6): every file and folder in assets-src/
// must be lowercase-with-hyphens. Windows and macOS ignore case; the Linux
// deploy host does not, so a wrong-case name would ship as a 404.
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "assets-src";
const VALID = /^[a-z0-9.-]+$/;
const bad = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (!VALID.test(entry.name)) bad.push(relative(".", path));
    if (entry.isDirectory()) walk(path);
  }
}

walk(ROOT);

if (bad.length) {
  console.error(`\n✖ Asset names must match ${VALID} (lowercase, digits, '.', '-'):`);
  for (const p of bad) console.error(`  ${p}`);
  console.error("\nOn Windows, fix a case-only rename with `git mv`.\n");
  process.exit(1);
}
console.log(`✓ assets-src/ names OK`);
