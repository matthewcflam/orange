import { useCallback, useState } from "react";
import { useRoute } from "../lib/router";
import MapButton from "../keychain/MapButton";
import Keychain from "../keychain/Keychain";
import SpeechBubble from "./SpeechBubble";

/**
 * Chrome on station pages (design/mockups-v2): the Map pill top-right and
 * "Matthew Lam" bottom-right, with the speech bubble. Mounted while the route
 * is a station page, so it persists from one station to the next. (The page
 * title is what goes home: pages/StationLayout.tsx.)
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
          invisible and inert. */}
      <Keychain open={open} />
      <MapButton open={open} onToggle={toggle} />
      <SpeechBubble />
      <p className="station-name">Matthew Lam</p>
    </>
  );
}
