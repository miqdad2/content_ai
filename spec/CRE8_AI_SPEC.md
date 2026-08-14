# cre8.ai — Product & Engineering Specification

## 0. Document Purpose

This file is the authoritative product, UX, design, architecture, and implementation specification for transforming the existing `content.ai` application into **cre8.ai**.

The objective is not merely to rename or visually reskin the existing product.

The objective is to evolve the current AI media generator into a premium **AI Marketing Department / Marketing Operating System** that:

- meets the client’s supplied references,
- exceeds the client’s expectations through a coherent product architecture,
- preserves already-working image/video generation functionality,
- introduces Brand Memory as the intelligence foundation,
- organizes capabilities into realistic marketing departments,
- provides a cinematic public experience,
- provides a practical authenticated workspace,
- remains safe to evolve into a production product later.

---

# 1. Product Identity

## Brand

**cre8.ai**

## Core positioning

> Your AI Marketing Department.

Secondary positioning:

> Strategize. Create. Launch. Analyze.

Product description:

> cre8.ai brings marketing strategy, campaigns, creative production, content, social media and analytics into one intelligent brand-aware workspace.

---

# 2. Product Philosophy

cre8.ai must not feel like:

- a random collection of AI tools,
- a generic image/video generator,
- a purple SaaS dashboard,
- a gaming application,
- a children's space website,
- a generic ChatGPT wrapper.

cre8.ai should feel like:

- a premium AI marketing operating system,
- an intelligent virtual marketing department,
- a futuristic mission-control environment,
- an enterprise-ready platform,
- a cinematic but usable product,
- a system that understands the user's brand and applies that knowledge everywhere.

---

# 3. Client Requirements Captured

The client requested the following capabilities.

## AI Creative

- AI Image
- AI Video
- AI Music
- Logo Generation
- Presentation Generation
- Hashtag Generation
- AI Voiceover
- AI Avatar

## Marketing Intelligence

- Marketing Strategies
- Trend Intelligence
- Marketing Campaigns
- Digital Marketing

## Content

- Caption Generation
- Prompt Generation

## Analytics

- AI Report Generation
- AI Insights

## Automation

- Auto-Posting

## Shared Intelligence

- AI Brand Memory

## Additional ideas captured but deferred

These are acknowledged but not part of the current implementation priority:

- CRM
- Task Management
- Invoice Generator
- deeper Meta advertising execution
- detailed social-platform posting integrations

They must not influence current architecture in a way that blocks future support.

---

# 4. Existing Functionality That Must Be Preserved

The existing application already contains valuable functionality.

Preserve and reuse wherever technically safe:

- AI video generation
- AI image generation
- face swap if product owner retains it
- avatar functionality
- templates
- generation history
- media previews
- generation models
- prompt input
- reference-image inputs
- model selection
- duration / aspect / resolution controls
- credits
- billing foundations
- authentication
- Demo Mode
- media showcase assets
- existing video gallery
- existing generated example videos
- existing backend contracts
- existing API functions
- current safe admin functionality

Do not rebuild working generation functionality merely to fit the new UI.

Wrap and reposition it inside the cre8.ai architecture.

---

# 5. Product Architecture

The new product hierarchy is:

```text
User
  ↓
Brand Workspace
  ↓
Brand Memory
  ↓
Mission Control
  ↓
Marketing Departments
  ↓
Department Tools
  ↓
Generated Outputs
  ↓
History / Insights / Publishing
```

Brand Memory sits above all departments.

---

# 6. Brand Workspace Architecture

The system must be designed for multiple brands even if initial MVP usage commonly involves one.

Conceptual relationship:

```text
User
 ├── Brand Workspace A
 │    ├── Brand Memory
 │    ├── Strategies
 │    ├── Campaigns
 │    ├── Generations
 │    ├── Reports
 │    └── Insights
 │
 ├── Brand Workspace B
 │    └── ...
 │
 └── Brand Workspace C
      └── ...
```

