# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Start here

**Read `AGENTS.md` first.** It is the authoritative, actively-maintained architecture
reference for this repo (frontend routes, every backend module, the template
timeline/render pipeline, credits system, conventions, and commands) and is kept
current by the team. This file only adds pointers and anything AGENTS.md doesn't
cover — it does not duplicate it.

## What this project is

Pixovid (package name `video-arena`) is a generative-media SaaS: users generate
videos/images and do face swaps via OpenRouter + a self-hosted FaceFusion service,
with an admin-authored template system for creating reusable multi-clip video
templates. Bun-managed Turborepo monorepo: `apps/frontend` (React/Vite/TS),
`apps/backend` (Express/TS, run directly with bun, no build step), `packages/db`
(Prisma schema + client, shared by the backend).

## Commands

```sh
bun install                 # install all workspace deps
bun run dev                 # run all apps with hot reload (turbo)
bun run build               # build everything (frontend vite build + backend tsc --noEmit)
bun run check-types         # type-check the whole monorepo
bun run lint                # lint everything (turbo)
bun run format              # prettier --write across ts/tsx/md

bun run db:generate         # regenerate the Prisma client after schema changes
bun run db:push             # sync packages/db/prisma/schema.prisma -> Postgres (no migration file)
bun run db:migrate          # apply Prisma migrations
bun run db:studio           # open Prisma Studio
```

Per-app (also runnable via `bun run --cwd apps/backend <script>` / `apps/frontend`):

```sh
bun run --cwd apps/backend dev     # bun --watch src/index.ts
bun run --cwd apps/backend start   # bun src/index.ts (no watch)
bun run --cwd apps/backend lint    # eslint src
bun run --cwd apps/frontend dev    # vite
bun run --cwd apps/frontend lint   # eslint src
```

There is no test suite in this repo (no `test` script in any `package.json`).
Verify changes with `check-types` + `build`, and by smoke-testing the running app
(see AGENTS.md's Verification section).

### Local infrastructure (Docker)

```sh
bun run infra:up            # Postgres + MinIO only (for host-based app dev)
bun run docker:up           # full stack in Docker (build + start)
bun run docker:facefusion   # build + start the FaceFusion swap service (~5GB image)
bun run docker:down         # stop containers
bun run docker:reset        # stop + DELETE volumes (destructive — wipes DB + objects)
```

## Architecture pointers

For full detail read `AGENTS.md`; brief orientation:

- **`apps/frontend`** — React Router SPA. Routes: `/` (video), `/image`,
  `/face-swap`, `/user/templates`, `/user/avatar`, `/admin/template/create`. API
  calls centralized in `src/lib/api.ts`; auth via `better-auth/react`
  (`src/lib/auth-client.ts`). The admin template editor
  (`src/components/timeline/`) is a hand-built Premiere-style multi-track
  timeline — read AGENTS.md before touching it, the drag/crop/link-group
  semantics are non-obvious.
- **`apps/backend`** — Express API, TypeScript run directly by bun (backend
  imports use `.js` extensions per NodeNext; bun resolves these to `.ts`).
  Generation routes (`videos`, `images`, `faceswaps`, template renders) are all
  **synchronous**: create a DB row `IN_PROGRESS`, call the provider, store the
  result, mark `COMPLETED`/`FAILED`. New media-type routes should follow this
  same pattern and reuse `src/lib/uploads.ts`.
- **`packages/db`** — the only place Prisma should be touched; the backend
  imports the generated client as `@repo/db`. Run `bun run db:generate` after
  editing `prisma/schema.prisma`.
- **`infra/facefusion`** — FastAPI wrapper around FaceFusion's CLI, started via
  the `facefusion` Docker Compose profile.
- **`spec/`** — historical, numbered design/decision docs written during feature
  development (e.g. `04-video-templates.md`, `12-timeline-editor-learnings.md`).
  Useful background on *why* a subsystem looks the way it does, but not kept
  in sync with the code — treat as historical context, not current truth.

## Conventions worth internalizing before editing

These are called out in AGENTS.md but easy to violate accidentally:

- Money/credits, avatars-by-slot (never per-block uploads), the multi-track
  timeline's overlap rules, and the face-swap provider abstraction
  (`SWAP_PROVIDER=facefusion|flux`) all have specific invariants documented in
  AGENTS.md — read the relevant section before changing that code, since the
  failure modes (double-refunds, silently wrong renders) aren't caught by
  type-checking.
- All uploaded/generated media must go through MinIO (`src/lib/storage.ts`),
  never local disk.
- Local host-based template rendering requires `ffmpeg`/`ffprobe` on PATH.
