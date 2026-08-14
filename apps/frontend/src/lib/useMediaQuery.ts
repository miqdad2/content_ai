import { useEffect, useState } from "react";

/** Reactive `window.matchMedia` subscription. Used by the hero 3D scene to
 * gate reduced-motion and mobile-quality behavior — kept as a shared hook
 * since both checks are needed together in more than one place. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
