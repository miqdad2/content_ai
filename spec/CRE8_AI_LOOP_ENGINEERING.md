# cre8.ai — Loop Engineering Protocol

## 0. Purpose

This file defines how all future cre8.ai development units must be executed.

The goal is to transform the existing working content.ai codebase into cre8.ai safely, incrementally and verifiably.

This file governs:

- planning
- implementation
- testing
- visual review
- regression prevention
- commits
- scope control

Read `CRE8_AI_SPEC.md` before beginning any product unit.

---

# 1. Core Rule

Never implement cre8.ai as one giant rewrite.

Every change must follow:

```text
Inspect
→ Understand
→ Scope
→ Plan
→ Implement
→ Verify
→ Review
→ Commit
→ Next Unit
```

---

# 2. Preserve Working Functionality

Existing working systems are assets.

Do not casually rewrite:

- authentication
- Demo Mode
- API client
- generation APIs
- video generation
- image generation
- uploads
- credit handling
- billing
- Razorpay production path
- templates
- history
- timeline/editor logic
- backend
- Prisma
- storage
- generation model integrations

When a new cre8.ai concept needs existing functionality:

**wrap/reposition first.**

Refactor only when necessary.

---

# 3. Mandatory Unit Start

Before every implementation unit run:

```bash
git status
git branch --show-current
git log -1 --oneline
```

Record:

- starting commit
- branch
- existing modified files
- unrelated WIP

Never automatically clean, reset, stash or overwrite unrelated changes.

---

# 4. Required Reading

Before implementation read:

- `AGENTS.md`
- `CLAUDE.md`
- `CRE8_AI_SPEC.md`
- `CRE8_AI_LOOP_ENGINEERING.md`

Then inspect all files relevant to the current unit.

Do not modify based solely on assumptions from filenames.

---

# 5. Unit Scope

Every unit must have:

## Objective

One clear outcome.

## In scope

Exact behaviors/files/domains allowed.

## Out of scope

Explicitly protected areas.

## Acceptance criteria

Measurable completion conditions.

Do not begin implementation without defining these four items.

---

# 6. Engineering Loop

For each unit use the following loop.

## LOOP A — Inspect

Understand:

- current behavior
- existing architecture
- dependencies
- existing data contracts
- existing responsive behavior
- existing Demo Mode behavior
- nearby high-risk code

Report findings before editing.

---

## LOOP B — Design

Define:

- smallest safe change
- reuse opportunities
- new abstractions only if required
- migration path
- compatibility requirements

Do not over-engineer future units.

---

## LOOP C — Implement

Change only current-unit files.

Prefer:

- incremental code
- reusable components
- typed interfaces
- semantic tokens
- feature-local modules
- composition over deep rewriting

---

## LOOP D — Verify

At minimum:

```bash
bun run check-types
bun run --cwd apps/frontend build
```

Where relevant:

```bash
VITE_DEMO_MODE=true bun run --cwd apps/frontend build
```

Use Windows-compatible equivalents when necessary.

Backend units must run the appropriate backend checks.

---

## LOOP E — Visual QA

For visual units inspect actual rendering when browser access exists.

Required widths:

- 375
- 768
- 1024
- 1440
- 1920

Do not claim visual QA without looking at the rendered page.

---

## LOOP F — Functional QA

Test unit-specific flows.

Examples:

- login
- logout
- route refresh
- generation
- credits
- Brand switching
- Brand Memory
- department navigation

---

## LOOP G — Regression Check

Explicitly verify areas that were not supposed to change.

Example:

If redesigning landing page:

- Demo Mode still works.
- `/video` still works.
- real API files remain unchanged.

---

## LOOP H — Report

Return:

1. Starting commit
2. Findings
3. Scope
4. Files modified
5. Files created
6. Files intentionally untouched
7. Functional changes
8. Visual changes
9. Tests
10. Build result
11. Visual QA
12. Known limitations
13. Recommended next unit

---

## LOOP I — Commit

Do not commit unless requested.

When requested:

- stage only intended files,
- inspect staged diff,
- commit one logical unit,
- never sweep unrelated WIP.

Do not push without explicit permission.

---

