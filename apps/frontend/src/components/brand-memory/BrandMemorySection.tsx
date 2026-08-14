import { Suspense, lazy, useRef, useState, type KeyboardEvent } from "react";
import { InViewMount } from "@/components/InViewMount";
import { Scene3DErrorBoundary, Scene3DFallback } from "@/components/three/Scene3DFallback";
import { DEPARTMENTS } from "@/components/departments/departments.data";
import { cn } from "@/lib/utils";
import { BrandMemoryCategoryPanel } from "./BrandMemoryCategoryPanel";
import { BRAND_MEMORY_CATEGORIES, DEPARTMENT_CATEGORY_MAP } from "./brandMemory.data";

const BrandCoreScene3D = lazy(() =>
  import("./BrandCoreScene3D").then((m) => ({ default: m.BrandCoreScene3D })),
);

const BRAND_MEMORY_FALLBACK_GRADIENT =
  "radial-gradient(48rem 48rem at 50% 45%, oklch(0.4 0.13 250 / 40%), transparent 70%), radial-gradient(34rem 34rem at 65% 60%, oklch(0.6 0.15 200 / 16%), transparent 72%), oklch(0.08 0.015 258)";

const ONBOARDING_STEPS = ["Create Brand", "Add Brand Context", "Review Brand Memory", "Enter Mission Control"];

/**
 * Toggle-button department picker for this section — deliberately NOT a
 * reuse of departments/DepartmentSelector.tsx. That component's
 * `aria-controls` assumes a single tabpanel per department (UNIT 05's
 * role+mission info panel); here, selecting a department highlights
 * *multiple* category panels at once, which is a "filter" relationship,
 * not a one-panel-per-tab one. Using `role="radiogroup"`/`role="radio"`
 * instead of a tablist keeps the ARIA semantics honest — each highlighted
 * panel already self-documents via its visible "Used by {department}"
 * label, so no `aria-controls` wiring is needed for correctness.
 */
function DepartmentPicker({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusAndSelect(index: number) {
    const wrapped = (index + DEPARTMENTS.length) % DEPARTMENTS.length;
    onSelect(wrapped);
    buttonRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusAndSelect(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusAndSelect(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusAndSelect(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusAndSelect(DEPARTMENTS.length - 1);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Highlight brand memory fields used by department"
      className="flex flex-wrap justify-center gap-2"
    >
      {DEPARTMENTS.map((dept, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={dept.id}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-(--duration-control) ease-(--ease-standard)",
              active
                ? "border-primary/50 bg-primary/12 text-foreground"
                : "border-white/10 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/40")}
            />
            {dept.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The flagship public Brand Memory explanation — "One brand. One memory.
 * Every department." Central intelligence-core visual (decorative,
 * skippable — see Scene3DErrorBoundary fallback), a department picker that
 * highlights which of the six category panels each department is designed
 * to consume, a four-step onboarding teaser, and a multi-brand line. No
 * backend, no persistence, no upload API — public storytelling only, see
 * file header comments on brandMemory.data.ts.
 */
export function BrandMemorySection() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeDepartment = DEPARTMENTS[activeIndex] ?? DEPARTMENTS[0]!;
  const activeCategoryIds = new Set(DEPARTMENT_CATEGORY_MAP[activeDepartment.id] ?? []);

  return (
    <section id="brand-memory" className="mx-auto max-w-[1600px] scroll-mt-24 px-4 py-16 lg:px-6 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">AI Brand Memory</p>
        <h2 className="mx-auto mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          One brand. <span className="text-gradient">One memory. Every department.</span>
        </h2>
        <p className="mx-auto mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
          Your audience, tone, visual identity, products, positioning and campaign context —
          designed to stay consistent across the entire cre8.ai marketing system.
        </p>
      </div>

      <div className="relative mx-auto mt-10 h-[300px] w-full max-w-3xl overflow-hidden rounded-3xl sm:h-[360px] lg:h-[420px]">
        <InViewMount className="h-full w-full" fallback={<Scene3DFallback gradient={BRAND_MEMORY_FALLBACK_GRADIENT} />}>
          <Scene3DErrorBoundary
            label="brand memory core"
            fallback={<Scene3DFallback gradient={BRAND_MEMORY_FALLBACK_GRADIENT} />}
          >
            <Suspense fallback={<Scene3DFallback gradient={BRAND_MEMORY_FALLBACK_GRADIENT} />}>
              <BrandCoreScene3D activeIndex={activeIndex} />
            </Suspense>
          </Scene3DErrorBoundary>
        </InViewMount>
      </div>

      <div className="mt-8">
        <DepartmentPicker activeIndex={activeIndex} onSelect={setActiveIndex} />
      </div>

      <p className="mx-auto mt-4 max-w-md text-center text-xs text-muted-foreground" aria-live="polite">
        Fields highlighted below are designed for use by{" "}
        <span className="font-medium text-foreground">{activeDepartment.role}</span>.
      </p>

      <div className="mx-auto mt-6 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BRAND_MEMORY_CATEGORIES.map((category) => (
          <BrandMemoryCategoryPanel
            key={category.id}
            category={category}
            emphasized={activeCategoryIds.has(category.id)}
            departmentLabel={activeDepartment.shortLabel}
          />
        ))}
      </div>

      {/* Onboarding teaser — conceptual only, no functionality yet (see
          UNIT 06 brief §13). */}
      <div className="mx-auto mt-14 max-w-4xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Designed onboarding path
        </p>
        <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-2">
          {ONBOARDING_STEPS.map((step, i) => (
            <div key={step} className="flex flex-1 items-center gap-2 sm:flex-none">
              <div className="glass-light flex min-h-11 flex-1 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm sm:flex-none">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-foreground/90">{step}</span>
              </div>
              {i < ONBOARDING_STEPS.length - 1 && (
                <span aria-hidden="true" className="hidden text-muted-foreground/50 sm:inline">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Multi-brand value — "designed for," not a claim that multi-brand
          persistence is implemented (see UNIT 06 brief §14). */}
      <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground">
        Designed for agencies, consultants and teams managing more than one brand — one workspace,
        or an entire portfolio.
      </p>

      {/* Transition line into the marketing-lifecycle journey below — the
          same restrained device used before the footer, so the page reads
          as one continuous system rather than a stack of unrelated blocks
          (UNIT 09 §7). */}
      <div
        aria-hidden="true"
        className="mx-auto mt-14 h-px max-w-3xl bg-gradient-to-r from-transparent via-primary/25 to-transparent lg:mt-16"
      />
    </section>
  );
}
