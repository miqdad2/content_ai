import { ArrowRight } from "lucide-react";

const PIPELINE_STEPS = ["Content", "Voiceover", "Avatar", "Schedule"];

/** Publishing-pipeline concept — generic channel names as plain text, not
 * platform logos, and no implication of a live posting connection (UNIT 07
 * §11/§12: auto-posting is not yet a live production integration). */
export function SocialPipelineVisual() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Publishing Pipeline</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Concept
        </span>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <div className="glass-light flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/90">
              {step}
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <ArrowRight
                className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Designed channels
        </p>
        <p className="mt-1 text-sm text-foreground/90">Instagram · TikTok · LinkedIn · Facebook</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Auto-posting is designed for creation, scheduling and publishing workflows — not yet a
          live production integration.
        </p>
      </div>
    </div>
  );
}
