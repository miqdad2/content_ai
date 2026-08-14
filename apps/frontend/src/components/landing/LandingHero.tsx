import { Suspense, lazy, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { useSession } from "@/lib/auth-client";
import { Scene3DErrorBoundary, Scene3DFallback } from "@/components/three/Scene3DFallback";

/**
 * The 3D scene (and its `three` / `@react-three/fiber` / `@react-three/drei`
 * dependency graph) is code-split via `lazy()` so it never blocks the
 * initial paint of the headline/CTA — see UNIT 04 report §"Canvas loading".
 */
const HeroScene3D = lazy(() =>
  import("./HeroScene3D").then((m) => ({ default: m.HeroScene3D })),
);

/** Tuned to sit close in tone to the hero canvas's own background/lighting
 * so there's no jarring flash once the canvas mounts on top of it. */
const HERO_FALLBACK_GRADIENT =
  "radial-gradient(60rem 60rem at 78% 45%, oklch(0.42 0.14 250 / 45%), transparent 68%), radial-gradient(40rem 40rem at 92% 28%, oklch(0.62 0.16 200 / 22%), transparent 70%), oklch(0.08 0.015 258)";

/**
 * Cinematic landing hero — "Your AI Marketing Department." DOM content
 * (headline, copy, CTAs, micro-UI) is always regular, accessible markup;
 * the 3D scene is a purely decorative background layer behind it (see
 * HeroScene3D). No essential copy lives inside the canvas.
 */
export function LandingHero() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const signedIn = Boolean(session?.user);

  return (
    <section className="relative isolate flex min-h-[90vh] flex-col justify-center overflow-hidden bg-background">
      <Scene3DErrorBoundary label="hero" fallback={<Scene3DFallback gradient={HERO_FALLBACK_GRADIENT} />}>
        <Suspense fallback={<Scene3DFallback gradient={HERO_FALLBACK_GRADIENT} />}>
          <div className="absolute inset-0 -z-10">
            <HeroScene3D />
          </div>
        </Suspense>
      </Scene3DErrorBoundary>

      {/* Readability scrim — guarantees text contrast over the scene
          regardless of exactly what renders behind it at that point. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-r from-background via-background/55 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-20 lg:px-6">
        <div className="max-w-[720px]">
          <div className="glass-light mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            AI Marketing Operating System
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Your <span className="text-gradient">AI Marketing Department.</span>
          </h1>
          <p className="mt-4 text-lg font-medium text-foreground/90 sm:text-xl">
            Strategize. Create. Launch. Analyze.
          </p>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Strategy, campaigns, creative, content, social media and analytics — powered by one
            intelligent brand-aware workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link to="/departments">
                Explore Departments
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/*
            Deliberately does NOT say "Brand Memory: Online" — that backend
            doesn't exist yet (see spec/CRE8_CURRENT_ARCHITECTURE.md). Both
            lines describe the product category, not a live operational
            state.
          */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />
              AI Marketing System
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              6 Departments
            </span>
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </section>
  );
}
