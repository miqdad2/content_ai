/** Content-output composition — a generated caption result, not a
 * functioning form (UNIT 07 §10). Hashtags appear only as campaign
 * context, never as this department's own generated capability — hashtag
 * generation stays owned by Brand & Creative in the department data model
 * (§9). */
export function ContentOutputVisual() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          Campaign: Summer Launch
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted-foreground">
          Instagram
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted-foreground">
          Tone: Confident + premium
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-cyan">
            Generated caption
          </span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Example
          </span>
        </div>
        <p className="text-sm leading-6 text-foreground/90">
          “Summer doesn&rsquo;t wait — and neither should your workflow. The new line is here,
          built for the way you actually create. Link in bio.”
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          CTA: Shop the summer line · 142 characters
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="text-muted-foreground/70">Campaign hashtags:</span>
        <span>#SummerLaunch</span>
        <span>#BuiltForYou</span>
      </div>
    </div>
  );
}
