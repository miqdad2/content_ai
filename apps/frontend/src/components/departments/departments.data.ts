/**
 * Single source of truth for the six cre8.ai marketing departments —
 * consumed by DepartmentSelector, DepartmentInfo, DepartmentScene3D (for
 * planet variant/color/layout) and DepartmentsPage (for the URL-hash deep
 * link + document title). Matches spec/CRE8_AI_SPEC.md §9 exactly; do not
 * add a 7th "Brand Memory" entry here — Brand Memory is the intelligence
 * layer that powers these six, not a department itself (see
 * DepartmentCore.tsx and DepartmentsPage's Brand Memory section).
 */

export type PlanetVariant =
  | "authority"
  | "ringed"
  | "energetic"
  | "atmospheric"
  | "satellites"
  | "segmented";

export interface Department {
  id: string;
  /** Full role title, shown in the info panel heading. */
  role: string;
  /** Compact label for the selector list. */
  shortLabel: string;
  mission: string;
  capabilities: string[];
  ctaLabel: string;
  planetVariant: PlanetVariant;
  /** Primary accent color for this department's planet + selector state. */
  color: string;
  /** Relative planet radius multiplier (1 = baseline). */
  size: number;
  /** Fixed position around the core, in degrees, 0 = top, clockwise —
   * matches the conceptual diagram in the UNIT 05 brief. Planets sit at
   * fixed angles (they don't revolve) so camera framing per department is
   * deterministic; see DepartmentScene3D for why. */
  angleDeg: number;
}

export const DEPARTMENTS: Department[] = [
  {
    id: "cmo",
    role: "Chief Marketing Officer",
    shortLabel: "CMO",
    mission: "Sets the strategic direction every other department works from.",
    capabilities: ["Marketing Strategies", "Trend Intelligence"],
    ctaLabel: "Enter cre8.ai",
    planetVariant: "authority",
    color: "#2f6fe0",
    size: 1.18,
    angleDeg: 0,
  },
  {
    id: "marketing-director",
    role: "Marketing Director",
    shortLabel: "Marketing Director",
    mission: "Turns strategic objectives into executable campaign plans.",
    capabilities: ["Marketing Campaigns", "Digital Marketing"],
    ctaLabel: "Enter cre8.ai",
    planetVariant: "ringed",
    color: "#4c8dff",
    size: 0.92,
    angleDeg: 60,
  },
  {
    id: "brand-creative",
    role: "Head of Brand & Creative",
    shortLabel: "Brand & Creative",
    mission: "Turns ideas into campaign-ready creative.",
    capabilities: ["AI Images", "AI Videos", "AI Music", "Logos", "Presentations", "Hashtags"],
    ctaLabel: "Create with cre8.ai",
    planetVariant: "energetic",
    color: "#38d9ff",
    size: 1.0,
    angleDeg: 120,
  },
  {
    id: "content-marketing",
    role: "Head of Content Marketing",
    shortLabel: "Content Marketing",
    mission: "Produces campaign-ready written content and prompts.",
    capabilities: ["Captions", "Prompts"],
    ctaLabel: "Enter cre8.ai",
    planetVariant: "atmospheric",
    color: "#5b73c4",
    size: 0.86,
    angleDeg: 180,
  },
  {
    id: "social-media",
    role: "Head of Social Media",
    shortLabel: "Social Media",
    mission: "Reaches audiences with voice, avatars and scheduled posting.",
    capabilities: ["AI Voiceovers", "AI Avatars", "Auto-Posting"],
    ctaLabel: "Enter cre8.ai",
    planetVariant: "satellites",
    color: "#55e6ff",
    size: 0.9,
    angleDeg: 240,
  },
  {
    id: "analytics",
    role: "Marketing Analytics Manager",
    shortLabel: "Analytics",
    mission: "Turns performance data into recommended next moves.",
    capabilities: ["AI Reports", "AI Insights"],
    ctaLabel: "Enter cre8.ai",
    planetVariant: "segmented",
    color: "#8fa8c9",
    size: 0.88,
    angleDeg: 300,
  },
];
