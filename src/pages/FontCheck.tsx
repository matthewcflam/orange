// TEMPORARY (milestone 1): one specimen per font so each can be checked in
// DevTools → Computed → "Rendered Fonts" ("Network resource", not "Local file").
// Delete when the gate lands in milestone 2.

const SPECIMENS = [
  { label: "Monofett — gate SOUND", family: "var(--font-sound)", size: 40, weight: 400, text: "SOUND" },
  { label: "Megrim — gate Muted", family: "var(--font-muted)", size: 40, weight: 400, text: "Muted" },
  { label: "Newsreader Variable — name", family: "var(--font-name)", size: 34, weight: 400, text: "Matthew Lam" },
  { label: "Fragment Mono — stations", family: "var(--font-station)", size: 34, weight: 400, text: "About Experience Projects ??? Inspo" },
  { label: "Inter Variable 400 — body", family: "var(--font-body)", size: 16, weight: 400, text: "Some people scroll Instagram. Or TikTok. Some go outside. Me? I read the news." },
  { label: "Inter Variable 900 — Palimpsest", family: "var(--font-body)", size: 96, weight: 900, text: "Projects" },
];

export default function FontCheck() {
  return (
    <div style={{ padding: 48, display: "grid", gap: 32 }}>
      {SPECIMENS.map((s) => (
        <section key={s.label}>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#888", marginBottom: 6 }}>{s.label}</div>
          <div style={{ fontFamily: s.family, fontSize: s.size, fontWeight: s.weight, lineHeight: 1.1 }}>{s.text}</div>
        </section>
      ))}
    </div>
  );
}
