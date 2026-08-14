import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/components/departments/departments.data";
import { DepartmentStoryChapter } from "./DepartmentStoryChapter";
import { CMOStrategyVisual } from "./CMOStrategyVisual";
import { CampaignVisual } from "./CampaignVisual";
import { ContentOutputVisual } from "./ContentOutputVisual";
import { SocialPipelineVisual } from "./SocialPipelineVisual";
import { AnalyticsInsightVisual } from "./AnalyticsInsightVisual";
import { DEPARTMENT_STORIES, LIFECYCLE_STEPS } from "./departmentStory.data";

const CLOSED_LOOP_LABELS = ["Strategy", "Campaign", "Content", "Social", "Analytics"];

/** Keyed by department id so each chapter's hand-built visual is paired
 * with the right narrative content without a fragile positional array. */
const VISUALS: Record<string, React.ReactNode> = {
  cmo: <CMOStrategyVisual />,
  "marketing-director": <CampaignVisual />,
  "content-marketing": <ContentOutputVisual />,
  "social-media": <SocialPipelineVisual />,
  analytics: <AnalyticsInsightVisual />,
};

function byId(id: string) {
  const department = DEPARTMENTS.find((d) => d.id === id);
  if (!department) throw new Error(`Unknown department id in DEPARTMENT_STORIES: ${id}`);
  return department;
}

/**
 * The homepage's marketing-lifecycle storytelling layer (UNIT 07) — five
 * chapters (CMO → Marketing Director → Content Marketing → Social Media →
 * Analytics), each pairing shared department data (departments.data.ts)
 * with its own hand-built DOM/CSS visual, alternating left/right so they
 * read as one continuous narrative rather than five identical cards.
 * Brand & Creative is intentionally not included — UNIT 08 repositions the
 * existing showcase as that chapter.
 *
 * No Three.js here by design (UNIT 07 §17): the hero and department
 * universe already carry the 3D identity; this layer is DOM/CSS product
 * storytelling so it adds no additional GPU load or vendor-chunk growth.
 *
 * UNIT 08 note: `children` renders between the Marketing Director and
 * Content Marketing chapters — the slot Brand & Creative's showcase
 * (BrandCreativeSection, a full-width media section, not another
 * DepartmentStoryChapter) occupies on the homepage. The five chapters are
 * split into two `.map()` passes around it rather than restructured, and
 * both passes read their `align` from the story's index in the *full*
 * DEPARTMENT_STORIES array (not the sliced sub-array), so the
 * left/right/left/right/left alternation is byte-for-byte the same as
 * before this slot existed — verified in the UNIT 08 report.
 */
export function DepartmentJourneySection({ children }: { children?: ReactNode }) {
  const indexed = DEPARTMENT_STORIES.map((story, i) => ({ story, i }));
  const beforeCreative = indexed.slice(0, 2); // cmo, marketing-director
  const afterCreative = indexed.slice(2); // content-marketing, social-media, analytics

  return (
    <div>
      {/* Lifecycle intro — reconnects thematically from Brand Memory into
          this journey (§15) without repeating its full explanation. */}
      <section className="mx-auto max-w-[1600px] px-4 pb-4 pt-14 text-center lg:px-6 lg:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          The cre8.ai Marketing Lifecycle
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          From brand memory to the next move —{" "}
          <span className="text-gradient">one connected system.</span>
        </h2>
        <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {LIFECYCLE_STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className={i === 0 ? "text-primary" : undefined}>{step}</span>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <span aria-hidden="true" className="text-muted-foreground/40">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      </section>

      {beforeCreative.map(({ story, i }) => (
        <DepartmentStoryChapter
          key={story.departmentId}
          department={byId(story.departmentId)}
          story={story}
          align={i % 2 === 0 ? "left" : "right"}
          visual={VISUALS[story.departmentId]}
          rhythm={i === 0 ? "opening" : "bridgeOut"}
        />
      ))}

      {children}

      {afterCreative.map(({ story, i }, sliceIndex) => (
        <DepartmentStoryChapter
          key={story.departmentId}
          department={byId(story.departmentId)}
          story={story}
          align={i % 2 === 0 ? "left" : "right"}
          visual={VISUALS[story.departmentId]}
          rhythm={sliceIndex === 0 ? "bridgeIn" : sliceIndex === afterCreative.length - 1 ? "closing" : "standard"}
        />
      ))}

      {/* Closed loop — analytics reconnects to strategy; the one
          restrained CTA for the whole journey (§14/§16), not five. */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 lg:px-6 lg:pb-20">
        <div className="glass-ambient glass-edge relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            The loop closes
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Every result becomes context for the next move.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Designed so insights can inform the next strategy — closing the loop from analytics
            back to the CMO, without starting from zero.
          </p>
          <div className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {CLOSED_LOOP_LABELS.map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                <span>{label}</span>
                {i < CLOSED_LOOP_LABELS.length - 1 && (
                  <span aria-hidden="true" className="text-muted-foreground/40">
                    →
                  </span>
                )}
              </span>
            ))}
            <span aria-hidden="true" className="text-muted-foreground/40">
              ↺
            </span>
            <span className="text-primary">Next Strategy</span>
          </div>
          <div className="mt-7">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/departments">
                Explore Departments
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
