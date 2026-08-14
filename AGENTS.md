# AGENTS.md

Guidance for AI coding agents working in this repository.

## Read this first

This repository is actively migrating from the legacy Pixovid / Video Arena / content.ai product into **cre8.ai**.

Do not treat the old product identity as the current product direction.

### Source of truth

For product, UX, branding, roadmap, and migration direction:

1. `spec/CRE8_AI_SPEC.md`
2. `spec/CRE8_AI_LOOP_ENGINEERING.md`

For current technical implementation and safety invariants:

1. `AGENTS.md`
2. Current codebase
3. `CLAUDE.md`

If the active cre8.ai product specification conflicts with an existing technical invariant, do not silently rewrite the subsystem. Preserve working behavior, report the conflict, and follow the phased migration process in `spec/CRE8_AI_LOOP_ENGINEERING.md`.

---

# 1. Product overview

## Active product

**cre8.ai** is an **AI Marketing Department / Marketing Operating System** evolving from an existing generative-media SaaS.

The existing application already contains working AI media-generation, templates, credits, billing, authentication, storage, and demo capabilities. These are valuable production assets and must be preserved while being repositioned inside the new cre8.ai architecture.

The target high-level product model is:

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
Outputs / History / Insights
```

## cre8.ai departments

### Chief Marketing Officer
- Generate Marketing Strategies
- Generate Trend Intelligence

### Marketing Director
- Generate Marketing Campaigns
- Generate Digital Marketing

### Head of Brand & Creative
- Generate AI Images
- Generate AI Videos
- Generate AI Music
- Generate Logos
- Generate Presentations
- Generate Hashtags

### Head of Content Marketing
- Generate Captions
- Generate Prompts

### Head of Social Media
- Generate AI Voiceovers
- Generate AI Avatars
- Generate Auto-Posting

### Marketing Analytics Manager
- Generate AI Reports
- Generate AI Insights

Existing AI Image, AI Video, Templates and Avatar functionality should be migrated primarily under **Head of Brand & Creative** without rewriting the generation engine.

## Core shared intelligence

**AI Brand Memory** is a planned core foundation for cre8.ai.

Brand Memory will become shared context for departments and tools, including:
- brand identity
- logo/colors/fonts
- products/services
- audience
- market
- tone of voice
- positioning
- competitors
- approved messaging
- prior campaign context
- brand documents/assets

Do not document or assume Brand Memory backend models as implemented until the code actually contains them.

## Deferred / planned features

The following are acknowledged but are not current implementation priorities unless explicitly activated in a later unit:

- CRM
- Task Management
- Invoice Generator
- deep Meta Ads execution
- broad social-platform auto-posting integrations
- advanced attribution / enterprise analytics

Do not falsely present planned integrations as production-ready.

---

# 2. Repository overview

This is a **bun-managed Turborepo monorepo**.

- `apps/frontend` — React + Vite + TypeScript SPA, Tailwind v4, shadcn-style UI
- `apps/backend` — TypeScript + Express API, run directly with bun
- `packages/db` — Prisma schema + generated client shared by the backend
- `infra/facefusion` — self-hosted FaceFusion service wrapper
- `spec/` — active cre8.ai product and engineering specifications

Package manager: **bun**.

Do not introduce npm/pnpm/yarn workflows unless explicitly requested.

---

# 3. Current frontend implementation

The current frontend is still in a migration state. It contains the newer public landing experience and the legacy media-generation application.

### Current routes

Verify against `apps/frontend/src/App.tsx` before editing route behavior.

Expected current routes include:

- `/` — public landing page
- `/login`
- `/video`
- `/image`
- `/face-swap`
- `/user/templates`
- `/user/avatar`
- `/generation/:id`
- `/billing`
- `/admin/template/create`
- legal pages

If the actual `App.tsx` differs, **the current code wins for current-state facts**.

### Target route direction

The target cre8.ai structure is defined in `spec/CRE8_AI_SPEC.md`.

Do not rename all existing routes at once. Migrate incrementally and preserve compatibility while the new architecture is introduced.

---

# 4. Frontend architecture and conventions

- React + Vite + TypeScript
- Tailwind v4
- shadcn-style UI primitives under `apps/frontend/src/components/ui`
- `@/` alias points to `src/`
- auth client lives in `src/lib/auth-client.ts`
- API calls are centralized in `src/lib/api.ts`
- `/api/me` is consumed through `src/lib/useMe.ts`
- Demo Mode is implemented in the frontend and must remain isolated from real backend behavior

## Demo Mode

The current client-demo environment is controlled through:

```env
VITE_DEMO_MODE=true
```

Demo Mode exists to show the product without depending on the production backend.

Current safety expectations:
- fixed demo account only
- mock/sample data
- non-admin demo user
- no real payment
- no real backend writes
- no production secrets in `VITE_*`
- real mode must remain unchanged when Demo Mode is disabled

The current demo login used for presentation is:

```text
demo@content.ai
demo1234
```

This legacy-visible email may later be rebranded to cre8.ai in a dedicated migration unit. Do not change auth/demo behavior casually during unrelated visual work.

---

# 5. Backend architecture

`apps/backend` is a TypeScript + Express API run directly with bun.

Backend imports use `.js` extensions under NodeNext; bun resolves them to `.ts` at runtime.

Important modules include:

- `src/auth.ts` — better-auth with Prisma adapter
- `src/lib/openrouter.ts` — video/image generation and model listing
- `src/lib/facefusion.ts` — FaceFusion / swap-provider integration
- `src/lib/storage.ts` — MinIO / S3-compatible storage
- `src/lib/uploads.ts` — shared upload handling
- `src/lib/ffmpeg.ts` — ffmpeg/ffprobe media operations
- `src/lib/templateRender.ts`
- `src/lib/runRender.ts`
- `src/lib/templateSerialize.ts`
- `src/middleware/requireAdmin.ts`
- `src/routes/videos.ts`
- `src/routes/images.ts`
- `src/routes/faceswaps.ts`
- `src/routes/avatars.ts`
- `src/routes/templates.ts`
- `src/routes/adminTemplates.ts`
- `src/routes/me.ts`
- `src/routes/models.ts`
- `src/routes/credits.ts`

Do not duplicate backend responsibilities in the frontend.

---

# 6. Database / Prisma rules

`packages/db` is the only place Prisma schema logic should be changed.

The backend imports the generated client through `@repo/db`.

Current models include the legacy media-generation and template system, including:
- User
- Video
- Image
- FaceSwap
- Avatar
- Template
- TemplateBlock
- TemplateAudioClip
- TemplateRender
- CreditTransaction
- Payment

Brand Workspace / Brand Memory models are **planned** and must be designed in a dedicated cre8.ai unit before implementation.

Never create speculative database models because they may be useful later.

Every new backend model requires:
- defined user behavior
- ownership
- permissions
- API contract
- migration plan
- verification

---

# 7. Existing generation behavior that must be preserved

Existing media generation is a critical reusable subsystem.

Current pattern:
1. create DB row as `IN_PROGRESS`
2. call provider synchronously
3. persist result to object storage
4. mark `COMPLETED` or `FAILED`
5. charge/refund credits according to existing invariants

When adding or migrating media tools, preserve this pattern unless a dedicated architecture unit explicitly replaces it.

Do not rebuild working image/video generation merely to fit new navigation.

---

# 8. Storage rules

All uploaded and generated user media must go through MinIO / object storage.

Do not store user-generated production media on local disk.

Relevant modules:
- `src/lib/storage.ts`
- `src/lib/uploads.ts`

Do not rename production buckets or storage identifiers during branding work.

---

# 9. Credits and billing invariants

Credits are safety-sensitive.

Current behavior includes:
- fixed credit cost per billable generation action
- atomic decrement
- 402 on insufficient balance
- idempotent/net-aware refund behavior
- purchase ledger
- Razorpay payment verification
- webhook signature verification

Do not alter these invariants during UI migration.

The public demo must keep payment disabled.

Real Razorpay behavior must remain unchanged when Demo Mode is off.

---

# 10. Admin and permissions

Admins are determined by the current `User.role` / admin resolution flow documented in the backend.

Admin-only routes must remain protected by backend authorization.

Frontend visibility is not a security boundary.

The public Demo Mode user is non-admin and must not gain admin access through visual/navigation changes.

---

# 11. Template editor / timeline — high risk

The admin template editor under `apps/frontend/src/components/timeline/` is a hand-built Premiere-style multi-track editor.

Before changing it, understand:
- multi-track video lanes
- audio lanes
- drag behavior
- same-track collision rejection
- cross-track overlap support
- crop/trim semantics
- timeline auto-length
- linked blocks / `linkGroupId`
- copy/paste semantics
- bake behavior
- uploaded-video blocks
- program monitor playback
- audio synchronization
- export/render behavior

Do not refactor timeline behavior during ordinary cre8.ai rebranding or navigation work.

---

# 12. Template / render invariants

Important current behavior:
- templates have no fixed upfront duration
- timeline length is derived from furthest video/audio content
- admins can add uploaded non-AI video blocks
- uploaded blocks bypass AI regeneration
- avatars are assigned by slot
- audio clips can be placed/cropped across lanes
- render pipeline mixes audio and stitches visible video timeline segments
- per-block bake/export behavior is intentionally separate
- export thumbnails may use AI generation with fallback

Do not simplify these systems without a dedicated migration unit.

---

# 13. Face swap

Face swap currently supports a provider abstraction.

`SWAP_PROVIDER` may select:
- `facefusion`
- `flux`

Keep provider-specific logic in the backend.

---

# 14. cre8.ai migration principles

Every migration unit must follow:

```text
Inspect
→ Understand
→ Scope
→ Plan
→ Implement
→ Verify
→ Review
```

Do not perform a big-bang rewrite.

Prefer:
- wrapping current generators in new department workspaces
- new navigation around working functionality
- shared Brand context layers
- compatibility routes
- small, testable units

Avoid:
- rewriting working generators
- global renames of technical identifiers
- deleting legacy systems before replacement is verified
- introducing fake integrations
- adding speculative backend complexity

---

# 15. Public vs authenticated design

Public pages may be cinematic and space-inspired.

Use:
- black
- deep navy
- electric blue
- cyan
- restrained glass
- subtle stars/orbits
- premium motion

Authenticated application screens must prioritize usability.

Use the space/mission-control metaphor for:
- landing
- departments
- transitions
- branding

Use a practical Mission Control/workspace pattern for:
- daily creation
- Brand Memory
- generators
- history
- campaigns
- analytics

Do not turn every authenticated screen into an orbital animation.

---

# 16. Brand Memory engineering rule

Any feature claiming Brand Memory support must explicitly document which fields it consumes.

Example:

```text
Caption Generator consumes:
- tone
- audience
- language
- products
- approved keywords
```

Do not blindly append a complete Brand Memory record into prompts.

---

# 17. External integration rule

Classify external features as:

```text
REAL
DEMO
PLANNED
```

Examples:
- social auto-posting
- Meta Ads execution
- trend providers
- music providers
- presentation generation
- analytics connectors

Never claim a planned integration works because a UI exists.

---

# 18. Legacy names

Legacy names may still exist:

- Pixovid
- Video Arena
- content.ai
- `video-arena`
- deployment identifiers
- package names
- storage names

Before renaming any occurrence, classify it:

A. public product identity → migrate to `cre8.ai`  
B. internal package/repository identifier → usually retain  
C. production/deployment/storage identifier → do not rename blindly  
D. historical comment/context → update only if misleading

Never run an uncontrolled global replacement.

---

# 19. Common commands

```sh
bun install
bun run dev
bun run build
bun run check-types
bun run lint
bun run format

