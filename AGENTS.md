# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

Video Arena is a generative-media SaaS (video + image generation and face swap).
It is a **bun**-managed **Turborepo** monorepo.

- `apps/frontend` — React + Vite + TypeScript SPA. Tailwind v4 + shadcn-style UI
  (components in `src/components/ui`). Auth via `better-auth/react`
  (`src/lib/auth-client.ts`). API calls in `src/lib/api.ts`. Routes: `/` (video),
  `/image`, `/face-swap`, `/user/templates`, `/user/avatar`,
  `/admin/template/create`. Each page reuses the create/library tab layout; shared
  bits live in `components/FileField.tsx` and `components/StatusBadge.tsx`.
  `src/lib/useMe.ts` loads `/api/me` (admin flag) to gate the admin nav link.
  The admin template creator uses a hand-built Premiere-style timeline in
  `components/timeline/` (`Timeline.tsx`, `BlockInspector.tsx`, `TemplateSetupForm.tsx`).
  `Timeline.tsx` includes a program monitor + play/pause/stop transport that scrubs
  a playhead (synced to the audio track) and previews each block's frames — or, if a
  block has been "baked" (its clip generated via the BlockInspector Bake button),
  plays that clip in the monitor.
- `apps/backend` — TypeScript + Express API. Run directly with **bun** (no build step).
  - `src/auth.ts` — better-auth (email/password + Google), Prisma adapter.
  - `src/lib/openrouter.ts` — OpenRouter client: video (submit + poll) **and**
    image (`generateImage`, `listImageModels`) generation, plus video model list.
  - `src/lib/facefusion.ts` — calls the self-hosted FaceFusion swap service over HTTP.
  - `src/lib/storage.ts` — MinIO (S3-compatible) object-store client.
  - `src/lib/uploads.ts` — shared multer instance + image helpers (`extFromMime`,
    `toDataUrl`); reused by every route that accepts uploads.
  - `src/lib/ffmpeg.ts` — shells out to **ffmpeg** to stitch template clips
    together (scale/pad to a common size + overlay one base audio track) and to
    extract thumbnails. ffmpeg is installed in the backend Docker image.
  - `src/lib/templateRender.ts` + `src/lib/runRender.ts` — synchronous template
    render pipeline. `renderBlockClip()` generates one block's clip (the block's
    chosen avatar slot is passed as the OpenRouter reference image and, when
    `faceSwapStart`/`faceSwapEnd` are set, is face-swapped onto the block's base
    start/end frame); `renderTemplate()` runs it for every block, stitches the clips
    over the audio and makes a thumbnail. `renderBlockClip()` is also reused by the
    per-block "bake" route. Blocks reference avatars by slot — never per-block uploads.
    On **export** the cover thumbnail is **AI-generated from the block prompts**
    (`generateAiThumbnail` → OpenRouter image model `OPENROUTER_THUMBNAIL_MODEL`),
    falling back to an ffmpeg frame grab on error; user renders still use a frame grab.
  - `src/lib/templateSerialize.ts` — attaches public URLs to template/block/render rows.
  - `src/middleware/requireAdmin.ts` — gates admin routes; lazily promotes emails
    in `ADMIN_EMAILS` to the `admin` role. `resolveIsAdmin` is reused by `/api/me`.
  - `src/routes/{videos,images,faceswaps}.ts` — CRUD + generation per media type.
  - `src/routes/avatars.ts` — user avatars (1-2 photos; first photo = face source).
  - `src/routes/templates.ts` — user-facing templates (`/api/templates`) + their
    renders (`/api/template-renders`).
  - `src/routes/adminTemplates.ts` — admin CRUD for templates + blocks, plus
    `/blocks/:id/bake` (generate one block's preview clip) and `/export` (render +
    publish). `/api/admin/templates`, admin-only.
  - `src/routes/me.ts` — `/api/me` → `{ id, email, isAdmin }`.
  - `src/routes/models.ts` — `/api/models[/video]` (video) and `/api/models/image`.
- `infra/facefusion` — Dockerfile + `server.py`: a tiny FastAPI wrapper around
  FaceFusion's `headless-run` CLI (3.6.1 ships no REST API). Exposes
  `POST /swap` (multipart source+target → swapped image) + `GET /health`.
  `entrypoint.sh` pre-downloads models (`force-download --download-scope lite`) on
  first boot into the `facefusion_data` volume (`/facefusion/.assets`), gated by a
  marker file so restarts are instant.
- `packages/db` — Prisma schema (`prisma/schema.prisma`) + client (`@repo/db`).
  Models: `Video`, `Image`, `FaceSwap` (shared `GenerationStatus` enum), plus the
  templates feature: `Avatar`, `Template`, `TemplateBlock`, `TemplateRender`, and a
  `role` field on `User` (`"user"`/`"admin"`). Reused by the backend; never
  duplicate Prisma logic elsewhere.

## Conventions

