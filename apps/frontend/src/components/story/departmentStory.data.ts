/**
 * Public storytelling copy for the homepage "marketing lifecycle" journey
 * (UNIT 07). Deliberately does NOT duplicate role/capabilities/color —
 * those already live in departments.data.ts and are looked up by
 * `departmentId` at render time (see DepartmentStoryChapter.tsx). This file
 * only adds the narrative fields that data model has no reason to own:
 * the lifecycle step label and the chapter headline/description.
 *
 * Brand & Creative is intentionally absent — UNIT 08 repositions the
 * existing showcase as its storytelling section, not this unit.
 */

export interface DepartmentStoryContent {
  /** Must match a Department.id in departments.data.ts. */
  departmentId: string;
  /** One word from the Think → Plan → Create → Publish → Understand →
   * Improve lifecycle (see LIFECYCLE_STEPS below). */
  step: string;
  headline: string;
  description: string;
}

export const LIFECYCLE_STEPS = ["Think", "Plan", "Create", "Publish", "Understand", "Improve"];

export const DEPARTMENT_STORIES: DepartmentStoryContent[] = [
  {
    departmentId: "cmo",
    step: "Think",
    headline: "Know where to go before you create.",
    description:
      "Designed to turn brand and market context into strategic direction — objectives, audience, positioning and priority channels, built from the same shared brand intelligence.",
  },
  {
    departmentId: "marketing-director",
    step: "Plan",
    headline: "Turn strategy into an executable campaign.",
    description:
      "Build channel-ready digital marketing plans — objective, audience, big idea, messaging, channels, content plan, timeline and KPIs, connected back to CMO strategy.",
  },
  {
    departmentId: "content-marketing",
    step: "Create",
    headline: "Turn campaigns into brand-consistent content.",
    description: "Generate captions and prompts that carry your brand's tone into every post.",
  },
  {
    departmentId: "social-media",
    step: "Publish",
    headline: "Turn content into channel-ready experiences.",
    description:
      "Designed for creation, scheduling and publishing workflows — voiceovers, avatars and auto-posting, built around your brand voice.",
  },
  {
    departmentId: "analytics",
    step: "Understand",
    headline: "Turn performance into the next decision.",
    description:
      "Designed to turn campaign performance into clear summaries, opportunities and recommended next actions.",
  },
];
