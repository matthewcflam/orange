import { useCallback, useState } from "react";
import { useRoute } from "../lib/router";
import MapButton from "../keychain/MapButton";
import Keychain from "../keychain/Keychain";
import SocialLinks from "./SocialLinks";

/**
 * Chrome on station pages (design/mockups-v2, About (2).png): the social
 * glyphs and the Map pill top-right. Mounted while the
 * route is a station page, so it persists from one station to the next. (The
 * name top-left is what goes home: pages/StationLayout.tsx.)
 */
export default function StationChrome() {
  const route = useRoute();
  // The keychain is open on the page it was opened on, so a page change
  // (under the transition cover) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === route;
  const toggle = useCallback(() => setOpenOn((o) => (o === route ? null : route)), [route]);

  return (
    <>
      {/* Mounted with the chrome (under the transition cover), not lazily on
          the first click: a lazy chunk made the first open wait ≥300 ms
          (React throttles revealing a Suspense retry). Closed it is
          invisible and inert. Its card covers the glyphs when open; the
          Map pill stays above it (z-index, chrome.css). */}
      <Keychain open={open} />
      {/* One row, so the glyphs and the pill stay locked together in the
          corner at any size. */}
      <div className="station-chrome__row">
        <SocialLinks className="social-links--station" />
        <MapButton open={open} onToggle={toggle} />
      </div>
    </>
  );
}
