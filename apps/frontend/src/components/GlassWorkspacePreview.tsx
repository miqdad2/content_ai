import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Film, ImageIcon, LayoutGrid, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";

/**
 * Purely decorative preview of the cre8.ai workspace. Originally shown
 * beside the landing hero; relocated to its own section below the hero in
 * UNIT 04 once the hero became the cinematic 3D scene (component itself is
 * unchanged, only its position on the page moved — see LandingPage.tsx).
 * No API calls, no demo-data reads, no auth reads — the one real
 * interactive element (the CTA) reuses the exact signedIn-branching pattern
 * LandingPage already uses for its other CTAs. Every clip reused here
 * already exists in LandingPage's own SHOWCASE array — no new assets.
 */
const TOOLS = [
  { icon: Film, label: "Video" },
  { icon: ImageIcon, label: "Image" },
  { icon: LayoutGrid, label: "Templates" },
];

const PREVIEW_TILES = [
  { src: "/showcase/storm-giant.mp4", label: "Cinematic reveal" },
  { src: "/showcase/summer-haze.mp4", label: "Lifestyle montage" },
];

interface FloatingChipProps {
  className: string;
  delay: string;
  children: React.ReactNode;
}

function FloatingChip({ className, delay, children }: FloatingChipProps) {
  return (
    <span
      aria-hidden="true"
      className={`glass-elevated absolute z-20 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground shadow-lg sm:inline-flex motion-safe:animate-[float-slow_8s_ease-in-out_infinite] ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </span>
  );
}

interface Props {
  signedIn: boolean;
  onSignInRequired: () => void;
}

export function GlassWorkspacePreview({ signedIn, onSignInRequired }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const spotStyle: CSSProperties = spot
    ? {
        opacity: 1,
        background: `radial-gradient(280px circle at ${spot.x}% ${spot.y}%, oklch(0.75 0.1 235 / 16%), transparent 70%)`,
      }
    : { opacity: 0 };

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      {/* Floating capability chips — decorative, max 4, desktop only */}
      <FloatingChip className="-left-4 top-6" delay="0s">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Video
      </FloatingChip>
      <FloatingChip className="-right-3 top-28" delay="1.2s">
        4K
      </FloatingChip>
      <FloatingChip className="-left-6 bottom-24" delay="2.4s">
        Arabic + English
      </FloatingChip>
      <FloatingChip className="-right-4 bottom-6" delay="3.6s">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-emerald-300">Ready</span>
      </FloatingChip>

      {/* Outer glass shell */}
      <div
        ref={shellRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setSpot(null)}
        className="glass-ambient glass-edge relative overflow-hidden rounded-[2.25rem] shadow-2xl transition-transform duration-(--duration-surface) ease-(--ease-standard) transform-[rotate(-1.25deg)] motion-safe:hover:transform-[rotate(0deg)]"
      >
        {/* Pointer-reactive highlight — decorative only, desktop pointer devices */}
        <div
          className="pointer-events-none absolute inset-0 z-0 hidden transition-opacity duration-500 md:block"
          style={spotStyle}
        />

        <div className="relative z-10 flex flex-col gap-4 p-4 sm:p-5 lg:gap-5 lg:p-6 xl:p-7">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <Logo size="sm" showWordmark={false} />
            <div className="flex items-center gap-1">
              {TOOLS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/80"
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {/* Content tiles */}
          <div className="grid grid-cols-2 gap-3">
            {PREVIEW_TILES.map((tile) => (
              <div
                key={tile.src}
                className="glass-medium group relative aspect-[4/5] overflow-hidden rounded-2xl"
              >
                <video
                  src={tile.src}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedData={(e) => {
                    // `autoPlay` alone is unreliable once several <video>
                    // elements are competing for decode on one page — force
                    // playback once this tile's data actually lands.
                    e.currentTarget.play().catch(() => {});
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/75 to-transparent p-2.5">
                  <span className="text-[11px] font-medium text-white">{tile.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Floating prompt composer */}
          <div className="glass-elevated relative flex items-center gap-2 rounded-full py-2 pl-4 pr-2">
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              A cinematic oud campaign for Kuwait…
            </span>
            {signedIn ? (
              <Link
                to="/video"
                className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Generate <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onSignInRequired}
                className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Generate <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
