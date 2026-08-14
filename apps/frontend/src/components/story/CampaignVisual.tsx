import { ArrowUp } from "lucide-react";

const CAMPAIGN_FIELDS = [
  { label: "Objective", value: "Launch the summer product line" },
  { label: "Audience", value: "Existing customers + lookalike prospects" },
  { label: "Big idea", value: "“Built for how you actually work.”" },
  { label: "Messaging", value: "Faster setup, real results, no learning curve" },
  { label: "Channels", value: "Email, LinkedIn, Instagram" },
  { label: "Content plan", value: "3 hero assets, 6 supporting posts" },
  { label: "Timeline", value: "4-week rollout, 3 phases" },
  { label: "KPIs", value: "CTR, sign-ups, pipeline influenced" },
];

/** "Campaign command center" — the `From CMO Strategy` chip is the
 * continuity signal UNIT 07 §8 asks for: this isn't an isolated generator,
 * it's fed by the previous chapter. "Digital Marketing" is scoped as
 * planning output, never as live ad-platform execution (§7). */
export function CampaignVisual() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Campaign Plan</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Example
        </span>
      </div>
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
        From CMO Strategy
      </div>
      <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {CAMPAIGN_FIELDS.map((f) => (
          <div key={f.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 text-sm text-foreground/90">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