bun run db:generate
bun run db:push
bun run db:migrate
bun run db:studio
```

Per app:

```sh
bun run --cwd apps/backend dev
bun run --cwd apps/backend start
bun run --cwd apps/backend lint

bun run --cwd apps/frontend dev
bun run --cwd apps/frontend build
bun run --cwd apps/frontend lint
```

---

# 20. Local infrastructure

```sh
bun run infra:up
bun run docker:up
bun run docker:facefusion
bun run docker:down
bun run docker:reset
```

`docker:reset` is destructive.

Never run destructive infrastructure commands without explicit approval.

---

# 21. Verification

Before considering a code change complete:

1. `bun run check-types`
2. `bun run --cwd apps/frontend build`
3. For backend changes, smoke-test the backend where feasible.
4. For visual changes, inspect actual rendering in a browser if browser access exists.
5. For Demo Mode changes, verify both demo and real mode.
6. Confirm unrelated protected systems remain unchanged.

Do not claim visual verification without actually viewing the rendered result.

---

# 22. Environment

Secrets are configured through environment files / deployment environment variables.

Never expose secrets through `VITE_*` variables because Vite embeds them into the client bundle.

Examples of backend-only secrets:
- `OPENROUTER_API_KEY`
- `BETTER_AUTH_SECRET`
- Google OAuth secret
- Razorpay secret
- MinIO credentials
- database connection strings

---

# 23. Definition of done

A cre8.ai implementation unit is complete only when:

- its scope is satisfied
- unrelated working behavior is preserved
- type-check passes
- build passes
- unit-specific verification is complete
- Demo Mode impact is understood
- responsive impact is reviewed for visual units
- known limitations are documented

The migration succeeds when the existing working generative-media system has evolved into a coherent cre8.ai AI Marketing Department without losing the functionality already built.
