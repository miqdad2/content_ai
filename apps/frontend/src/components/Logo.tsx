import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Show the "cre8.ai" wordmark next to the mark. Defaults to true. */
  showWordmark?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const TILE_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-7 w-7",
  default: "h-8 w-8",
  lg: "h-11 w-11",
};
const ICON_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * The cre8.ai mark: a blue→cyan gradient tile with an aperture glyph,
 * used identically in the navbar, footer and auth screens so the brand stays
 * consistent. Placeholder pending an approved logo asset — swap the icon/
 * gradient here once one exists; every usage site updates automatically.
 */
export function Logo({ showWordmark = true, size = "default", className }: LogoProps) {
  const tile = TILE_SIZE[size];
  const icon = ICON_SIZE[size];

  return (
    <span className={cn("flex shrink-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-cyan text-primary-foreground",
          tile,
        )}
      >
        <Aperture className={icon} />
      </span>
      {showWordmark && (
        <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">
          cre8<span className="text-brand-2">.ai</span>
        </span>
      )}
    </span>
  );
}
