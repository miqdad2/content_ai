import * as React from "react";
import { cn } from "@/lib/utils";

const CARD_TIER_CLASS = {
  medium: "glass-medium shadow-lg shadow-black/20",
  elevated: "glass-elevated",
} as const;

interface CardProps extends React.ComponentProps<"div"> {
  /** Glass intensity — "medium" (default, Content Glass) or "elevated"
   * (Elevated Glass, for surfaces that should read as floating above the
   * page shell, e.g. a highlighted pricing card or a standalone login
   * panel). Never combine with a manually-applied glass-* className on the
   * same Card — pick the tier here instead, so only one glass class is ever
   * on the element (stacking two fights the CSS cascade). */
  tier?: keyof typeof CARD_TIER_CLASS;
}

function Card({ className, tier = "medium", ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-2xl text-card-foreground", CARD_TIER_CLASS[tier], className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-semibold leading-none tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
