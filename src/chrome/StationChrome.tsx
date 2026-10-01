import { lazy, Suspense, useCallback, useState } from "react";
import { useRoute } from "../lib/router";
import MapButton from "../keychain/MapButton";
import SpeechBubble from "./SpeechBubble";
import { loadKeychain } from "../keychain/loadKeychain";

const Keychain = lazy(loadKeychain);

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
  // Mounted on first open, then kept (hidden and asleep while closed).
  const [mounted, setMounted] = useState(false);
  const toggle = useCallback(() => {
    setMounted(true);
    setOpenOn((o) => (o === route ? null : route));
  }, [route]);

  return (
    <>
      {mounted && (
        <Suspense fallback={null}>
          <Keychain open={open} />
        </Suspense>
      )}
      <MapButton open={open} onToggle={toggle} />
      <SpeechBubble />
      <p className="station-name">Matthew Lam</p>
    </>
  );
}
