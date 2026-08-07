import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { GlassWorkspacePreview } from "@/components/GlassWorkspacePreview";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

/**
 * content.ai landing page.
 *
 * A featured carousel of cinematic AI clips sits above a dense, autoplaying
 * masonry wall. Every clip is real output generated on OpenRouter and stored
 * in apps/frontend/public/showcase (regenerate via
 * `bun run --cwd apps/backend scripts/generate-showcase.ts`).
 */
type Aspect = "portrait" | "landscape" | "square" | "tall";
type Category = "Viral" | "Sport" | "Game";

interface ShowcaseClip {
  /** Uppercase display title shown on the card. */
  title: string;
  /** The prompt that generated the clip (shown as a caption / on hover). */
  prompt: string;
  /** Model label shown as a primary-colored badge, e.g. "kling-v3.0". */
  model: string;
  category: Category;
  aspect: Aspect;
  /** Public video URL served from /public. */
  src: string;
}

const SHOWCASE: ShowcaseClip[] = [
  {
    title: "STORM GIANT",
    prompt:
      "Cinematic blockbuster opening — a giant emerges from storm clouds, casually deflects a fighter jet with a finger snap. Anamorphic, hyper-real.",
    model: "seedance-2.0-fast",
    category: "Viral",
    aspect: "landscape",
    src: "/showcase/storm-giant.mp4",
  },
  {
    title: "DRIFT RACING",
    prompt:
      "Tokyo night street racing — cars drift and donut around the character, low angles and 35mm film grain, blockbuster reveal.",
    model: "seedance-2.0-fast",
    category: "Viral",
    aspect: "landscape",
    src: "/showcase/drift-racing.mp4",
  },
  {
    title: "FOOTBALL INVADER",
    prompt:
      "Spectator sprints from the stands, jumps fences, evades security, charges onto the pitch and strikes — all in one continuous telephoto take.",
    model: "seedance-2.0-fast",
    category: "Sport",
    aspect: "landscape",
    src: "/showcase/football-invader.mp4",
  },
  {
    title: "NIGHT VISION",
    prompt:
      "A static night-vision monochrome green shot — person in a leather jacket walks into frame, leans into the camera, then walks away into the night.",
    model: "seedance-2.0",
    category: "Viral",
    aspect: "landscape",
    src: "/showcase/night-vision.mp4",
  },
  {
    title: "BASEBALL GAME",
    prompt:
      "A baseball game broadcast shot — person sits in stadium stands in a team jersey, posing softly like a viral stargirl moment caught on live TV.",
    model: "kling-v3.0",
    category: "Viral",
    aspect: "tall",
    src: "/showcase/baseball-game.mp4",
  },
  {
    title: "CGI BREAKDOWN",
    prompt:
      "CGI breakdown reveal — mesh to beauty pass, each render layer cuts in sequence, turntable camera, ending on the final polished visual.",
    model: "seedance-2.0",
    category: "Viral",
    aspect: "square",
    src: "/showcase/cgi-breakdown.mp4",
  },
  {
    title: "FINAL SERVE",
    prompt:
      "Mid-2000s broadcast tennis final — match point won, raw exhaustion and emotion, crowd erupting, character waves in close-up.",
    model: "seedance-2.0",
    category: "Sport",
    aspect: "portrait",
    src: "/showcase/final-serve.mp4",
  },
  {
    title: "NIGHTLINE",
    prompt:
      "A retro polygonal cyberpunk noir character select screen — character in a glossy latex suit takes a boxing guard then draws a knife in a dim sepia alley.",
    model: "kling-v3.0",
    category: "Game",
    aspect: "portrait",
    src: "/showcase/nightline.mp4",
  },
  {
    title: "APEX HUNTER",
    prompt:
      "A retro low-poly racing game cover — character rides a silver-white futuristic motorcycle down a night highway, accelerating into blue flames.",
    model: "kling-v3.0",
    category: "Game",
    aspect: "tall",
    src: "/showcase/apex-hunter.mp4",
  },
  {
    title: "DRAGON FANTASY",
    prompt:
      "A retro low-poly fantasy RPG scene — character in traditional robes commands a white serpent dragon, lands in a heroic pose with a dreamy lavender palette.",
    model: "kling-v3.0",
    category: "Game",
    aspect: "portrait",
    src: "/showcase/dragon-fantasy.mp4",
  },
  {
    title: "KUNG FU HIT",
    prompt:
      "Dojo combat CGI — a single sensei strike sends the character recoiling in slow-motion, leaving solid energy copies before a final flash counter ends it.",
    model: "seedance-2.0-fast",
    category: "Viral",
    aspect: "landscape",
    src: "/showcase/kung-fu-hit.mp4",
  },
  {
    title: "FREE FALL",
    prompt:
      "Android free-falls from a cyberpunk skyscraper, body parts snapping together mid-air — mechanical impacts, servo locks, and violent wind.",
    model: "seedance-2.0",
    category: "Viral",
    aspect: "tall",
    src: "/showcase/free-fall.mp4",
  },
  {
    title: "RED THREAD",
    prompt:
      "A dark cinematic game menu — androgynous figure with platinum hair and katana performs a sharp wuxia slash sequence amid drifting red threads.",
    model: "seedance-2.0-fast",
    category: "Game",
    aspect: "tall",
    src: "/showcase/red-thread.mp4",
  },
  {
    title: "SUMMER HAZE",
    prompt:
      "A dreamy lomo-style home movie — friend handheld-films the person across mountains, lake, and grass fields in 6 hazy pastel shots with light leaks and soft film grain.",
    model: "seedance-2.0-fast",
    category: "Viral",
    aspect: "portrait",
    src: "/showcase/summer-haze.mp4",
  },
  {
    title: "IN THE DARK",
    prompt:
      "An early-2000s polygonal survival-horror loading screen — character with a flashlight in a misty night forest, dim sodium light and fog.",
    model: "kling-v3.0",
    category: "Game",
    aspect: "landscape",
    src: "/showcase/in-the-dark.mp4",
  },
];

