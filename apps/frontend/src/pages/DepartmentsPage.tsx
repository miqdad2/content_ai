import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { DepartmentUniverse } from "@/components/departments/DepartmentUniverse";
import { BRAND_MEMORY_CATEGORIES } from "@/components/brand-memory/brandMemory.data";
import { useSession } from "@/lib/auth-client";

/**
 * Public /departments — "Navigate your AI Marketing Department." Intro →
 * interactive department universe (DepartmentUniverse) → Brand Memory
 * relationship section → closing CTA. Brand Memory is deliberately
 * described only as product architecture ("designed to..."), never as an
 * already-implemented backend — see spec/CRE8_CURRENT_ARCHITECTURE.md,
 * which confirms no Brand Memory model exists yet.
 *
 * The full public Brand Memory explanation lives on the homepage
 * (BrandMemorySection, UNIT 06) — this teaser stays intentionally concise
 * and links back there rather than duplicating the category grid, core
 * visual, or department-highlight interaction. Category names below are
 * imported from the same shared data model so the terminology never drifts
 * between the two pages.
 */
export function DepartmentsPage() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const signedIn = Boolean(session?.user);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "cre8.ai Departments — Your AI Marketing Department";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Intro */}
      <section className="mx-auto max-w-[1600px] px-4 pb-4 pt-16 text-center lg:px-6 lg:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          The cre8.ai Marketing Universe
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Six departments. <span className="text-gradient">One intelligent marketing system.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          From strategy to analytics, every department is designed to work from one shared brand
          intelligence layer.
        </p>
      </section>

      <DepartmentUniverse />

      {/* Brand Memory relationship — conceptual only, see file header comment. */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 lg:px-6 lg:pb-20">
        <div className="glass-ambient glass-edge relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            One brand. One intelligence layer. Every department.
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            cre8.ai is designed so every department works from the same brand context.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Audience, tone, products and services, positioning, visual identity and campaign
            history — designed to flow into every department&rsquo;s output, so nothing gets
            generated in isolation.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {BRAND_MEMORY_CATEGORIES.map((category) => (
              <span
                key={category.id}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground"
              >
                {category.name}
              </span>
            ))}
          </div>
          <Link
            to="/#brand-memory"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            See the full Brand Memory experience
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-[1600px] px-4 pb-24 lg:px-6">
        <div className="glass-ambient glass-edge relative flex flex-col items-center justify-center gap-4 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Your <span className="text-gradient-warm">AI Marketing Department</span> is ready.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Enter cre8.ai and start working from strategy through to analytics — powered by one
            intelligent workspace.
          </p>
          {signedIn ? (
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/video">
                Enter cre8.ai
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="rounded-full px-6" onClick={() => setAuthOpen(true)}>
              Enter cre8.ai
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