This is important for:

- agencies,
- freelancers,
- consultants,
- companies with multiple brands.

Do not hard-code a permanent single-brand assumption.

---

# 7. AI Brand Memory

AI Brand Memory is a core cre8.ai feature.

It must become the shared context used by every AI department.

## Brand Memory fields

### Identity

- Brand name
- Logo
- Tagline
- Website
- Industry
- Company description

### Visual identity

- Primary colors
- Secondary colors
- Fonts
- Visual style
- Image references
- Logo rules
- Brand guidelines

### Market

- Primary market
- Additional countries
- Target audience
- Customer segments
- Demographics where appropriate
- Competitors

### Positioning

- USP
- Core benefits
- Key differentiators
- Brand values
- Brand personality

### Tone

- Tone of voice
- Writing style
- Preferred language
- Words to use
- Words to avoid
- CTA style

### Products / services

- Offerings
- Pricing context where applicable
- Product descriptions
- Key features
- Key benefits

### Marketing memory

- Previous campaigns
- Approved messaging
- Previous generated content
- campaign goals
- preferred channels
- previous strategies

### Files

Support future upload/reference for:

- brand guideline PDFs
- presentations
- product sheets
- documents
- existing ads
- campaign reports

---

# 8. Brand Onboarding

Recommended first-time journey:

```text
Sign Up
→ Create Brand Workspace
→ Build Brand Memory
→ Review Brand Profile
→ Enter Mission Control
```

Do not send a new user directly into an empty dashboard.

## Onboarding steps

### Step 1 — Brand

- Brand name
- Website
- Industry
- country / market

### Step 2 — Business

- Products/services
- business description
- target audience

### Step 3 — Positioning

- differentiators
- competitors
- objectives

### Step 4 — Voice

- tone
- preferred language
- writing style

### Step 5 — Visual

- logo
- colors
- visual references

### Step 6 — Review

Present generated Brand Memory summary.

User confirms or edits.

---

# 9. Marketing Departments

Public-facing department presentation should use the client's cinematic planetary/orbital concept.

Authenticated department workspaces should prioritize productivity and usability.

## Department 01 — Chief Marketing Officer

### Tools

- Generate Marketing Strategies
- Generate Trend Intelligence

### Purpose

High-level marketing planning and intelligence.

---

## Department 02 — Marketing Director

### Tools

- Generate Marketing Campaigns
- Generate Digital Marketing

### Purpose

Convert strategic objectives into executable campaign plans.

---

## Department 03 — Head of Brand & Creative

### Tools

- Generate AI Images
- Generate AI Videos
- Generate AI Music
- Generate Logos
- Generate Presentations
- Generate Hashtags

### Purpose

Produce brand-consistent creative assets.

Existing AI Video/Image functionality is repositioned here.

---

## Department 04 — Head of Content Marketing

### Tools

- Generate Captions
- Generate Prompts

### Purpose

Produce campaign-ready written content and prompts.

---

## Department 05 — Head of Social Media

### Tools

- Generate AI Voiceovers
- Generate AI Avatars
- Generate Auto-Posting

### Scope note

Auto-Posting should have product architecture and UI presence.

Deep platform integrations can be implemented later.

---

## Department 06 — Marketing Analytics Manager

### Tools

- Generate AI Reports
- Generate AI Insights

### Purpose

Interpret performance and convert data into recommended marketing actions.

---

# 10. Public Landing Page

The existing homepage must be significantly restructured.

However:

**The client explicitly requested that the existing videos remain.**

Do not delete the current video assets.

Do not allow the gallery to remain the primary product identity.

---

# 11. Landing Page Visual Direction

Based on the client references:

## Primary colors

- Black
- Very dark navy
- Electric blue
- Cyan

Optional restrained supporting accents:

- deep indigo
- cool white
- subtle violet only where appropriate

