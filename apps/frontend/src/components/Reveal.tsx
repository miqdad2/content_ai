import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/useMediaQuery";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms — small, restrained values only (this is a single
   * soft arrival, not a choreographed sequence). */
  delayMs?: number;
  className?: string;
}

/**
 * Soft one-time entrance for a section — opacity + a small translateY,
 * triggered once via IntersectionObserver and never repeated on scroll-back
 * (the observer disconnects after the first intersection). Added in
 * UNIT 09 specifically for the department-story chapters, which the
 * homepage audit found read as visually monotonous back-to-back — this is
 * the "materially improves cohesion" case the brief's motion section asks
 * for, not decoration applied everywhere.
 *
 * Under `prefers-reduced-motion`, renders the final state immediately with
 * no observer at all — content is never gated behind motion.
 */
export function Reveal({ children, delayMs = 0, className }: RevealProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-(--ease-standard)",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
      style={visible && delayMs ? undefined : { transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