const FEATURED = SHOWCASE.filter((c) => c.aspect === "landscape" || c.aspect === "square");

const ASPECT_CLASS: Record<Aspect, string> = {
  portrait: "aspect-[3/4]",
  landscape: "aspect-video",
  square: "aspect-square",
  tall: "aspect-[9/16]",
};

function Clip({ src, className }: { src: string; className?: string }) {
  return (
    <video
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

/** A large featured card with a title/caption below it. */
function FeaturedCard({ clip }: { clip: ShowcaseClip }) {
  return (
    <div className="group w-[300px] shrink-0 snap-start sm:w-[440px] lg:w-[520px]">
      <div className="glass-light relative overflow-hidden rounded-3xl shadow-lg shadow-black/15 transition-all duration-(--duration-surface) ease-(--ease-standard) motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:border-glass-border-elevated motion-safe:group-hover:shadow-xl">
        <Clip
          src={clip.src}
          className="aspect-video h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.015]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        <span className="absolute bottom-3 right-3 rounded-md bg-primary px-2 py-0.5 text-xs font-extrabold tracking-tight text-primary-foreground">
          4K
        </span>
        <span className="glass-light absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium text-white">
          {clip.model}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-foreground">
        {clip.title}
      </h3>
      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{clip.prompt}</p>
    </div>
  );
}

function MasonryTile({ clip }: { clip: ShowcaseClip }) {
  return (
    <div className="glass-light group relative mb-6 break-inside-avoid overflow-hidden rounded-3xl shadow-lg shadow-black/20 transition-all duration-(--duration-surface) ease-(--ease-standard) motion-safe:hover:-translate-y-1 motion-safe:hover:border-glass-border-elevated motion-safe:hover:shadow-xl">
      <div className={`relative w-full ${ASPECT_CLASS[clip.aspect]}`}>
        <Clip
          src={clip.src}
          className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.02]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />

        <span className="glass-light absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium text-white">
          {clip.model}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
          {clip.category}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h4 className="text-sm font-bold uppercase tracking-wide text-white drop-shadow">
            {clip.title}
          </h4>
          <p className="mt-1 line-clamp-2 max-h-0 overflow-hidden text-sm leading-5 text-white/85 opacity-0 transition-all duration-300 group-hover:max-h-20 group-hover:opacity-100">
            {clip.prompt}
          </p>
        </div>
      </div>
    </div>
  );
}

interface Banner {
  title: string;
  kicker: string;
  subtitle: string;
  src: string;
  /** Poster shown while the video loads and as a fallback if it fails to play. */
  poster: string;
}

/**
 * Big featured template banners. Empty pending approved Kuwait/GCC motion
 * assets — the two previous entries referenced third-party movie/celebrity
 * footage (a real film title and a real recording artist's name) and were
 * removed rather than relabeled. Drop new { title, kicker, subtitle, src,
 * poster } objects in here to bring this section back; no other code needs
 * to change — the section below renders nothing while this stays empty.
 */
const TEMPLATE_BANNERS: Banner[] = [];

function TemplateBanner({ banner, cta }: { banner: Banner; cta: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  const label = `${banner.title} — ${banner.subtitle}`;
  return (
    <div className="glass-light group relative overflow-hidden rounded-3xl shadow-2xl shadow-black/40">
      {failed ? (
        <img
          src={banner.poster}
          alt={label}
          className="aspect-[16/11] w-full object-cover sm:aspect-[16/6]"
        />
      ) : (
        <video
          className="aspect-[16/11] w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105 sm:aspect-[16/6]"
          src={banner.src}
          poster={banner.poster}
          aria-label={label}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      )}
      {/* Localized scrim only in the bottom-left corner — keeps most of the video bright. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-background/80 via-background/15 to-transparent" />

      <span className="absolute right-4 top-4 -skew-x-6 rounded bg-primary px-2.5 py-0.5 text-base font-extrabold tracking-tight text-primary-foreground sm:right-6 sm:top-6 sm:text-xl">
        4K
      </span>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex max-w-2xl flex-col items-start p-5 text-left sm:p-8">
        <span className="rounded-full bg-background/55 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur sm:text-xs">
          {banner.kicker}
        </span>
        <h3 className="mt-2 text-3xl font-extrabold uppercase tracking-tight text-primary drop-shadow-[0_2px_18px_rgba(0,0,0,0.8)] sm:text-5xl">
          {banner.title}
        </h3>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-white/90 drop-shadow sm:text-base">
          {banner.subtitle}
        </p>
        <div className="pointer-events-auto mt-4">{cta}</div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const signedIn = Boolean(session?.user);

  const tryTemplate = signedIn ? (
    <Button asChild size="lg" className="rounded-full px-8">
      <Link to="/user/templates">Try template</Link>
    </Button>
  ) : (
    <Button size="lg" className="rounded-full px-8" onClick={() => setAuthOpen(true)}>
      Try template
    </Button>
  );

  const startCreating = signedIn ? (
    <Button asChild size="lg" className="rounded-full px-6">
      <Link to="/video">
        Start creating
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  ) : (
    <Button size="lg" className="rounded-full px-6" onClick={() => setAuthOpen(true)}>
      Start creating
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="relative overflow-hidden">
      {/* Shared atmospheric stage behind hero → Featured, so the page reads
          as one continuous lit environment instead of dropping into a flat
          gallery right after the hero. Plain gradients only (no
          backdrop-filter), so this adds zero new blur surfaces; capped
          height keeps it out of the darker lower page. Lighter on small
          screens per the brief's "reduce decorative lighting density"
          mobile guidance. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-375 opacity-70 md:opacity-100"
        style={{
          background:
            "radial-gradient(64rem 44rem at 58% -4rem, oklch(0.78 0.13 320 / 20%), transparent 72%), radial-gradient(50rem 38rem at 6% 22rem, oklch(0.62 0.21 293 / 14%), transparent 68%)",
        }}
      />
      {/* Immersive hero: copy + CTA on the left, floating glass workspace on
          the right (stacks beneath on mobile — see GlassWorkspacePreview). */}
      <section className="mx-auto max-w-[1600px] px-4 pt-10 pb-10 lg:px-6 lg:pb-16">
        <div className="grid items-center gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10 xl:gap-14">
          <div>
            <div className="glass-light mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Real clips, real prompts — generated with content.ai
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Where <span className="text-primary">AI content</span> comes to life for Kuwait &amp; the GCC.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Browse a living wall of cinematic clips, then jump in and generate your own video,
              images and face swaps with model controls, references and audio — all in one
              focused workspace built for GCC creators, freelancers, agencies and enterprises.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {startCreating}
              <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                <Link to={signedIn ? "/user/templates" : "/video"}>
                  Explore the studio
                  <Play className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-4 lg:mt-0">
            <GlassWorkspacePreview signedIn={signedIn} onSignInRequired={() => setAuthOpen(true)} />
          </div>
        </div>
      </section>

      {/* Template banners — see TEMPLATE_BANNERS comment; renders nothing while empty. */}
      {TEMPLATE_BANNERS.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 pb-12 lg:px-6">
          <h2 className="mb-4 text-lg font-semibold">Featured template</h2>
          <div className="flex flex-col gap-8">
            {TEMPLATE_BANNERS.map((banner) => (
              <TemplateBanner key={banner.title} banner={banner} cta={tryTemplate} />
            ))}
          </div>
        </section>
      )}

      {/* Featured carousel — wrapped in one large, very transparent glass
          stage so the cards read as floating INSIDE a glass surface rather
          than sitting on dark background next to separate glass cards (the
          reference's core hierarchy: light field → glass surface → cards →
          controls). One shared backdrop-filter surface, not stacked per card. */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 lg:px-6 lg:pb-20">
        <div className="glass-ambient glass-edge relative overflow-hidden rounded-[2.5rem] py-8 sm:py-10">
          <div className="relative z-10 mb-4 flex items-baseline justify-between px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold">Featured</h2>
            <span className="text-sm text-muted-foreground">Built for Kuwait and the GCC</span>
          </div>
          <div className="relative z-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-8">
            {FEATURED.map((clip) => (
              <FeaturedCard key={clip.title} clip={clip} />
            ))}
          </div>
        </div>
      </section>

      {/* Masonry wall — a lighter, top-weighted atmospheric wash (not full
          section height, this is a very tall gallery) reaching over the left
          column and center region per the brief, so several rows read as lit
          without pulling the whole wall out of the darker lower-page
          register. Plain gradient, no backdrop-filter. */}
      <section className="relative mx-auto max-w-[1600px] px-4 pb-20 lg:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-300 opacity-60 md:opacity-100"
          style={{
            background:
              "radial-gradient(48rem 34rem at 16% 6%, oklch(0.62 0.21 293 / 11%), transparent 68%), radial-gradient(52rem 36rem at 52% 22%, oklch(0.78 0.13 320 / 10%), transparent 70%), radial-gradient(44rem 30rem at 88% 40%, oklch(0.76 0.12 205 / 6%), transparent 64%)",
          }}
        />
        <h2 className="mb-4 text-lg font-semibold">Explore the wall</h2>
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {SHOWCASE.map((clip) => (
            <MasonryTile key={clip.title} clip={clip} />
          ))}
        </div>
      </section>

      {/* Closing CTA — its own soft wash so the page doesn't drop straight
          from the gallery into a flat-dark panel before the footer. */}
      <section className="relative mx-auto max-w-[1600px] px-4 pb-24 lg:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 opacity-70 md:opacity-100"
          style={{
            background:
              "radial-gradient(50rem 34rem at 50% 30%, oklch(0.78 0.13 320 / 14%), transparent 72%)",
          }}
        />
        <div className="glass-ambient glass-edge relative overflow-hidden flex flex-col items-center justify-center gap-4 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Your next piece of <span className="text-gradient-warm">content</span> is one prompt away.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Pick a model, describe the shot, and render production-ready video, images, face
            swaps and templates in minutes.
          </p>
          {startCreating}
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