Avoid returning to the previous purple-dominant identity.

---

# 12. Landing Page Experience

Visual concept:

> Premium cinematic AI mission-control experience.

References indicate preference for:

- very dark background
- blue atmospheric glow
- subtle stars
- cinematic negative space
- elegant typography
- central hero object
- floating navigation
- controlled scrolling
- orbital interaction
- large product visuals
- glowing glass where appropriate
- premium motion

---

# 13. Landing Page Structure

## Section 01 — Hero

Headline:

> Your AI Marketing Department.

Supporting line:

> Strategize. Create. Launch. Analyze.

Description:

> Strategy, campaigns, creative, content, social media and analytics — powered by one intelligent brand-aware workspace.

Primary CTA:

> Enter cre8.ai

Secondary CTA:

> Explore Departments

Hero visual:

- Mission Control workspace
- central AI command interface
- subtle planet / orbit references
- blue lighting
- minimal star field

Do not make the hero crowded.

---

## Section 02 — Marketing Universe

Heading:

> Meet Your AI Marketing Department

Create a cinematic orbital department selector inspired by the client’s planet reference.

Departments behave as planets or orbital destinations.

Each department should show:

- title
- role
- short description
- primary capabilities
- CTA

Avoid a normal six-card SaaS grid as the primary experience.

Fallback for lower-power/mobile devices can be a premium vertical/horizontal card sequence.

---

## Section 03 — Brand Memory

Headline:

> One Brand. One Memory. Every Department.

Show how Brand Memory powers all departments.

Visual flow:

```text
Brand Memory
    ↓
Strategy
Campaigns
Creative
Content
Social
Analytics
```

Explain that cre8.ai remembers:

- visual identity
- audience
- tone
- products
- objectives
- competitors
- previous campaigns

---

## Section 04 — CMO Intelligence

Show:

- Marketing Strategy
- Trend Intelligence

Use cinematic product mockups, not abstract feature cards only.

---

## Section 05 — Marketing Director

Show:

- Campaign Generator
- Digital Marketing

Suggested campaign outputs:

- objective
- audience
- messaging
- channels
- campaign ideas
- budget guidance
- calendar
- KPIs

---

## Section 06 — Brand & Creative

Heading example:

> From strategy to campaign-ready creative.

Feature navigation:

- AI Image
- AI Video
- AI Music
- Logos
- Presentations
- Hashtags

---

# 14. Existing Video Assets on Homepage

This section is mandatory.

Existing videos must remain available on the homepage.

Use them as a **Creative Showcase**, not as the main product hierarchy.

Suggested title:

> See What cre8.ai Can Create

or:

> Creative Made with cre8.ai

Preserve:

- Featured videos
- current video assets
- current media functionality
- current gallery where practical

Improve its positioning.

The large masonry gallery may remain but should appear lower in the page.

It should not consume the entire product narrative.

---

# 15. Content Marketing Section

Present:

- Caption Generator
- Prompt Generator

Show actual output examples.

Avoid generic icon cards.

---

# 16. Social Media Section

Present:

- Voiceovers
- Avatars
- Auto-Posting

Auto-Posting can be presented as:

> Create. Schedule. Publish.

Actual supported destinations will be decided later.

Do not falsely claim production integrations that do not exist.

---

# 17. Analytics Section

Present:

- AI Reports
- AI Insights

Potential outputs:

- campaign summary
- performance interpretation
- opportunity identification
- anomalies
- recommended actions
- next campaign recommendations

---

# 18. Pricing Page

Follow the client’s supplied pricing reference.

Visual direction:

- black background
- blue/cyan atmospheric glow
- premium glass pricing cards
- large negative space
- highlighted recommended plan
- monthly/yearly switch
- subtle luminous edges
- strong white CTA

Suggested naming pending business approval:

- Launch
- Orbit
- Mission
- Enterprise

Do not hard-code final prices until client confirms them.

---

# 19. Department Public Page

