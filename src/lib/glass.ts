import { createContext, useContext } from "react";

/**
 * The glass layer (z40, above the screen door): things painted *on* the
 * screen, like the "who?" spray, portal into it. App owns the element.
 */
export const GlassContext = createContext<HTMLElement | null>(null);

export const useGlass = () => useContext(GlassContext);
