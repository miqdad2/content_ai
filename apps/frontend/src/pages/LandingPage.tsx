import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Film,
  Image as ImageIcon,
  Layers3,
  Play,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

const FEATURES = [
  {
    icon: Film,
    title: "Prompt-to-video studio",
    description:
      "Choose the model, duration, format, references and audio style for every clip.",
  },
  {
    icon: ImageIcon,
    title: "Image generation",
    description:
      "Create clean campaign stills and reference images from the same workspace.",
  },
  {
    icon: Wand2,
    title: "Face swap",
    description:
      "Blend faces into source images for fast creative testing and personalization.",
  },
  {
    icon: Layers3,
    title: "Template renders",
    description:
      "Turn approved templates and avatars into repeatable, branded video outputs.",
  },
];

const STEPS = [
  "Describe the shot",
  "Attach references",
  "Pick output settings",
  "Render and remix",
];

export function LandingPage() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const signedIn = Boolean(session?.user);

  return (
    <div className="overflow-hidden">
      <section className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="absolute left-1/2 top-4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/15 blur-3xl" />
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary" />
            Generative media for videos, images and avatars
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Make production-ready AI media in one arena.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Video Arena brings video generation, image creation, face swaps and
            template renders into a focused creative workspace that feels fast,
            polished and easy to explore.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {signedIn ? (
              <Button asChild size="lg" className="rounded-full px-6">
                <Link to="/video">
                  Start creating
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                className="rounded-full px-6"
                onClick={() => setAuthOpen(true)}
              >
                Start creating
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full bg-background/60 px-6"
            >
              <Link to={signedIn ? "/user/templates" : "/video"}>
                Explore the studio
                <Play className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm">
            {[
              ["Video", "Prompt clips"],
              ["Image", "Reference art"],
              ["Avatar", "Personalized renders"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-10 top-14 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -right-10 bottom-8 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative rounded-[2rem] border bg-slate-950 p-3 shadow-2xl shadow-violet-950/25">
            <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.35),transparent_32%),linear-gradient(135deg,#111827,#020617)] p-5 text-white">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-violet-200">
                    Live brief
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    Summer product launch
                  </p>
                </div>
                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">
                  Ready
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="min-h-72 rounded-2xl bg-[radial-gradient(circle_at_35%_15%,rgba(255,255,255,0.9),transparent_14%),linear-gradient(160deg,#8b5cf6,#06b6d4_45%,#0f172a)] p-4">
                  <div className="flex h-full flex-col justify-between">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
                      <Play className="h-4 w-4" />
                      16:9 · 8s · audio
                    </div>
                    <div className="rounded-2xl bg-black/35 p-4 backdrop-blur">
                      <p className="text-sm text-violet-100">Prompt</p>
                      <p className="mt-1 text-lg font-medium">
                        A sleek bottle drifting through neon mist, cinematic
                        lighting.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {STEPS.map((step, index) => (
                    <div
                      key={step}
                      className="rounded-2xl border border-white/10 bg-white/10 p-4"
                    >
                      <p className="text-xs text-violet-200">
                        Step {index + 1}
                      </p>
                      <p className="mt-1 font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
                <Upload className="h-5 w-5 text-cyan-200" />
                <div>
                  <p className="text-sm font-medium">
                    Reference frames attached
                  </p>
                  <p className="text-xs text-slate-300">
                    Keep your generated media visually consistent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-[1.5rem] border bg-card/75 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/10"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