The Department page should be one of cre8.ai’s signature experiences.

Use:

- solar-system / planet metaphor
- scroll-driven transitions
- dark navy/black background
- blue planetary rim light
- realistic / premium planetary visuals
- department titles
- minimal body text
- smooth transitions
- large negative space

Avoid:

- cartoon planets
- game HUD overload
- excessive glow
- playful sci-fi fonts
- excessive star density

Mood:

> luxury technology × mission control × AI marketing.

---

# 20. Authenticated Experience

Public pages may be cinematic.

Authenticated pages must become efficient workspaces.

Do not force cinematic planetary navigation into daily productivity screens.

---

# 21. Mission Control

Mission Control is the authenticated home.

It should show:

- active Brand Workspace
- Brand Memory status
- departments
- recent work
- recent generations
- recent campaigns
- recent strategies
- credits
- quick actions

Conceptual layout:

```text
Top Bar
  Brand Selector
  Search / Command
  Credits
  Account

Left Navigation
  Mission Control
  Departments
  Brand Memory
  History

Main Area
  Welcome / active brand
  Department shortcuts
  Recent activity
  Suggested next actions
```

---

# 22. Workspace Navigation

The old top-level navigation:

- Video
- Image
- Templates
- Avatar

must no longer define the entire authenticated product.

These become tools inside relevant departments.

Recommended global navigation:

- Mission Control
- Departments
- Brand Memory
- Work / History

Department-local navigation can expose individual tools.

---

# 23. Creative Workspace

Current video page is useful but architecturally incorrect for cre8.ai.

Preserve its functional form.

Reposition as:

```text
Mission Control
→ Head of Brand & Creative
→ AI Video
```

## Recommended layout

### Workspace header

- Department
- Tool
- active Brand
- credits
- history/help

### Left

Generation controls.

### Center

Prompt/reference/model settings where appropriate.

### Right

Generation result / preview / recent outputs.

Remove the permanent oversized tutorial panel.

Move “How it works” into:

- drawer,
- modal,
- onboarding overlay,
- optional help view.

---

# 24. Brand Context

Every tool should clearly show the active Brand Workspace.

Example:

> Working for: ZOE Bakery

or:

> Brand: ZOE Bakery

User can switch brands where allowed.

Brand context must inform future generation prompts.

---

# 25. Design System

## Base

- near-black
- midnight navy

## Primary

- electric blue

## Secondary

- cyan

## Neutral

- cool white
- blue-gray
- muted slate

## Glass

Use selectively.

Pricing, floating nav, panels and overlays can use glass.

Do not make the entire product transparent.

---

# 26. Typography

Public marketing pages:

- editorial / cinematic display hierarchy
- large hero type
- controlled elegant line lengths

Authenticated workspace:

- highly readable sans-serif
- compact functional hierarchy

Do not use novelty sci-fi fonts for functional UI.

---

# 27. Motion Principles

Motion should feel:

- slow
- cinematic
- deliberate
- physical
- premium

Use:

- opacity
- transform
- scale
- subtle parallax
- controlled scroll transitions

Avoid:

- constant pulsing
- bouncing
- spinning UI
- large animated blur
- aggressive neon animation

Honor `prefers-reduced-motion`.

---

# 28. Responsive Experience

Desktop:

- immersive hero
- orbital departments
- rich previews

Tablet:

- simplified orbital interaction
- reduced parallax

Mobile:

- avoid heavy planetary scroll choreography
- replace with curated vertical department flow
- maintain brand theme
- preserve fast loading
- minimum 44px touch targets

Required validation:

- 375
- 768
- 1024
- 1440
- 1920

---

# 29. Demo Mode

Preserve current Demo Mode.

Demo Mode must continue to:

- allow client login
- use mock data
- avoid real backend operations
- disable payments
- prevent unsafe admin access unless explicitly changed later

Rebrand demo content to cre8.ai.

