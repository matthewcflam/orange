import type { ReactNode } from "react";
import { onNavClick } from "../lib/router";
import { play } from "../audio/engine";
import "./station.css";

/**
 * Shell of a station page (About, Experience, Projects): the dark page with
 * "Matthew Lam" top-left, which goes home, and the credit line at the page's
 * bottom-right (About (7).png). The glyphs and the Map pill are
 * shared chrome (chrome/StationChrome.tsx), so they persist between stations.
 */
export default function StationLayout({
  className,
  footerReveal,
  children,
}: {
  className?: string;
  /** Tag the footer for the page's scroll reveal (Experience). */
  footerReveal?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`station-page${className ? ` ${className}` : ""}`}>
      <h1 className="station-page__title">
        <a
          href="/"
          className="station-page__home"
          aria-label="Matthew Lam, home"
          onPointerEnter={(e) => e.pointerType !== "touch" && play("link.hover")}
          onClick={(e) => onNavClick(e, "/")}
        >
          Matthew Lam
        </a>
      </h1>
      {children}
      <footer className="station-page__footer" data-reveal={footerReveal || undefined}>
        Designed and Built by Matthew Lam
      </footer>
    </div>
  );
}
