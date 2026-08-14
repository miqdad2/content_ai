const STRATEGY_FIELDS = [
  { label: "Objective", value: "Grow qualified demo requests 30% this quarter" },
  { label: "Market", value: "Kuwait & the GCC, SMB to mid-market" },
  { label: "Audience", value: "Marketing leads at 20–200 person companies" },
  { label: "Positioning", value: "The AI marketing department, not another generator" },
  { label: "Priority channels", value: "LinkedIn, search, partner referrals" },
];

/** Premium "strategy brief" panel — not a live dashboard. Trend
 * Intelligence is deliberately described as designed-to-surface rather
 * than real-time tracking (UNIT 07 brief §5: no unsupported real-time
 * market-intelligence claim). */
export function CMOStrategyVisual() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Marketing Strategy</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Example
        </span>
      </div>
      <dl className="space-y-3.5">
        {STRATEGY_FIELDS.map((f) => (
          <div key={f.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 text-sm text-foreground/90">{f.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-cyan">Trend Intelligence</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Designed to surface industry signals, audience shifts and competitor movement from the
          context you provide.
        </p>
      </div>
    </div>
  );
}