Do not remove Demo Mode during redesign.

---

# 30. Rebranding Requirements

Replace public-facing `content.ai` branding with:

**cre8.ai**

Audit:

- Navbar
- Footer
- metadata
- page titles
- Login
- account display
- Demo user display
- logos
- favicon
- CTA copy
- billing copy
- public descriptions
- generated demo labels

Do not blindly replace internal technical identifiers if doing so risks production systems.

Classify identifiers before changing them.

---

# 31. URL Strategy

Public product name:

`cre8.ai`

Desired real production domain:

`cre8.ai`

Vercel preview names are implementation details.

Do not hard-code Vercel URLs into application behavior.

---

# 32. Out of Scope for Current Phase

Do not build full versions yet of:

- CRM
- task management
- invoicing
- full Meta Ads campaign execution
- all social publishing integrations
- enterprise analytics warehouse
- complex marketing attribution

Architecture must not prevent them later.

---

# 33. Implementation Principles

1. Preserve working functionality.
2. Audit before refactoring.
3. No big-bang rewrite.
4. Build shared foundation first.
5. Reuse current API contracts where possible.
6. Add new backend domains only after explicit design.
7. Keep Demo Mode working throughout.
8. Verify after every implementation unit.
9. Never replace working generation functionality merely for visual cleanliness.
10. Do not fake unsupported production integrations.

---

# 34. Proposed Route Architecture

Public:

```text
/
/departments
/pricing
/login
```

Authenticated:

```text
/app
/app/brands
/app/brands/:brandId
/app/brands/:brandId/memory

/app/departments
/app/departments/cmo
/app/departments/marketing-director
/app/departments/brand-creative
/app/departments/content
/app/departments/social
/app/departments/analytics
```

Tool routes:

```text
/app/brands/:brandId/creative/image
/app/brands/:brandId/creative/video
/app/brands/:brandId/creative/music
/app/brands/:brandId/creative/logo
/app/brands/:brandId/creative/presentation
/app/brands/:brandId/creative/hashtags

/app/brands/:brandId/content/captions
/app/brands/:brandId/content/prompts

/app/brands/:brandId/social/voiceover
/app/brands/:brandId/social/avatar
/app/brands/:brandId/social/auto-post

/app/brands/:brandId/cmo/strategy
/app/brands/:brandId/cmo/trends

/app/brands/:brandId/marketing/campaign
/app/brands/:brandId/marketing/digital

/app/brands/:brandId/analytics/reports
/app/brands/:brandId/analytics/insights
```

This is a target architecture, not permission to rename all existing routes immediately.

Migrate safely.

---

# 35. Data Model — Conceptual

Future models likely include:

```text
BrandWorkspace
BrandMemory
BrandAsset
BrandProduct
BrandCompetitor
BrandGuideline

MarketingStrategy
TrendInsight
MarketingCampaign
DigitalMarketingPlan

CreativeGeneration
CaptionGeneration
PromptGeneration
VoiceGeneration
AvatarGeneration

MarketingReport
MarketingInsight
```

Do not create all models prematurely.

Implement only as each functional unit requires.

---

# 36. Success Criteria

The final cre8.ai product should cause a client/user to understand within seconds:

1. This is not merely an AI image/video generator.
2. cre8.ai acts like an AI marketing department.
3. Marketing responsibilities are organized into realistic roles.
4. My brand information is remembered and reused.
5. I can move from strategy → campaign → content → publishing → analytics.
6. AI image/video generation remains powerful inside the creative department.
7. The product feels premium and distinctive.
8. The visual design clearly reflects the client’s black/blue space-tech references.

---

# 37. Final Product Narrative

The experience should tell one story:

> **Build your brand memory.  
> Activate your AI marketing department.  
> Create strategy.  
> Build campaigns.  
> Produce content.  
> Launch it.  
> Understand what happened.  
> Improve the next move.**

That is cre8.ai.