# 7. Planned Transformation Sequence

Implement cre8.ai in the following order.

---

# UNIT 00 — Repository & Product Audit

## Objective

Create an authoritative map of the existing system before structural redesign.

Inspect:

- routes
- auth
- Demo Mode
- APIs
- billing
- creative generators
- templates
- history
- uploads
- backend
- Prisma
- deployment
- Vercel

Deliver:

`CRE8_CURRENT_ARCHITECTURE.md`

No functional changes.

---

# UNIT 01 — cre8.ai Brand Foundation

## Objective

Replace public product identity safely.

Change:

- logo
- favicon
- metadata
- visible brand name
- navigation brand
- footer
- login brand
- demo account visible labels

Do not blindly rename:

- database identifiers
- internal package names
- deployment identifiers
- storage buckets
- API names

Perform legacy-brand classification.

---

# UNIT 02 — New Design System

## Objective

Move from purple content.ai identity to client-approved cre8.ai visual language.

Implement:

- black
- deep navy
- electric blue
- cyan
- cool white
- restrained glass
- elevation tokens
- glow tokens
- motion tokens

Preserve functionality.

---

# UNIT 03 — Public Navigation & Shell

## Objective

Build the new public cre8.ai shell.

Navigation:

- Home
- Departments
- Pricing
- Login
- Enter cre8.ai

Preserve responsive behavior.

---

# UNIT 04 — Landing Hero

## Objective

Create cinematic cre8.ai hero based on client references.

Include:

- minimal floating navigation
- cinematic black/blue environment
- subtle space particles
- large editorial headline
- Mission Control visual
- CTA
- restrained motion

Do not add unrelated feature grids yet.

---

# UNIT 05 — Department Universe

## Objective

Implement the signature planetary department experience.

Departments:

- CMO
- Marketing Director
- Brand & Creative
- Content Marketing
- Social Media
- Marketing Analytics

Desktop:

- orbital/planetary narrative

Mobile:

- accessible alternative

Performance must remain acceptable.

---

# UNIT 06 — Brand Memory Landing Section

## Objective

Explain AI Brand Memory publicly.

No backend functionality yet unless Brand Memory backend unit is already completed.

Show how all departments consume shared brand context.

---

# UNIT 07 — Landing Department Storytelling

Implement public storytelling sections for:

- CMO
- Marketing Director
- Content
- Social
- Analytics

No fake integrations.

---

# UNIT 08 — Creative Showcase Migration

## Objective

Preserve all existing videos as requested by client.

Move existing:

- Featured
- media wall

into:

> Brand & Creative Showcase.

Do not delete existing approved assets.

Do not make the media gallery the primary product story.

---

# UNIT 09 — Landing Completion

Implement:

- unified workspace section
- CTA
- footer
- section transitions
- responsive polish
- motion polish

Landing page must now tell a complete product story.

---

# UNIT 10 — Pricing Redesign

Use client reference.

Implement presentation without changing payment contracts.

Include:

- black/blue environment
- glass plan cards
- recommended tier
- monthly/yearly toggle
- feature lists
- FAQ
- final CTA

Final plan names/prices require owner approval.

---

# UNIT 11 — Authenticated Shell / Mission Control

## Objective

Replace old tool-first authenticated navigation.

Introduce:

- Mission Control
- Departments
- Brand Memory
- History

Preserve current generator routes through compatibility links.

Do not remove working pages yet.

---

# UNIT 12 — Brand Workspace Foundation

Implement frontend concepts for:

- active Brand
- Brand selector
- Brand Workspace creation

Then implement backend/model only if required.

Maintain multi-brand architecture.

---

# UNIT 13 — Brand Memory Data Model

Design before coding.

Potential models:

- BrandWorkspace
- BrandMemory
- BrandProduct
- BrandCompetitor
- BrandAsset

Create only the minimum models necessary.

Require migration review before applying.

---

# UNIT 14 — Brand Onboarding

Implement:

```text
Create Brand
→ Business
→ Audience
→ Positioning
→ Voice
→ Visual
→ Review
```

Brand Memory becomes available after confirmation.

---

# UNIT 15 — Mission Control Dashboard

Show:

