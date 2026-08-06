import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const TIER_CLASS = {
  light: "glass-light",
  medium: "glass-medium",
  strong: "glass-strong",
} as const;

const ROUNDED_CLASS = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
} as const;

interface SurfaceProps extends ComponentProps<"div"> {
  /** Glass intensity — light (decorative), medium (content), strong (readable/forms). */
  tier?: keyof typeof TIER_CLASS;
  rounded?: keyof typeof ROUNDED_CLASS;
}

/**
 * A glass panel at one of three intensities (see index.css's .glass-* utilities).
 * Optional — most one-off containers can just apply the tier class directly;
 * reach for this where the same tier+rounding combo repeats across a page.
 */
export function Surface({ tier = "medium", rounded = "2xl", className, ...props }: SurfaceProps) {
  return (
    <div className={cn(ROUNDED_CLASS[rounded], TIER_CLASS[tier], className)} {...props} />
  );
}
