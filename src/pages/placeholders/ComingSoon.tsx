import "./placeholders.css";

/**
 * Placeholder page (spec §4.4): the mini map sits top-left (it's global), with
 * a centered "Coming soon" label, so every station has a page to go to.
 */
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="coming-soon">
      <h1 className="coming-soon__title">{title}</h1>
      <p className="coming-soon__label">Coming soon</p>
    </div>
  );
}
