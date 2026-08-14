/**
 * Shared cre8.ai 3D palette + scene defaults — extracted in UNIT 05 so the
 * landing hero and department universe scenes stay visually coherent
 * without copy-pasting hex values between them. Mirrors the CSS token
 * system in index.css (electric blue primary, cyan secondary, deep
 * navy/black base) but as plain values, since Three.js materials need raw
 * colors rather than CSS custom properties.
 */
export const THREE_COLORS = {
  /** Primary electric blue — matches --primary in index.css. */
  primary: "#4c8dff",
  /** Deeper primary, used for shadowed/receding surfaces. */
  primaryDeep: "#2f6fe0",
  /** Secondary cyan accent — matches --brand-cyan. */
  cyan: "#55e6ff",
  cyanDeep: "#38d9ff",
  /** Cool ice/steel neutrals for structural details (rings, hulls). */
  ice: "#d7e4f5",
  steel: "#8fa8c9",
  /** Restrained indigo, used sparingly per the design system's "subtle
   * indigo where necessary" allowance — never a dominant hue. */
  indigo: "#5b73c4",
  /** Near-black planet/core body color, shared by hero + department
   * planets so every celestial object reads as part of one universe. */
  bodyDark: "#080d1a",
  /** Canvas clear color. */
  spaceBlack: "#04070e",
} as const;

/** Capped device-pixel-ratio range for every cre8.ai Canvas — avoids
 * over-rendering on high-DPI displays. */
export const SCENE_DPR: [number, number] = [1, 1.5];
