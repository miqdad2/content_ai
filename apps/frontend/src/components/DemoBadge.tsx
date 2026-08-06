import { isDemoMode } from "@/lib/demoMode";

/** Small "Demo Mode" indicator, visible only when VITE_DEMO_MODE=true. Uses
 * only existing design tokens (glass-light, muted-foreground) — no new
 * styling introduced, per the visual freeze for this unit. */
export function DemoBadge() {
  if (!isDemoMode()) return null;
  return (
    <span className="glass-light hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Demo Mode
    </span>
  );
}