- Package manager is **bun**. Use `bun install`, `bun run <script>`.
- Backend imports use `.js` extensions (NodeNext); bun resolves them to `.ts` at runtime.
- Frontend uses the `@/` alias for `src/`.
- Keep all Prisma access in the `@repo/db` package.
- All user-uploaded inputs and generated outputs (videos, images, face swaps) must
  be stored in the object store (MinIO) — see `src/lib/storage.ts`. Object keys are
  persisted on the `Video`/`Image`/`FaceSwap` models; the bucket is anonymous-read,
  so the API returns permanent public URLs (`getPublicUrl`) built from
  `MINIO_FRONTEND_ENDPOINT`.
- Generation is **synchronous**: routes create a DB row (`IN_PROGRESS`), call the
  provider, store the result and mark `COMPLETED`/`FAILED`. Mirror this pattern and
  reuse `src/lib/uploads.ts` when adding new media types. Template renders follow
  the same pattern (`TemplateRender` row → render → store), but a render generates
  *every* block sequentially, so it can take many minutes.
- **Template avatars**: the admin assigns 1-2 of their own avatars to a template at
  creation (`Template.avatarIds`, which sets `avatarSlots`). Blocks pick one of
  those slots (`TemplateBlock.avatarSlot`) for both the reference image and the
  face-swap source — admins never re-upload per-block reference images. Admin
  `/export` renders with the template's own avatars; users pick their own avatars
  (same slot count) when they render via `POST /api/templates/:id/render`.
- **Durations are per-model** (spec 09): OpenRouter exposes `supported_durations`
  per video model; the UI offers a fixed set (`ALLOWED_DURATIONS` in `lib/api.ts`)
  and filters the model picker to models that support the chosen duration. A
  block's `duration` is its generated length and equals its timeline footprint
  (`endSec = startSec + duration`, enforced server-side).
- **Multi-track timeline + overlaps**: blocks have a `track`; the timeline stacks
  tracks (higher = on top). Clips can be dragged left/right and between tracks, but
  a drag that would overlap another clip **on the same track** is rejected (it turns
  red and snaps back — `collides()` in `Timeline.tsx`); cross-track overlaps are
  allowed. Rendering (`buildTimelineSegments` in `templateRender.ts`) slices the
  timeline at block edges, picks the topmost covering block per slice (trimming via
  `ffmpeg.ts`'s `stitchTimeline`), and fills uncovered gaps with black.
- **Crop (trim)**: a block keeps its full generated clip (`duration`) but only uses
  `[cropStart, cropEnd)` — drag a clip's edges to crop/expand (Premiere-style). The
  footprint is `endSec - startSec = (cropEnd ?? duration) - cropStart` (enforced
  server-side); `buildTimelineSegments` offsets the clip in-point by `cropStart`.
- **Copy/paste with linked references**: blocks sharing a `linkGroupId` share
  generation content (prompt, model, frames, baked `videoKey`, …). The copy endpoint
  (`POST …/blocks/:id/copy`) clones content into a new linked block; editing or
  baking any member propagates content to the rest (PATCH/bake in `adminTemplates.ts`).
  Position + crop stay per-block. Frontend: ⌘/Ctrl+C / +V or the Copy/Paste buttons.
- **Admins** are determined by `role == "admin"` on `User`, seeded from the
  `ADMIN_EMAILS` allowlist. Gate admin-only routes with `requireAdmin`; the
  frontend reads `/api/me`.
- Local host-based template rendering needs **ffmpeg on PATH** (it's installed in
  the backend Docker image, but install it locally — e.g. `brew install ffmpeg` —
  to run renders outside Docker).

## Common commands

```sh
bun install                 # install all workspace deps
bun run db:generate         # generate the Prisma client (run after schema changes)
bun run db:migrate          # apply Prisma migrations
bun run dev                 # run all apps with hot reload (turbo)
bun run build               # build everything
bun run check-types         # type-check the whole monorepo
bun run lint                # lint
```

Per app:

```sh
bun run --cwd apps/backend dev
bun run --cwd apps/frontend dev
```

## Local infrastructure

```sh
bun run infra:up            # Postgres + MinIO only (for host-based dev)
bun run docker:up           # full stack in Docker
bun run docker:facefusion   # build + start the FaceFusion swap service (~5GB, needed for face swap)
bun run docker:reset        # stop + wipe volumes (DESTRUCTIVE)
```

## Verification

Before considering a change complete:

1. `bun run check-types` (must pass).
2. `bun run build` (frontend `vite build` + backend `tsc --noEmit`).
3. For backend logic, smoke-test by booting `bun run --cwd apps/backend start`
   and hitting `http://localhost:4000/health`.

## Environment

Secrets (`OPENROUTER_API_KEY`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`,
`BETTER_AUTH_SECRET`) are configured via `.env`. See the `.env.example` files at
the repo root and in each app/package. Google sign-in is only enabled when the
Google client id/secret are present. `FACEFUSION_URL` points the backend at the
FaceFusion swap service (`http://localhost:7865` on host, `http://facefusion:7865`
in Docker).
