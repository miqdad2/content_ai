const METRICS = [
  { value: "+24%", label: "Engagement" },
  { value: "3.1×", label: "Reach vs. prior" },
  { value: "18", label: "Qualified leads" },
];

/** Report/insight visualization using clearly-labeled sample numbers — never
 * presented as real client data (UNIT 07 §13: mandatory "Sample Data"
 * marking, abstract numbers only). */
export function AnalyticsInsightVisual() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Campaign Report</span>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
          Sample Data
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {METRICS.map((m) => (
          <div key={m.label}>
            <p className="text-2xl font-semibold text-foreground">{m.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-cyan">Opportunity</p>
          <p className="mt-0.5 text-sm text-foreground/90">
            Short-form video outperformed static posts 2:1 — worth a bigger share of next
            month&rsquo;s plan.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-cyan">
            Recommended next action
          </p>
          <p className="mt-0.5 text-sm text-foreground/90">
            Shift 20% of the content plan toward short-form video for the next campaign.
          </p>
        </div>
      </div>
    </div>
  );
}
