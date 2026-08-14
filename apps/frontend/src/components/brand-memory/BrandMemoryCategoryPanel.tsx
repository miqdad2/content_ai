import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandMemoryCategory } from "./brandMemory.data";

interface BrandMemoryCategoryPanelProps {
  category: BrandMemoryCategory;
  /** True when the currently-selected department consumes this category —
   * signaled by border/background AND an explicit "Used by" label, never
   * color alone (UNIT 03/05 accessibility lesson applied here too). */
  emphasized: boolean;
  departmentLabel: string;
}

export function BrandMemoryCategoryPanel({
  category,
  emphasized,
  departmentLabel,
}: BrandMemoryCategoryPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border p-4 transition-colors duration-(--duration-control) ease-(--ease-standard) sm:p-5",
        emphasized
          ? "border-primary/50 bg-primary/[0.08]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
        {emphasized && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Check className="h-3 w-3" aria-hidden="true" />
            Used by {departmentLabel}
          </span>
        )}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{category.fields.join(" · ")}</p>
    </div>
  );
}
