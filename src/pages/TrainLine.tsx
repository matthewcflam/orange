import { useLayoutEffect, useRef } from "react";
import { trainDrop } from "../lib/trainLine";

/** A station page's vertical line. It drops in like a train once the page is
 *  on screen (lib/trainLine.ts); position and length come from CSS. */
export default function TrainLine({ className }: { className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => trainDrop(ref.current!), []);
  return <div ref={ref} className={`train-line ${className}`} aria-hidden="true" />;
}
