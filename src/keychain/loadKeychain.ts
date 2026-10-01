/** The keychain chunk (Keychain.tsx and its charm images) loads on demand:
 *  hovering Map prefetches it, the first open mounts it. */
export const loadKeychain = () => import("./Keychain");
