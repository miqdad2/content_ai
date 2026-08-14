import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { DEPARTMENT_CATEGORY_MAP, BRAND_MEMORY_CATEGORIES } from "@/components/brand-memory/brandMemory.data";
import type { Department } from "@/components/departments/departments.data";
import type { DepartmentStoryContent } from "./departmentStory.data";

/**
 * UNIT 09 rhythm system — 4 named patterns instead of one uniform
 * `py-12 lg:py-16` repeated five times (the audit's #1 finding: every
 * chapter measured identically, so five in a row read as one block
 * repeated rather than a journey). "opening"/"closing" give the first and
 * last chapters extra room against their neighboring sections (the
 * lifecycle intro, the closed-loop CTA); "bridgeOut"/"bridgeIn" give the
 * two chapters touching Brand & Creative extra breathing room on the side
 * that faces it, since BrandCreativeSection's own outer sections are
 * tightly padded (`pb-4 pt-4` / `pb-4`) and rely on their neighbors for
 * separation. "standard" is the original baseline, kept for the one
 * chapter (Social Media) that isn't adjacent to a section boundary.
 */
const RHYTHM = {
  opening: "px-4 pb-12 pt-6 lg:px-6 lg:pb-16 lg:pt-8",
  standard: "px-4 py-12 lg:px-6 lg:py-16",
  bridgeOut: "px-4 pb-16 pt-12 lg:px-6 lg:pb-24 lg:pt-16",
  bridgeIn: "px-4 pb-12 pt-16 lg:px-6 lg:pb-16 lg:pt-24",
  closing: "px-4 pb-16 pt-12 lg:px-6 lg:pb-20 lg:pt-16",
} as const;

interface DepartmentStoryChapterProps {
  department: Department;
  story: DepartmentStoryContent;
  /** Which side the text column sits on at desktop widths — alternating
   * this per chapter is what keeps five sections from reading as five
   * identical cards (UNIT 07 brief §3/§4). Mobile always stacks text then
   * visual, regardless of this prop — see the plain (non-`lg:`) DOM order
   * below. */
  align: "left" | "right";
  /** Each department gets its own hand-built visual — deliberately not a
   * shared template, so "visual variety" (§18) is real, not simulated. */
  visual: ReactNode;
  /** Which spacing pattern this chapter uses — see RHYTHM above. Defaults
   * to "standard" so existing callers don't break. */
  rhythm?: keyof typeof RHYTHM;
}

/**
 * One chapter of the homepage marketing-lifecycle journey. Role and
 * capability copy are looked up from `department` (departments.data.ts) —
 * never re-typed here — so this can't drift from `/departments`' own
 * copy. Brand Memory category pills are looked up the same way, reusing
 * UNIT 06's DEPARTMENT_CATEGORY_MAP, so "which brand fields does this
 * department use" is asserted in exactly one place in the codebase.
 */
export function DepartmentStoryChapter({
  department,
  story,
  align,
  visual,
  rhythm = "standard",
}: DepartmentStoryChapterProps) {
  const categoryIds = DEPARTMENT_CATEGORY_MAP[department.id] ?? [];
  const categoryLabels = BRAND_MEMORY_CATEGORIES.filter((c) => categoryIds.includes(c.id)).map((c) => c.name);

  return (
    <section className={cn("mx-auto max-w-[1600px]", RHYTHM[rhythm])}>
      <Reveal className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className={align === "right" ? "lg:order-2" : "lg:order-1"}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              {story.step}
            </span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {department.role}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {story.headline}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">{story.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {department.capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-foreground/80"
              >
                {cap}
              </span>
            ))}
          </div>

          {categoryLabels.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-brand-cyan">Brand Memory</span>
              {categoryLabels.map((label) => (
                <span key={label}>· {label}</span>
              ))}
            </div>
          )}
        </div>

        <div className={cn(align === "right" ? "lg:order-1" : "lg:order-2")}>{visual}</div>
      </Reveal>
    </section>
  );
}
