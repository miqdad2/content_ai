import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/components/departments/departments.data";
import { BRAND_MEMORY_CATEGORIES, DEPARTMENT_CATEGORY_MAP } from "@/components/brand-memory/brandMemory.data";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/**
 * The Head of Brand & Creative chapter of the homepage marketing-lifecycle
 * journey (UNIT 08) — sits between Marketing Director and Content
 * Marketing, rendered as `DepartmentJourneySection`'s `children` slot (see
 * that file's UNIT 08 note).
 *
 * The SHOWCASE/FEATURED data and the Clip/FeaturedCard/MasonryTile/
 * TemplateBanner components below are moved here VERBATIM from
 * LandingPage.tsx — same field values, same JSX, same behavior. Only the
 * surrounding narrative framing (headings, intro, capability rail, CTA) is
 * new. Client explicitly wants every existing video retained; nothing
 * about the media itself changes in this unit — see UNIT 08 report
 * §"Video preservation verification".
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

/**
 * UNIT 09 performance audit: every clip on this section (7 featured + 15
 * masonry) rendered with `autoPlay` unconditionally, so all 22 were
 * decoding/playing simultaneously the moment this section mounted,
 * regardless of scroll position. This pauses a clip once it scrolls out of
 * a generous viewport margin and resumes it on return — src/order/initial
 * autoplay-on-mount behavior for on-screen clips is unchanged; only
 * offscreen clips stop consuming decode time.
 */
function Clip({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.play().catch(() => {});
        } else {
          node.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
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

const brandCreative = DEPARTMENTS.find((d) => d.id === "brand-creative")!;

/** Which of the department's 6 formal capabilities are real working
 * features today vs planned — see UNIT 08 report §"Current vs planned
 * capability treatment". Never claim a planned capability is live. */
const CAPABILITY_STATUS: Record<string, "current" | "planned"> = {
  "AI Images": "current",
  "AI Videos": "current",
  "AI Music": "planned",
  Logos: "planned",
  Presentations: "planned",
  Hashtags: "planned",
};

/** Existing supporting functionality — real routes, but not part of the
 * department's formal 6-capability list from spec/CRE8_AI_SPEC.md §9, so
 * shown as a distinct "also available" row rather than merged into the
 * capability chips above (see UNIT 08 brief §11/§12: don't promote Face
 * Swap into the official six, don't invent a separate department for
 * Templates). */
const REUSED_CAPABILITIES = [
  { label: "Templates", to: "/user/templates" },
  { label: "Avatar", to: "/user/avatar" },
  { label: "Face Swap", to: "/face-swap" },
];

export function BrandCreativeSection() {
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

  const categoryIds = DEPARTMENT_CATEGORY_MAP[brandCreative.id] ?? [];
  const categoryLabels = BRAND_MEMORY_CATEGORIES.filter((c) => categoryIds.includes(c.id)).map(
    (c) => c.name,
  );

  return (
    <div>
      {/* Intro */}
      <section className="mx-auto max-w-[1600px] px-4 pb-4 pt-4 lg:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            03 — Create
          </span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {brandCreative.role}
          </span>
        </div>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Turn campaigns into things people can see, hear and remember.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Designed to bring AI image, video, music, logo and presentation creation into one
          creative department — generated from the same brand and campaign context.
        </p>
        {categoryLabels.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold text-brand-cyan">Brand Memory</span>
            {categoryLabels.map((label) => (
              <span key={label}>· {label}</span>
            ))}
          </div>
        )}
      </section>

      {/* Campaign → Creative continuity strip — illustrative example only,
          no live Brand Memory data (UNIT 08 §5/§16). */}
      <section className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Example workflow
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Illustrative
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                From campaign
              </p>
              <p className="mt-0.5 text-sm text-foreground/90">Summer Launch</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Brand Memory
              </p>
              <p className="mt-0.5 text-sm text-foreground/90">
                Tone · Visual identity · Audience · Products
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Creative brief
              </p>
              <p className="mt-0.5 text-sm text-foreground/90">Premium · Kuwait · Social-first</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capability rail — current vs planned, distinguished by icon + text,
          never color alone (UNIT 08 §4/§21). */}
      <section className="mx-auto max-w-[1600px] px-4 pb-8 lg:px-6">
        <div className="flex flex-wrap gap-2">
          {brandCreative.capabilities.map((cap) => {
            const status = CAPABILITY_STATUS[cap];
            const isCurrent = status === "current";
            return (
              <span
                key={cap}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                  isCurrent
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground",
                )}
              >
                {isCurrent ? (
                  <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                ) : (
                  <Clock className="h-3 w-3" aria-hidden="true" />
                )}
                {cap}
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <Check className="mr-1 inline h-3 w-3 text-primary" aria-hidden="true" /> Available now
          <span className="mx-2 text-muted-foreground/40">·</span>
          <Clock className="mr-1 inline h-3 w-3" aria-hidden="true" /> Planned for the creative
          department
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Also available
          </span>
          {REUSED_CAPABILITIES.map((r) => (
            <Link
              key={r.label}
              to={r.to}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Template banners — see TEMPLATE_BANNERS comment; renders nothing while empty. */}
      {TEMPLATE_BANNERS.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 pb-12 lg:px-6">
          <h3 className="mb-4 text-lg font-semibold">Featured template</h3>
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
            <h3 className="text-lg font-semibold">Featured Creations</h3>
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
          register. Plain gradient, no backdrop-filter. Recolored to the
          blue/cyan system in UNIT 08 (was still violet/lavender — this
          section wasn't in scope to touch until it moved here). */}
      <section className="relative mx-auto max-w-[1600px] px-4 pb-20 lg:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-300 opacity-60 md:opacity-100"
          style={{
            background:
              "radial-gradient(48rem 34rem at 16% 6%, oklch(0.6 0.17 256 / 11%), transparent 68%), radial-gradient(52rem 36rem at 52% 22%, oklch(0.62 0.13 232 / 10%), transparent 70%), radial-gradient(44rem 30rem at 88% 40%, oklch(0.76 0.12 205 / 6%), transparent 64%)",
          }}
        />
        <h3 className="mb-4 text-lg font-semibold">The Creative Wall</h3>
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {SHOWCASE.map((clip) => (
            <MasonryTile key={clip.title} clip={clip} />
          ))}
        </div>
      </section>

      {/* Creative CTA — restrained, safe destinations only. */}
      <section className="mx-auto max-w-[1600px] px-4 pb-4 lg:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {signedIn ? (
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/video">
                Create with cre8.ai
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="rounded-full px-6" onClick={() => setAuthOpen(true)}>
              Create with cre8.ai
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/video" className="transition-colors hover:text-foreground">
              AI Video →
            </Link>
            <Link to="/image" className="transition-colors hover:text-foreground">
              AI Image →
            </Link>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
