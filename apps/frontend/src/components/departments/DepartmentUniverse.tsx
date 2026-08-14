import { Suspense, lazy, useEffect, useState } from "react";
import { Scene3DErrorBoundary, Scene3DFallback } from "@/components/three/Scene3DFallback";
import { useSession } from "@/lib/auth-client";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { AuthModal } from "@/components/AuthModal";
import { DepartmentSelector } from "./DepartmentSelector";
import { DepartmentInfo } from "./DepartmentInfo";
import { DEPARTMENTS } from "./departments.data";

const DepartmentScene3D = lazy(() =>
  import("./DepartmentScene3D").then((m) => ({ default: m.DepartmentScene3D })),
);

/** Tuned to sit close in tone to the department scene's own background so
 * there's no jarring flash once the canvas mounts on top of it. */
const DEPARTMENTS_FALLBACK_GRADIENT =
  "radial-gradient(55rem 55rem at 50% 40%, oklch(0.4 0.13 250 / 42%), transparent 70%), radial-gradient(38rem 38rem at 70% 60%, oklch(0.6 0.15 200 / 18%), transparent 72%), oklch(0.08 0.015 258)";

function departmentIndexFromHash(): number {
  if (typeof window === "undefined") return 0;
  const id = window.location.hash.replace("#", "");
  const index = DEPARTMENTS.findIndex((d) => d.id === id);
  return index >= 0 ? index : 0;
}

/**
 * The interactive department universe: sticky 3D scene + DOM selector/info
 * panel on desktop, stacked scene-then-selector on mobile (see UNIT 05
 * report §"Mobile experience" for why this uses `position: sticky` rather
 * than scroll-hijacking camera logic). Selecting a department updates the
 * camera, the info panel, and the URL hash (`#department-id`) for
 * shareable deep links — reading that hash on mount is the only routing
 * side effect; changing it never triggers a route re-render.
 */
export function DepartmentUniverse() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);
  // Only one DepartmentSelector is ever mounted at a time — rendering both
  // and CSS-hiding one (the pattern used elsewhere in this codebase, e.g.
  // Navbar's desktop/mobile nav) would create duplicate `id`/`aria-controls`
  // targets here, since each tab has a unique id. Real interaction-QA
  // (Playwright) caught this as a literal "strict mode violation: resolved
  // to 2 elements" failure during UNIT 05 — see the report.
  const mobile = useMediaQuery("(max-width: 1023px)");

  useEffect(() => {
    setActiveIndex(departmentIndexFromHash());
  }, []);

  function handleSelect(index: number) {
    setActiveIndex(index);
    const dept = DEPARTMENTS[index];
    if (dept && typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${dept.id}`);
    }
  }

  const activeDepartment = DEPARTMENTS[activeIndex] ?? DEPARTMENTS[0]!;

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-14 lg:px-6 lg:py-20">
      {/* Mobile/tablet: scene sits above the selector, modest fixed height —
          never sticky, never taller than the content below it (UNIT 05
          brief §19: "no sticky 100vh scroll trap"). Desktop: scene is
          sticky in its own column so it stays framed while the selector
          list is used. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(300px,380px)_1fr] lg:gap-10">
        <div className="order-2 flex flex-col gap-5 lg:order-1">
          <DepartmentSelector
            activeIndex={activeIndex}
            onSelect={handleSelect}
            orientation={mobile ? "horizontal" : "vertical"}
          />
          <DepartmentInfo
            key={activeDepartment.id}
            department={activeDepartment}
            signedIn={signedIn}
            onCtaClick={() => setAuthOpen(true)}
          />
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl sm:aspect-video lg:aspect-square lg:h-[62vh] lg:max-h-[640px]">
            <Scene3DErrorBoundary
              label="department universe"
              fallback={<Scene3DFallback gradient={DEPARTMENTS_FALLBACK_GRADIENT} />}
            >
              <Suspense fallback={<Scene3DFallback gradient={DEPARTMENTS_FALLBACK_GRADIENT} />}>
                <DepartmentScene3D activeIndex={activeIndex} />
              </Suspense>
            </Scene3DErrorBoundary>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </section>
  );
}