- active Brand
- Brand Memory completion
- department shortcuts
- recent work
- credits
- recommended next action

No CRM/task/invoice module.

---

# UNIT 16 — Department Workspace Shell

Create reusable structure:

```text
Department Header
Brand Context
Tool Navigation
Workspace
History
Output
```

Use this shell across departments.

---

# UNIT 17 — Brand & Creative Migration

Move existing tools under Brand & Creative.

Preserve existing functionality.

Map:

- Video
- Image
- Avatar where appropriate
- Templates where appropriate

Do not rewrite generation engines.

---

# UNIT 18 — AI Video Workspace Refinement

Replace old standalone page presentation.

Keep underlying video form.

Remove permanent oversized tutorial panel.

Use:

- controls
- preview
- outputs
- history
- Brand context

“How it works” becomes optional help.

---

# UNIT 19 — AI Image Workspace Refinement

Same principles as video.

---

# UNIT 20 — Additional Creative Tool Shells

Create safe UI architecture for:

- Music
- Logo
- Presentations
- Hashtags

Do not fake AI providers.

Each feature must explicitly identify:

- real functionality
- demo-only functionality
- placeholder functionality

---

# UNIT 21 — CMO Strategy

Implement Marketing Strategy generation.

Must use Brand Memory context.

Define backend contract before integration.

Store outputs by Brand Workspace.

---

# UNIT 22 — Trend Intelligence

Initial implementation can combine:

- Brand context
- industry
- market
- user-supplied sources

Live trend providers require separate researched integration design.

Do not fabricate real-time trend data.

---

# UNIT 23 — Marketing Campaign Generator

Inputs:

- objective
- Brand
- product
- audience
- geography
- budget
- channels
- timeframe

Outputs:

- concept
- messaging
- audience
- channel plan
- content requirements
- schedule
- KPIs

---

# UNIT 24 — Digital Marketing Generator

Initial scope:

AI planning/output.

Direct ad-platform execution is deferred.

---

# UNIT 25 — Caption Generator

Use Brand Memory:

- voice
- market
- audience
- campaign context

Support future channel presets.

---

# UNIT 26 — Prompt Generator

Generate optimized prompts for:

- images
- video
- campaigns
- marketing content

Reuse Brand Memory context.

---

# UNIT 27 — Voiceovers

Audit current capabilities first.

Add provider only after explicit integration design.

---

# UNIT 28 — Avatars

Reuse existing avatar functionality where appropriate.

Do not destroy working implementation.

---

# UNIT 29 — Auto-Posting Shell

Current unit may implement:

- scheduling model
- calendar UI
- draft state
- integration boundaries

Actual platform execution is deferred until platform scope is confirmed.

---

# UNIT 30 — Reports

Implement:

- input/upload
- report generation
- Brand context
- saved history

Do not falsely call reports live analytics without data integrations.

---

# UNIT 31 — AI Insights

Generate:

- summary
- anomalies
- opportunities
- recommendations
- next actions

Must state data source/context.

---

# UNIT 32 — Final Responsive / Accessibility Pass

Audit all public and authenticated pages.

Required:

- keyboard
- screen reader fundamentals
- focus
- contrast
- reduced motion
- 44px targets
- overflow
- mobile navigation

---

# UNIT 33 — Performance Pass

Audit:

- video loading
- autoplay media
- posters
- image optimization
- JavaScript chunks
- planetary animations
- large gradients
- backdrop blur
- initial load

Landing page cinematic design must not destroy load performance.

---

# UNIT 34 — Demo Environment Refresh

Update Demo Mode to demonstrate cre8.ai:

- Brand Workspace
- Brand Memory
- departments
- strategies
- campaigns
- creative tools
- reports

Keep all data fictional and clearly demo-only.

---

# UNIT 35 — Vercel Client Preview

Deploy frontend.

Verify:

- landing
- departments
- pricing
- login
- Mission Control
- Brand Memory
- creative pages
- demo operations

Perform real browser QA before sending to client.

---

# UNIT 36 — Production Readiness Audit

Only after client approval.

Review:

- auth
- permissions
- payments
- APIs
- secrets
- data persistence
- providers
- billing
- logging
- error handling
- analytics
- security
- deployment

