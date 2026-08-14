import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { GlassWorkspacePreview } from "@/components/GlassWorkspacePreview";
import { LandingHero } from "@/components/landing/LandingHero";
import { BrandMemorySection } from "@/components/brand-memory/BrandMemorySection";
import { DepartmentJourneySection } from "@/components/story/DepartmentJourneySection";
import { BrandCreativeSection } from "@/components/brand-creative/BrandCreativeSection";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * cre8.ai landing page.
 *
 * The hero (cinematic 3D "Your AI Marketing Department" scene) lives in
 * LandingHero — see src/components/landing/. The marketing-lifecycle
 * storytelling journey (CMO → Marketing Director → Brand & Creative →
 * Content Marketing → Social Media → Analytics) lives in
 * DepartmentJourneySection + BrandCreativeSection (UNIT 07/08) — the
 * existing showcase videos moved into BrandCreativeSection in UNIT 08,
 * verbatim, per the client's explicit request to keep every existing video
 * on the homepage. This file now only owns the hero, workspace preview,
 * Brand Memory, the journey composition, and the final closing CTA.
 */
export function LandingPage() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const signedIn = Boolean(session?.user);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Supports the "See the full Brand Memory experience" link on
  // /departments (see DepartmentsPage.tsx) — a same-document `<a href="#…">`
  // wouldn't need this, but this is a cross-route Link, so on mount here we
  // check for a matching hash ourselves and scroll to it. Client-side route
  // changes don't trigger the browser's native hash-scroll behavior.
  useEffect(() => {
    if (window.location.hash !== "#brand-memory") return;
    const target = document.getElementById("brand-memory");
    target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UNIT 09: renamed from "Start creating" — the final CTA now matches the
  // hero's own primary action exactly ("Enter cre8.ai" → /video signed-in,
  // → auth modal signed-out), so the page's first and last conversion
  // moments read as the same promise, not two different offers.
  const enterCre8Ai = signedIn ? (
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
  );

  return (
    <div className="relative overflow-hidden">
      <LandingHero />

      {/* Workspace preview — relocated out of the hero in UNIT 04, still
          here per UNIT 09's re-audit: it still helps (nothing later in the
          journey shows the actual interface), it's close enough to the hero
          to read as "here's what that looks like" rather than a repeat, and
          it doesn't claim Mission Control exists yet — "a glimpse of the
          workspace" is deliberately conditional language, not a feature
          claim. Eyebrow added in UNIT 09 for typography consistency with
          every other homepage section (this was the one section missing
          one). */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 lg:px-6 lg:pb-20 lg:pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            A glimpse of the workspace
          </p>
          <h2 className="mt-4 text-lg font-semibold">Inside the workspace</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prompt, generate and iterate — video, images and templates from one focused
            interface.
          </p>
        </div>
        <div className="mt-8">
          <GlassWorkspacePreview signedIn={signedIn} onSignInRequired={() => setAuthOpen(true)} />
        </div>
      </section>

      {/* Brand Memory — the flagship public explanation, placed right after
          the strongest existing product-introduction section per UNIT 06's
          "do not reorder the homepage" instruction. */}
      <BrandMemorySection />

      {/* Marketing-lifecycle storytelling — CMO → Marketing Director →
          Brand & Creative → Content Marketing → Social Media → Analytics →
          closed loop. BrandCreativeSection renders as the journey's
          `children` slot, positioned between Marketing Director and
          Content Marketing per UNIT 08's required narrative order; it also
          carries every video previously rendered directly in this file
          (Featured carousel + Explore-wall masonry), moved verbatim. */}
      <DepartmentJourneySection>
        <BrandCreativeSection />
      </DepartmentJourneySection>

      {/* Final CTA — redesigned in UNIT 09. Was a violet/lavender wash
          (the last remaining legacy hue on the homepage) around generic
          "next piece of content" copy; now a renewed blue atmosphere
          (`.cre8-blue-haze`, defined but unused since UNIT 03) around the
          brief's exact recommended narrative, mirroring the hero's own
          primary CTA so the page's opening and closing promises match. */}
      <section className="relative mx-auto max-w-[1600px] px-4 pb-20 pt-4 lg:px-6 lg:pb-28 lg:pt-8">
        <div
          aria-hidden="true"
          className="cre8-blue-haze pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[36rem] opacity-70 md:opacity-100"
        />
        <div className="glass-ambient glass-edge relative overflow-hidden flex flex-col items-center justify-center gap-4 rounded-3xl p-10 text-center sm:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Ready when you are
          </p>
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Your <span className="text-gradient">marketing department</span> is ready.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Build the brand context. Activate the departments. Start creating.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            {enterCre8Ai}
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link to="/departments">Explore Departments</Link>
            </Button>
          </div>
        </div>

        {/* Horizon line — a deliberate, one-time transition into the
            footer rather than a sudden stop (§7); Footer.tsx already
            carries its own faint continuation wash immediately below this. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-16 h-px max-w-3xl bg-gradient-to-r from-transparent via-primary/25 to-transparent lg:mt-20"
        />
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
