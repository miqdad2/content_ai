import { useEffect, useRef, useState, type ReactNode } from "react";

interface InViewMountProps {
  children: ReactNode;
  fallback: ReactNode;
  className?: string;
  /** How early to mount before the wrapper actually enters the viewport —
   * generous by default so the swap from fallback to the real content
   * happens well before the user scrolls to it, not visibly mid-scroll. */
  rootMargin?: string;
}

/**
 * Defers mounting expensive children (a 3D Canvas) until the wrapper
 * scrolls near the viewport, instead of the moment the page renders
 * regardless of scroll position. Added in UNIT 09: the homepage audit found
 * BrandMemorySection's Canvas (and its lazy-loaded three/fiber/drei chunk)
 * starts fetching and initializing immediately on page load even though the
 * section sits ~2270px down the page. Mounts once via IntersectionObserver
 * and never re-gates on scroll-back — this only changes *when* the canvas
 * mounts, not anything about its own rendering loop or ambient motion.
 */
export function InViewMount({ children, fallback, className, rootMargin = "600px 0px" }: InViewMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {mounted ? children : fallback}
    </div>
  );
}