---

# 8. Visual Engineering Rules

Public pages may be cinematic.

Authenticated pages must prioritize usability.

Do not make every screen orbital.

Use space metaphor for:

- landing
- departments
- transitions
- branding

Use Mission Control metaphor for:

- authenticated navigation
- dashboards
- workspaces

---

# 9. Motion Rules

Allowed:

- subtle star movement
- orbital movement
- scroll reveals
- slow parallax
- planet transitions
- hover depth
- modal transitions

Avoid:

- continuous distracting movement
- large animated blur
- heavy WebGL unless justified
- motion required for comprehension

Reduced-motion users must get a usable alternative.

---

# 10. Planetary Performance Rule

Before introducing WebGL / Three.js / heavy shaders:

1. Determine whether CSS, canvas, SVG or pre-rendered media can achieve the result.
2. Measure payload and runtime cost.
3. Provide mobile fallback.
4. Do not install a heavy graphics dependency merely for decoration.

---

# 11. Backend Rule

No new backend model should be created because "we may need it later."

Backend changes require:

- defined user behavior
- defined API
- defined ownership
- defined permissions
- migration plan
- tests

---

# 12. Brand Memory Rule

Every feature that claims Brand Memory support must explicitly document which memory fields it consumes.

Example:

```text
Caption Generator consumes:
- tone
- audience
- language
- products
- approved keywords
```

Do not merely append the entire Brand Memory object blindly to prompts.

---

# 13. AI Output Rule

AI-generated results must have:

- source Brand
- tool
- created timestamp
- generation status
- save behavior
- retry behavior
- error state

Future relevant outputs should support:

- versioning
- campaign association
- reuse

---

# 14. External Integration Rule

Never claim an integration exists because its UI exists.

Classify integrations as:

```text
REAL
DEMO
PLANNED
```

Examples:

- Meta posting
- analytics connectors
- trend providers
- music providers
- presentation generators

---

# 15. Design Reference Rule

Client reference materials are inspiration, not literal copies.

Preserve:

- mood
- hierarchy
- interaction principles
- motion language
- color language

Do not copy:

- logos
- proprietary assets
- text
- exact compositions
- branded interface elements

cre8.ai must have its own identity.

---

# 16. Client Expectation Rule

Every major visual unit should be evaluated against this question:

> Does this meet the supplied client reference, or does it still look like the old content.ai product?

Every product unit should be evaluated against:

> Does this make cre8.ai feel like an AI marketing department rather than a collection of AI generators?

---

# 17. Above-Expectation Rule

To exceed expectations, prioritize product coherence over adding random features.

High-value differentiators:

1. Brand Memory
2. Department architecture
3. Strategy → Campaign → Creative continuity
4. Multi-brand workspaces
5. cinematic department universe
6. practical Mission Control
7. saved history and reusable outputs
8. consistent Brand context

Do not exceed expectations by adding unrequested complexity.

---

# 18. Safety Gates

Stop and report before:

- destructive database migration
- deleting existing user data
- changing auth contracts
- changing payment contracts
- deleting working generation logic
- replacing APIs
- renaming production storage
- changing deployment infrastructure
- large dependency changes
- repository-wide rename affecting technical identifiers

---

# 19. Definition of Done Per Unit

A unit is done only when:

- scope is completed,
- unrelated functionality remains intact,
- type-check passes,
- build passes,
- unit-specific tests pass,
- Demo Mode impact is checked,
- responsive impact is checked for visual units,
- known limitations are documented.

---

# 20. No-Silent-Assumption Rule

If required business information is unknown:

- prices
- provider
- integration platform
- payment behavior
- posting destinations
- analytics source

do not invent it.

Implement a safe abstraction or stop and report the decision needed.

---

# 21. Final Engineering Goal

The migration is complete when the existing product has evolved from:

```text
content.ai
AI media generator
```

into:

```text
cre8.ai
AI Marketing Department
    ↓
Brand Memory
    ↓
Strategy
    ↓
Campaigns
    ↓
Creative
    ↓
Content
    ↓
Social
    ↓
Analytics
```

while preserving the valuable working generation technology already built.