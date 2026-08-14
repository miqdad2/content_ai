# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Start here

Read these files before making product or architecture changes:

1. `spec/CRE8_AI_SPEC.md`
2. `spec/CRE8_AI_LOOP_ENGINEERING.md`
3. `AGENTS.md`

`AGENTS.md` is the authoritative technical safety and architecture reference for the current repository.

`spec/CRE8_AI_SPEC.md` is the authoritative product / UX / branding direction for cre8.ai.

`spec/CRE8_AI_LOOP_ENGINEERING.md` defines the phased implementation process.

If product direction and current technical behavior conflict, do not silently rewrite the subsystem. Preserve working behavior, report the conflict, and migrate it incrementally.

---

# Active product

The active product is **cre8.ai**.

cre8.ai is evolving from the legacy Pixovid / Video Arena / content.ai generative-media application into an:

> **AI Marketing Department / Marketing Operating System**

The target product centers on:

- Brand Workspaces
- AI Brand Memory
- Mission Control
- Marketing Departments
- Department-specific AI tools
- shared history / outputs / insights

The existing media-generation, templates, auth, credits, billing, storage and render systems remain valuable and must be preserved during migration.

---

# Legacy identities

The repository may still contain:

- Pixovid
- Video Arena
- content.ai
- `video-arena`

Do not globally replace these names.

Classify each occurrence first:

- public-facing brand → migrate to cre8.ai
- internal package name → usually keep
- deployment/storage identifier → keep unless a dedicated migration requires a rename
- historical comment → update only if misleading

---

# spec/ directory

The old numbered content.ai / template-development specs have been retired.

The active specification files are:

- `spec/CRE8_AI_SPEC.md`
- `spec/CRE8_AI_LOOP_ENGINEERING.md`

If `spec/CRE8_CURRENT_ARCHITECTURE.md` exists, treat it as the current-state implementation map.

Do not assume deleted historical specs are still authoritative.

---

# Repository

Bun-managed Turborepo monorepo:

- `apps/frontend` — React + Vite + TypeScript SPA
- `apps/backend` — Express + TypeScript API, run directly with bun
- `packages/db` — Prisma schema + generated client
- `infra/facefusion` — self-hosted FaceFusion wrapper
- `spec/` — active cre8.ai specifications

Package manager: **bun**.

---

# Current migration principle

Do not rebuild the application from zero.

The migration strategy is:

```text
preserve working functionality
→ introduce cre8.ai brand foundation
→ introduce new public architecture
→ introduce Mission Control
→ introduce Brand Workspace / Brand Memory
→ migrate existing generators under departments
→ add new department capabilities incrementally
```

Existing AI Video / AI Image / Templates / Avatar functionality should be reused inside **Head of Brand & Creative**.

---

# cre8.ai departments

## Chief Marketing Officer
- Marketing Strategies
- Trend Intelligence

## Marketing Director
- Marketing Campaigns
- Digital Marketing

## Head of Brand & Creative
- AI Images
- AI Videos
- AI Music
- Logos
- Presentations
- Hashtags

## Head of Content Marketing
- Captions
- Prompts

## Head of Social Media
- Voiceovers
- Avatars
- Auto-Posting

## Marketing Analytics Manager
- Reports
- Insights

Brand Memory is shared across departments.

CRM, Task Management, Invoice Generator, deep Meta Ads execution and broad social integrations are deferred unless explicitly activated by a later unit.

---

# Commands

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

Local infrastructure:

```sh
bun run infra:up
bun run docker:up
bun run docker:facefusion
bun run docker:down
bun run docker:reset
```

`docker:reset` is destructive.

---

# High-risk areas

Read the relevant sections of `AGENTS.md` before modifying:

- auth
- credits/refunds
- Razorpay/payment verification
- MinIO/storage
- Prisma
- template rendering
- timeline drag/crop/link-group behavior
- audio clips
- face swap providers
- uploads
- Demo Mode

Do not treat type-checking as sufficient protection for these systems.

---

# Frontend

The current frontend is still partly organized around the legacy media-generator architecture.

Do not assume the old top-level tool navigation is the final cre8.ai structure.

Current working generator pages should be preserved while being migrated under the new department/workspace model.

Target authenticated hierarchy:

```text
Mission Control
→ Brand Workspace
→ Brand Memory
→ Departments
→ Department Tool
→ Output / History
```

Public pages may use cinematic black/navy/electric-blue space-inspired design.

Authenticated pages must remain practical and efficient.

---

# Demo Mode

The frontend has a client Demo Mode controlled by:

```env
VITE_DEMO_MODE=true
```

Demo Mode must remain isolated from real production behavior.

Do not:
- expose backend secrets
- enable real payment
- give the public demo user admin access
- allow unrelated changes to alter the real auth/API/payment path

Any Demo Mode change must be checked in both demo and real modes.

---

# Backend

Backend generation routes currently use the existing synchronous pattern:

```text
create IN_PROGRESS row
→ call provider
→ store output
→ mark COMPLETED / FAILED
→ charge/refund credits according to current rules
```

Do not change this pattern casually.

New backend domains for cre8.ai must be introduced in dedicated units with explicit API/data ownership.

---

# Prisma

Only modify Prisma through `packages/db`.

Do not create speculative cre8.ai models before their unit is designed.

Brand Workspace / Brand Memory data models are planned, not assumed to exist until implemented.

---

# Storage

All production user uploads and generated media belong in object storage through the existing MinIO abstraction.

Never move production media persistence to local disk.

Do not rename storage buckets or production identifiers during simple rebranding.

---

# External integrations

Every integration must be classified as:

```text
REAL
DEMO
PLANNED
```

Do not make the UI imply that a planned provider/integration is live.

This is especially important for:

- Auto-Posting
- Meta Ads execution
- trend intelligence providers
- music generation
- presentations
- analytics connectors

---

# Verification

For normal frontend/code units:

```sh
bun run check-types
bun run --cwd apps/frontend build
```

For backend changes, add the relevant backend smoke test.

For Demo Mode changes, verify both:
- demo build / `VITE_DEMO_MODE=true`
- real mode with Demo Mode disabled

For visual work, do not claim visual QA unless the rendered page was actually inspected.

---

# Unit workflow

Every implementation unit should follow:

```text
Inspect
→ Understand
→ Scope
→ Plan
→ Implement
→ Verify
→ Review
```

Before editing:

```sh
git status
git branch --show-current
git log -1 --oneline
```

Do not reset, clean, stash, delete or sweep unrelated work.

Do not commit or push unless explicitly requested.

---

# Final rule

Every meaningful change should answer both questions:

1. Does this move the product toward the active cre8.ai specification?
2. Does it preserve the working technical behavior that already exists?

If either answer is uncertain, stop and inspect before editing.
