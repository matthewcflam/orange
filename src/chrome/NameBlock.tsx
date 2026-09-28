import wipSvg from "../../assets-src/svg/wip.svg?raw";
import "./chrome.css";

/**
 * "Matthew Lam (wip)", shared chrome (spec §4.1, §6.2). Rendered once and never
 * unmounted, at the same position on the gate and home. The SVG is inlined so
 * its paths can be animated later.
 */
export default function NameBlock() {
  return (
    <div className="name-block">
      <p className="name-block__name">Matthew Lam</p>
      <div className="name-block__wip" aria-label="(work in progress)" role="img" dangerouslySetInnerHTML={{ __html: wipSvg }} />
    </div>
  );
}
