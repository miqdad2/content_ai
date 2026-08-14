import { Component, type ReactNode } from "react";

interface Scene3DFallbackProps {
  /** CSS `background` value — each scene passes its own tuned gradient so
   * the fallback sits close in tone to that scene's actual canvas. */
  gradient: string;
}

/**
 * Static CSS gradient shown while a lazy-loaded 3D scene loads, and
 * permanently if it fails (WebGL unavailable / context creation error /
 * low-power device). Shared by the landing hero and department universe —
 * extracted from UNIT 04's HeroSceneFallback in UNIT 05.
 */
export function Scene3DFallback({ gradient }: Scene3DFallbackProps) {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: gradient }} />
  );
}

interface Scene3DErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  /** Short label used only in the console warning, e.g. "hero" or
   * "department universe" — helps distinguish which scene failed. */
  label: string;
}

/** Catches render errors from a 3D scene subtree and swaps in a static
 * fallback rather than crashing the page. Expected to trigger on
 * WebGL-unavailable / low-power environments — a warning, not an error. */
export class Scene3DErrorBoundary extends Component<
  Scene3DErrorBoundaryProps,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn(`cre8.ai ${this.props.label} 3D scene failed to render; showing static fallback.`, error);
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
