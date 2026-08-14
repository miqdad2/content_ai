import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Shared badge/chip primitive introduced in the cre8.ai design-system
 * foundation unit. Not yet adopted by existing bespoke badges (StatusBadge's
 * PENDING/IN_PROGRESS/COMPLETED/FAILED colors are functional status
 * indicators and are intentionally left as-is; Navbar/PromoBanner/Billing's
 * inline chips are page-specific and out of scope for this unit) — this is
 * shared infrastructure for future units to reach for instead of another
 * one-off inline `<span>`.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        neutral: "bg-white/[0.06] text-muted-foreground",
        active: "bg-primary/15 text-primary",
        info: "bg-brand-cyan/15 text-brand-cyan",
        success: "bg-emerald-500/15 text-emerald-400",
        warning: "bg-amber-500/15 text-amber-300",
        destructive: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
