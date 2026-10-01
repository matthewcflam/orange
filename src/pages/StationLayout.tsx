import type { ReactNode } from "react";
import { onNavClick } from "../lib/router";
import { play } from "../audio/engine";
import "./station.css";

/**
 * Shell of a station page (About, Experience, Projects): the dark page with
 * its big title, top-left, which goes home. The Map pill and "Matthew Lam"
 * are shared chrome (chrome/StationChrome.tsx), so they persist between stations.
 */
export default function StationLayout({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`station-page${className ? ` ${className}` : ""}`}>
      <h1 className="station-page__title">
        <a
          href="/"
          className="station-page__home"
          onPointerEnter={(e) => e.pointerType !== "touch" && play("link.hover")}
          onClick={(e) => onNavClick(e, "/")}
        >
          {title}
        </a>
      </h1>
      {children}
    </div>
  );
}
