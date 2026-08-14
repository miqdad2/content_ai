/**
 * Public-storytelling model for AI Brand Memory — consumed by
 * BrandMemorySection (homepage), BrandCoreScene3D, and the department-page
 * teaser. This is NOT a data model for an actual editor: no persistence,
 * no upload API, no Prisma model exists yet (see
 * spec/CRE8_CURRENT_ARCHITECTURE.md). It exists purely to explain the
 * product architecture to a public visitor.
 *
 * The 8 raw field groups from spec/CRE8_AI_SPEC.md §7 are consolidated
 * here into 6 display categories ("group them intelligently," not 40 tiny
 * chips) — Positioning + Voice merge into "Voice & Positioning" and
 * Marketing Context + Brand Files merge into "Marketing Context".
 */

export interface BrandMemoryCategory {
  id: string;
  name: string;
  fields: string[];
}

export const BRAND_MEMORY_CATEGORIES: BrandMemoryCategory[] = [
  {
    id: "identity",
    name: "Brand Identity",
    fields: ["Brand name", "Logo", "Tagline", "Industry", "Website", "Company description"],
  },
  {
    id: "visual",
    name: "Visual Identity",
    fields: ["Colors", "Fonts", "Visual style", "Image references", "Logo rules"],
  },
  {
    id: "market",
    name: "Market & Audience",
    fields: ["Target audience", "Primary market", "Customer segments", "Competitors"],
  },
  {
    id: "voice",
    name: "Positioning & Voice",
    fields: ["USP & differentiators", "Brand values", "Tone of voice", "Writing style", "Words to use/avoid"],
  },
  {
    id: "products",
    name: "Products & Services",
    fields: ["Offerings", "Key features", "Key benefits", "Pricing context"],
  },
  {
    id: "context",
    name: "Marketing Context",
    fields: ["Previous campaigns", "Approved messaging", "Campaign goals", "Preferred channels", "Brand files"],
  },
];

/**
 * Which categories each department is designed to consume — the public
 * demonstration that Brand Memory is functional architecture, not a
 * profile page (see UNIT 06 brief §10). Keyed by the same department `id`
 * values as departments.data.ts, referenced loosely by string id (rather
 * than importing the Department type) to avoid a hard dependency between
 * the brand-memory/ and departments/ component groups.
 */
export const DEPARTMENT_CATEGORY_MAP: Record<string, string[]> = {
  cmo: ["market", "context"],
  "marketing-director": ["market", "context", "products"],
  "brand-creative": ["identity", "visual", "products"],
  "content-marketing": ["voice", "market"],
  "social-media": ["voice", "context", "market"],
  analytics: ["context"],
};
