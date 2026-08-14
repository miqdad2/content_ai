# cre8.ai — Current Architecture Audit (UNIT 00)

## 0. Document purpose and status

This document is the output of **UNIT 00 — Repository & Product Audit** defined in `spec/CRE8_AI_LOOP_ENGINEERING.md`. It is a factual map of the repository **as it exists today**, produced before any structural cre8.ai redesign work.

- No application code was modified to produce this document.
- Everything under **"CURRENT IMPLEMENTED STATE"** describes code that exists and runs today, with exact file paths for citation.
- Everything under **"TARGET CRE8.AI STATE"** describes the direction defined in `spec/CRE8_AI_SPEC.md` and `spec/CRE8_AI_LOOP_ENGINEERING.md`. None of it exists in code yet unless explicitly noted.
- Per `CLAUDE.md`: if this document and the current codebase ever disagree, **the current codebase wins for current-state facts.** Re-run/refresh this audit rather than trusting a stale copy.

Audit baseline:

- Branch: `main`
- Commit at audit start: `979ba16` — "ui adjusted to meet client expectation"
- Pre-existing working-tree state at audit start (not created by this audit, left untouched): `AGENTS.md` and `CLAUDE.md` modified; 19 legacy numbered spec files (`spec/00-*.md` … `spec/18-*.md`) deleted; `spec/CRE8_AI_SPEC.md` and `spec/CRE8_AI_LOOP_ENGINEERING.md` untracked (new).

---

# PART A — CURRENT IMPLEMENTED STATE

## A1. Frontend routes (`apps/frontend/src/App.tsx`)

The router is a flat `react-router-dom` `<Routes>` tree declared directly in `apps/frontend/src/App.tsx` (routes at lines 27–42). `Navbar`, `PromoBanner`, and `Footer` are rendered outside `<Routes>` so they appear on every page.

**There is no route-level auth guard component** (no `ProtectedRoute`/`RequireAuth`). Every "authenticated" page independently guards itself in-component with the same repeated pattern: `if (isPending) return null; if (!session?.user) return <SignedOut />;` (`apps/frontend/src/components/SignedOut.tsx`). This is a structural inconsistency worth flagging, not a security gap — but it means route protection is duplicated ~8 times rather than centralized.

| Path | Component | File | Classification | Guard |
|---|---|---|---|---|
| `/` | `LandingPage` | `apps/frontend/src/pages/LandingPage.tsx` | Public marketing | None (CTAs adapt to session state) |
| `/video` | `VideoPage` | `apps/frontend/src/pages/VideoPage.tsx` | Authenticated tool | In-component `SignedOut` check |
| `/image` | `ImagePage` | `apps/frontend/src/pages/ImagePage.tsx` | Authenticated tool | In-component `SignedOut` check |
| `/face-swap` | `FaceSwapPage` | `apps/frontend/src/pages/FaceSwapPage.tsx` | Authenticated tool — **not linked from Navbar or Footer**, reachable only by direct URL | In-component `SignedOut` check |
| `/user/templates` | `TemplatesPage` | `apps/frontend/src/pages/TemplatesPage.tsx` | Authenticated tool | In-component `SignedOut` check |
| `/generation/:id` | `GenerationPage` | `apps/frontend/src/pages/GenerationPage.tsx` | Authenticated — template-render progress/result detail | In-component `SignedOut` check |
| `/user/avatar` | `AvatarPage` | `apps/frontend/src/pages/AvatarPage.tsx` | Authenticated tool | In-component `SignedOut` check |
| `/billing` | `BillingPage` | `apps/frontend/src/pages/BillingPage.tsx` | Authenticated — credits/billing | In-component `SignedOut` check |
| `/admin/template/create` | `AdminTemplateCreatePage` | `apps/frontend/src/pages/AdminTemplateCreatePage.tsx` | Admin only | `SignedOut` check, then soft UI check on `me?.isAdmin` (real enforcement is server-side, see A5) |
| `/login` | `LoginPage` | `apps/frontend/src/pages/LoginPage.tsx` | Auth page | Inverse guard: redirects to `/` if already signed in (the only redirect in the app) |
| `/privacy` | `PrivacyPage` | `apps/frontend/src/pages/PrivacyPage.tsx` | Public legal | None |
| `/refund` | `RefundPage` | `apps/frontend/src/pages/RefundPage.tsx` | Public legal | None |
| `/terms` | `TermsPage` | `apps/frontend/src/pages/TermsPage.tsx` | Public legal | None |

No 404/catch-all route exists (unmatched URLs render just the persistent Navbar/Footer/PromoBanner shell with an empty body).

## A2. Public vs. authenticated pages

**Public:** `/`, `/privacy`, `/refund`, `/terms`, `/login`.

**Authenticated:** `/video`, `/image`, `/face-swap`, `/user/templates`, `/user/avatar`, `/billing`, `/generation/:id`.

**Admin:** `/admin/template/create` (auth + `isAdmin`, with a superadmin variant described in A5).

## A3. Navigation structure

**`apps/frontend/src/components/Navbar.tsx`** — a flat, static `NAV_LINKS` array (lines 18–24): Explore (`/`), Video, Image, Templates (badged "New"), Avatar. These render identically for logged-in and logged-out users (auth is enforced per-page, not by hiding nav). If `useMe().isAdmin` is true, a 6th "Admin" link (`/admin/template/create`) is appended. `/face-swap` and `/login` are **absent from the navbar** — Face Swap is a fully functional but undiscoverable route; Login/Sign up buttons open `AuthModal` (`apps/frontend/src/components/AuthModal.tsx`) rather than navigating to `/login`.

Auth cluster (right side of navbar): logged-out shows Pricing (→ `/billing`), Login, Sign up; logged-in shows a credits pill (→ `/billing`), user avatar/name, sign-out button.

**`apps/frontend/src/components/Footer.tsx`** — `PRODUCT_LINKS`: Video, Image, Templates, Pricing (→ `/billing`). Same omission of Face Swap and Avatar. `LEGAL_LINKS`: Privacy, Refund & Cancellation, Terms.

**Legacy top-level tool navigation (Video / Image / Templates / Avatar):** this *is* the current primary navigation — there is no dropdown or sidebar wrapper; the four tools sit as flat peer links in `Navbar.tsx` alongside "Explore". This is exactly the structure `spec/CRE8_AI_SPEC.md` §22 says "must no longer define the entire authenticated product."

Within each tool page, secondary navigation is a **locally-owned tab bar**, reimplemented per page rather than shared: `VideoPage`/`ImagePage` (Create/History-style intro-vs-library tabs), `FaceSwapPage`/`TemplatesPage` (shared `Tabs` UI primitive, Create/History), `AvatarPage` (no tabs, single panel).

## A4. Demo Mode

Controlled entirely by the frontend build-time flag `VITE_DEMO_MODE` (`apps/frontend/.env`, typed in `apps/frontend/src/vite-env.d.ts`), checked via `isDemoMode()` in `apps/frontend/src/lib/demoMode.ts`. **The backend has no awareness of Demo Mode at all** — it is a pure frontend sandbox, per that file's own header comment, built "to show the approved UI to a client via a Vercel preview with no backend reachable."

- **Isolation mechanism:** `auth-client.ts` swaps the real better-auth client for an in-memory/localStorage-backed demo session store; `api.ts` wraps every exported API function as `isDemoMode() ? demoX() : realFetch()`, so in demo mode zero network calls to the backend occur for app data.
- **Login credentials:** `demo@content.ai` / `demo1234` (constants in `demoMode.ts`), surfaced with a "Fill in" button in `AuthForm.tsx`.
- **Mock data:** seeded videos/images/face swaps/avatars/templates/render, a fixed credit ledger (nets to 4850 credits), static model lists, sample media drawn only from `public/showcase/*`.
- **Restrictions, enforced three separate ways:** `demoFetchCreditPacks()` always returns `razorpayConfigured: false`; `demoStartCheckout`/`demoVerifyPayment` throw a "payments disabled" error; `openRazorpayCheckout()` in `apps/frontend/src/lib/razorpay.ts` independently refuses in demo mode before ever loading the Razorpay script. `demoFetchMe()` hardcodes `isAdmin: false` — `/admin/template/create` is still URL-reachable in demo mode but blocked by the same client-side `isAdmin` gate a real non-admin user would hit.
- Face swap in demo mode doesn't call FaceFusion — it reuses the uploaded target image as a fake output.

## A5. Auth flow

**Frontend:** `apps/frontend/src/lib/auth-client.ts` wraps `createAuthClient({ baseURL: \`${VITE_API_URL}/api/auth\` })` from `better-auth/react`, exporting either the real client or the demo stand-in depending on `isDemoMode()`. `apps/frontend/src/components/AuthForm.tsx` (used by both `AuthModal.tsx` and `LoginPage.tsx`) handles sign-in and sign-up in one component, offering Google OAuth (`signIn.social`) and email/password (`signIn.email`/`signUp.email`).

**Backend:** `apps/backend/src/auth.ts` configures `betterAuth()` with a Prisma adapter (`prismaAdapter(prisma, {provider: "postgresql"})`), email/password enabled (no email verification wired up), Google as the sole conditional social provider, and cross-site cookie handling (`SameSite=None; Secure` when `BACKEND_URL` is `https://`). Mounted in `apps/backend/src/index.ts` as `app.all("/api/auth/*", toNodeHandler(auth))`, **before** `express.json()`.

**Session flow:** better-auth sets an HTTP-only cookie on sign-in; every frontend fetch uses `credentials: "include"`; backend `requireAuth` middleware (`apps/backend/src/middleware/requireAuth.ts`) calls `auth.api.getSession()` per request, setting `req.userId`/`req.userEmail` or returning 401. CORS is configured with `credentials: true` against `FRONTEND_URL`.

## A6. useMe / credits flow

`apps/frontend/src/lib/useMe.ts` — `useMe()` calls `fetchMe()` whenever `session.user` changes. A separate `window` CustomEvent bus (`credits:refresh`) allows other components to trigger a **background** refresh that doesn't toggle the loading state (deliberately, so it doesn't unmount admin editor UI mid-interaction).

`GET /api/me` (`apps/backend/src/routes/me.ts`) returns `{ id, email, isAdmin, isSuperAdmin, credits }`. Note: the frontend `Me` type in `api.ts` only declares `{id, email, isAdmin, credits}` — `isSuperAdmin` is sent by the backend but not yet modeled on the frontend (minor drift, no superadmin-specific UI exists yet).

`GET /api/credits` returns balance + last 50 ledger transactions. Credit logic lives in `apps/backend/src/lib/credits.ts`:
- `spendCredits()` — atomic conditional `updateMany` (`credits: {gte: amount}`) so concurrent spends can't go negative; throws `InsufficientCreditsError` otherwise.
- `refundCredits()` — **idempotent**, computes outstanding-owed by summing prior SPEND/REFUND rows for the same `referenceType`/`referenceId`, so retried failure callbacks can't double-refund.
- Fixed per-action costs from env: `CREDITS_PER_VIDEO` (60), `CREDITS_PER_IMAGE` (6), `CREDITS_PER_TEMPLATE_RENDER` (1000).
- Common pattern used by every generation route: pre-check balance (402 if insufficient) → create DB row → charge → call provider → refund + mark FAILED on any downstream failure.

## A7. Billing / Razorpay flow

Files: `apps/frontend/src/pages/BillingPage.tsx`, `apps/frontend/src/lib/razorpay.ts`, `apps/backend/src/routes/credits.ts`, `apps/backend/src/lib/razorpay.ts`, `apps/backend/src/lib/credits.ts`, `Payment` model in `packages/db/prisma/schema.prisma`.

Flow: `BillingPage` loads packs (`GET /api/credits/packs`, disabled if `razorpayConfigured` is false) → user clicks Buy → `POST /api/credits/checkout` creates a Razorpay order + `Payment` row (`status: CREATED`) → frontend opens the Razorpay hosted checkout widget → on success, `POST /api/credits/verify` HMAC-verifies the signature (constant-time compare) and calls `fulfillPayment()`, which atomically claims the order (`updateMany` guard against double-fulfillment) and grants base + bonus credits as separate ledger rows. A **webhook backstop** (`POST /api/credits/webhook`, mounted with `express.raw()` before `express.json()` specifically so the raw bytes can be signature-verified) independently calls `fulfillPayment()` on `payment.captured`, covering the case where the browser never returns from checkout. Three fixed packs: Starter (₹499/500cr), Pro (₹1999/2000cr+200 bonus), Studio (₹4999/5000cr+1000 bonus).

## A8. Video generation flow

`apps/frontend/src/pages/VideoPage.tsx` (`TextToVideoForm` + `MyVideos` history) → `POST /api/videos` (`apps/backend/src/routes/videos.ts`). Standard lifecycle: cost check (`CREDITS_PER_VIDEO`, default 60) → upload input frames/references to MinIO → create `Video` row `IN_PROGRESS` → `spendCredits()` → `generateVideo()` in `apps/backend/src/lib/openrouter.ts` (async job: submit → poll every 5s up to 10 min → download result) → upload output to MinIO → mark `COMPLETED`; any failure refunds + marks `FAILED`. Supports image-to-video (start/end frame), up to 8 reference frames, and optional audio generation. Models are fetched live from OpenRouter (`GET /videos/models`), not hardcoded.

## A9. Image generation flow

`apps/frontend/src/pages/ImagePage.tsx` (`TextToImageForm` + `MyImages`) → `POST /api/images` (`apps/backend/src/routes/images.ts`). Same lifecycle shape as video, cost = `CREDITS_PER_IMAGE` (default 6). `generateImage()` in `openrouter.ts` — synchronous POST `/images`, returns base64 or a URL to download. Models fetched live from `GET /images/models`.

## A10. Face-swap flow

`apps/frontend/src/pages/FaceSwapPage.tsx` (`FaceSwapForm` + `MyFaceSwaps`) → `POST /api/faceswaps` (`apps/backend/src/routes/faceswaps.ts`). **Deviates from the common pattern: no credit charge at all**, and always uses FaceFusion directly (`apps/backend/src/lib/facefusion.ts`), ignoring the `SWAP_PROVIDER` abstraction. `apps/backend/src/lib/facefusion.ts: faceSwap()` POSTs multipart to `${FACEFUSION_URL}/swap` with a 15-min timeout.

The `SWAP_PROVIDER` abstraction (`"facefusion" | "flux"`, `apps/backend/src/env.ts`) is used only inside the **template render** pipeline (`resolveSwapEngine()` in `apps/backend/src/lib/templateRender.ts`), where a per-block `swapModel` field can force either engine or fall back to the server default. `flux` dispatches to `swapFaceWithImageModel()` (an OpenRouter diffusion-edit call in `openrouter.ts`) instead of the local FaceFusion service.

`infra/facefusion/server.py` is a FastAPI wrapper around the FaceFusion 3.6.1 CLI (which has no native REST API) — `POST /swap`, `GET /health`, CPU-only, tuned for identity preservation (`hyperswap_1a_256` swapper, low-blend GFPGAN enhancer). Started only via the opt-in `facefusion` docker-compose profile (~5GB image).

## A11. Avatar flow

`apps/frontend/src/pages/AvatarPage.tsx` (`AvatarForm` + `MyAvatars`) → `apps/backend/src/routes/avatars.ts`. **No AI generation step and no credit charge** — an avatar is just 1–2 persisted source photos uploaded to MinIO; the row is created directly as `COMPLETED` (the only model whose schema default is `COMPLETED` rather than `PENDING`). The avatar's `faceKey` photo is later reused both as the face-swap source and as an OpenRouter reference image to keep a person visually consistent across generated clips.

## A12. Templates flow (end-user)

`apps/frontend/src/pages/TemplatesPage.tsx` — Browse tab (`TemplateGallery`, `GET /api/templates`, published-only) and My Renders tab (`MyTemplateRenders`, `GET /api/template-renders`). Selecting a template opens `TemplateRenderDialog`, which lets the user assign their own avatars to 1–2 slots and submits `POST /api/templates/:id/render` (`apps/backend/src/routes/templates.ts`). This route charges credits (`CREDITS_PER_TEMPLATE_RENDER`, default 1000), creates a `TemplateRender` row plus one `TemplateRenderBlock` per template block (all `QUEUED`), and **fires the render in the background without awaiting it** — the HTTP response returns immediately so the frontend can navigate to the live progress page at `/generation/:id`. `POST /api/template-renders/:id/retry` resumes a `FAILED` render in place, reusing already-completed blocks and only re-charging if the original attempt was refunded.

## A13. Generation history flow

There is **no unified history page** — history is per-media-type, embedded as a tab inside each tool's own page (`MyVideos`, `MyImages`, `MyFaceSwaps`, `MyAvatars`, `MyTemplateRenders`). The one dedicated detail/progress page is `apps/frontend/src/pages/GenerationPage.tsx` (`/generation/:id`), exclusively for `TemplateRender`s (videos/images/face-swaps complete synchronously within their original request, so they don't need a polling progress view). It polls `GET /api/template-renders/:id` every 2.5s and renders a per-block phase timeline (`QUEUED → FACE_SWAP → VIDEO_GENERATION/RETRYING → COMPLETED/REUSED/FELL_BACK/FAILED`).

## A14. Admin template editor

`apps/frontend/src/pages/AdminTemplateCreatePage.tsx` (`/admin/template/create`) is the single source of truth for editor state (`blocks`, `audioClips`, selection, clipboard) — `Timeline` and the inspector panels are presentational/interactive children driven by props and callbacks, no state library. Two views: template picker/creation (`TemplateSetupForm`) if nothing is open, or the full editor once a template is loaded.

Backed by `apps/backend/src/routes/adminTemplates.ts`, mounted under `requireAdmin`, all routes scoped via `templateScope()`: **superadmins see and can edit every admin's templates; regular admins see only their own** (see A5/A19 for the superadmin mechanism). Full endpoint inventory: template CRUD, block CRUD + copy + bake + swap-preview + frame-capture, audio-clip CRUD, and export/publish.

## A15. Timeline architecture and high-risk files

Per `AGENTS.md` §11–13, this is explicitly flagged as high-risk. Files under `apps/frontend/src/components/timeline/`:

| File | Lines | Responsibility |
|---|---|---|
| `Timeline.tsx` | ~1002 | Multi-track canvas: video/audio lanes, ruler, program monitor, drag/crop/create pointer-event state machine, rAF playback clock, markers, imperative capture API |
| `BlockInspector.tsx` | ~715 | Right-rail inspector for a selected video block: prompt/model/duration/track/resolution, avatar-slot + face-swap toggles, frame upload/capture, bake/re-bake, save/delete; separate simplified branch for uploaded (non-AI) blocks |
| `AudioClipInspector.tsx` | ~150 | Right-rail inspector for a selected audio clip |
| `TemplateSetupForm.tsx` | ~163 | Left-rail "create new template" form |

Key behaviors and where they live:
- **Multi-track lanes:** parallel but separate systems for video vs. audio (separate refs, collision functions, track mappers) in `Timeline.tsx`.
- **Drag / collision:** a single `DragState` union drives move/crop-l/crop-r/create; same-track collisions are visually flagged live during drag but only actually **rejected on drop** (reverted to original position if still colliding) — cross-track overlap is always allowed by design (collision checks are scoped to `b.track === track`).
- **Crop/trim:** frontend computes the crop window live during drag; backend `clampCrop()` in `adminTemplates.ts` is the authoritative clamp (`MIN_CLIP = 1s`), re-applied on every block/audio patch including linked siblings.
- **Auto-length:** `totalSec = Math.max(furthest block/audio end, 10)` — no fixed timeline duration, mirrored on the render side in `templateRender.ts`.
- **`linkGroupId`:** assigned lazily on first copy (`adminTemplates.ts` copy endpoint); shared "content" fields (prompt, model, crop, images, etc.) propagate to all siblings on edit/bake/swap-generate/frame-capture, but position/crop footprint stay per-instance. Render-time dedup reuses one OpenRouter call per `linkGroupId:avatarSlot` — **except** lip-synced blocks, explicitly excluded from that cache because their audio window differs per position.
- **Copy/paste:** Cmd/Ctrl+C/V and a right-click context menu, both routed through the same backend copy endpoint (client-side "copy" just remembers an id; the clone happens server-side).
- **Bake:** generates/regenerates a single block's preview clip without a full export; reuses cached face-swap previews (`useSwapCache: true`) so re-baking doesn't re-charge a swap. Rejected for uploaded (non-AI) blocks.
- **Uploaded-video blocks:** bypass AI generation entirely at every layer (timeline preview prefers `sourceVideoUrl`; render pipeline checks `sourceVideoKey` first, before even the baked-clip check, and reuses it unconditionally — even on `forceRegenerate: true` user renders).
- **Program monitor:** driven by a virtual rAF clock (not any single `<video>` element's native clock), because multiple `<audio>` elements must stay in sync to it; the preview `<video>` is keyed on its clip URL so a re-bake forces a reload instead of showing a stale buffered source.
- **Audio sync:** each audio clip gets a hidden `<audio>` element; a effect seeks/plays/pauses each one in step with the shared playhead, approximating server-side mixing in-browser.
- **Export/render:** `POST /:id/export` reuses already-baked/uploaded clips as-is (no `forceRegenerate`) and flips `template.published = true` on success — export doubles as publish. User-facing renders (`templates.ts`) instead pass `forceRegenerate: true` (fresh avatar swap) but uploaded blocks still always bypass regardless.

No literal "bug"/TODO/FIXME markers were found in this area, but several comments read as hardening from past incidents: refs-based drag-listener handling ("so a re-render during a drag never detaches the window listeners"), monitor video re-keying to avoid stale previews, explicit non-double-charging notes around swap-cache reuse, and a serialized DB-write chain in `runRender.ts` to prevent out-of-order progress writes leaving a stale phase.

## A16. API client structure

`apps/frontend/src/lib/api.ts` — fetch-based (no axios), four thin helpers (`get`, `post`, `postJson`, `patch`, `del`), all with `credentials: "include"` for cookie-based session auth. Base URL: `VITE_API_URL` (build-time). Error handling centralizes in one `handle()` function that normalizes backend error shapes (string, zod field-error object, or fallback `Request failed (status)`) into a thrown `Error`. Types are **hand-written and manually kept in sync** with backend responses — no codegen (no OpenAPI/tRPC/zod-to-ts). Every exported function is wrapped `isDemoMode() ? demoX() : realCall()`.

## A17. Backend route map

Mounting order in `apps/backend/src/index.ts`: CORS → `/api/auth/*` (before JSON parsing) → `/api/credits/webhook` (raw body, before JSON parsing) → `express.json()` → all other routers → `uploadErrorHandler` (after routers). On boot: `ensureBucket()` then `failOrphanedRenders()` (marks any render stuck `IN_PROGRESS` from a prior process as `FAILED` — renders run in-process with no resumable queue) then `listen()`.

| Router file | Mount prefix | Auth |
|---|---|---|
| `videos.ts` | `/api/videos` | requireAuth |
| `images.ts` | `/api/images` | requireAuth |
| `faceswaps.ts` | `/api/faceswaps` | requireAuth |
| `avatars.ts` | `/api/avatars` | requireAuth |
| `models.ts` | `/api/models` | requireAuth |
| `me.ts` | `/api/me` | requireAuth |
| `templates.ts` (`templatesRouter`) | `/api/templates` | requireAuth |
| `templates.ts` (`templateRendersRouter`) | `/api/template-renders` | requireAuth |
| `adminTemplates.ts` | `/api/admin/templates` | requireAdmin |
| `credits.ts` | `/api/credits` | requireAuth (webhook route unauthenticated, signature-verified instead) |

Full per-endpoint detail (verbs, params, purpose) was gathered during the audit and is preserved in the underlying route files themselves — this table gives the mount map; consult each route file directly for its exact endpoint list when planning a migration unit that touches it.

## A18. Prisma models and enums

`packages/db/prisma/schema.prisma`, datasource `postgresql`.

**Enums:** `GenerationStatus` (PENDING/IN_PROGRESS/COMPLETED/FAILED), `RenderBlockPhase` (QUEUED/FACE_SWAP/VIDEO_GENERATION/RETRYING/STITCHING/COMPLETED/REUSED/FELL_BACK/FAILED), `CreditTxnType` (PURCHASE/SPEND/REFUND/BONUS/ADJUSTMENT), `PaymentStatus` (CREATED/PAID/FAILED).

**Auth models (better-auth contract):** `User` (id, name, email, role, credits, …), `Session`, `Account`, `Verification`.

**Media-generation models:** `Video`, `Image`, `FaceSwap`, `Avatar` — all `userId → User`, MinIO key fields, `status: GenerationStatus`.

**Template-authoring models:** `Template` (creatorId, avatarSlots, avatarIds, published), `TemplateBlock` (timeline position, generation params, crop window, `linkGroupId`, face-swap config), `TemplateAudioClip`, `TemplateRender` (parent render row), `TemplateRenderBlock` (per-block resumable progress).

**Credits/billing models:** `CreditTransaction`, `Payment`.

**Critical finding for migration planning:** there is **no Brand, Workspace, Organization, or multi-tenant concept anywhere in this schema**. Every model hangs directly off a flat `User`. This confirms `spec/CRE8_AI_SPEC.md` §35's framing — Brand Workspace / Brand Memory models are entirely new additions, not a refactor of anything that exists.

## A19. Admin and permissions (including superadmin)

Admin status is `User.role === "admin"` (default `"user"`), resolved by `resolveIsAdmin()` in `apps/backend/src/middleware/requireAdmin.ts`: checks the DB role first, then **lazily promotes** any user whose email is in the `ADMIN_EMAILS` env allowlist (writes `role: "admin"` on that request). `requireAdmin` middleware protects every route in `adminTemplates.ts`.

**Superadmin** (introduced in commit `10628a3`, "Add superadmin role that can see/manage all admins' templates"): a second env allowlist, `SUPERADMIN_EMAILS`, checked purely per-request via `isSuperAdminEmail()` — there is no persisted `superadmin` value in `User.role`. Superadmins are always treated as admins. `requireAdmin` sets `req.isSuperAdmin`, threaded through `AuthedRequest`. In `adminTemplates.ts`, `templateScope()` is the key mechanism: superadmins query with no `creatorId` filter (see all templates), regular admins are scoped to `creatorId: req.userId`. Bake/swap/export routes deliberately resolve avatars against the **template's creator**, not the requester, so a superadmin editing another admin's template correctly uses that admin's assigned avatars. `/api/me` returns `isSuperAdmin`, but the frontend `Me` type doesn't model it yet — no superadmin-specific UI exists.

Frontend admin gating (`AdminTemplateCreatePage.tsx`'s `me?.isAdmin` check) is UI-only and cosmetic; real enforcement is the backend `requireAdmin` middleware.

## A20. MinIO/storage architecture

`apps/backend/src/lib/storage.ts` — single MinIO/S3-compatible bucket (`MINIO_BUCKET`, default `video-arena`), prefix-namespaced object keys (`avatars/`, `inputs/`, `images/`, `videos/`, `faceswaps/`, `templates/…`), no per-tenant bucket separation. `ensureBucket()` applies a public-read bucket policy at boot. `uploadBuffer()` generates `${prefix}/${uuid}${ext}` keys with per-object `x-amz-acl: public-read` (needed for hosted S3-compatible stores that can't apply a bucket-wide policy with a scoped key). `getPublicUrl()` builds **permanent, unsigned** public URLs — there is no expiring/signed-URL mechanism anywhere. `MINIO_FRONTEND_ENDPOINT` (public-facing host) can differ from `MINIO_ENDPOINT` (internal SDK endpoint), letting the internal Docker network and the public CDN/host diverge.

`apps/backend/src/lib/uploads.ts` — multer, all in-memory (`memoryStorage()`, no disk writes), tiered size limits (100MB general, 200MB audio, 500MB video), with a shared error handler mounted after all routers.

## A21. OpenRouter integrations

`apps/backend/src/lib/openrouter.ts` is the single client for all OpenRouter calls (`OPENROUTER_BASE_URL`, `OPENROUTER_API_KEY`). No models are hardcoded — the full catalog (`listVideoModels`, `listImageModels`, derived `listSwapModels`) is fetched live from OpenRouter at request time and normalized into one shared shape so a single model-picker UI serves video/image/swap.

- `generateImage()` — synchronous `POST /images`, returns base64 or a downloadable URL.
- `generateVideo()` — async job flow: submit → poll every 5s up to 10 min → download.
- `swapFaceWithImageModel()` — thin wrapper over `generateImage()` with a hardcoded identity-transfer prompt (used only by the `flux` `SWAP_PROVIDER` path).
- `supportsAudioLipsync()` — currently a regex match on `seedance-2`; only that model family honors audio-reference lip-sync inputs.
- Thumbnail generation for template exports uses a primary model + configurable fallback chain (`OPENROUTER_THUMBNAIL_MODEL`/`OPENROUTER_THUMBNAIL_FALLBACK_MODELS`), falling back to an ffmpeg frame-grab if all AI attempts fail.

## A22. FaceFusion / Flux swap integration

Covered in A10. Summary: standalone `/api/faceswaps` always uses FaceFusion; the template-render pipeline's `SWAP_PROVIDER` abstraction can select `facefusion` (local CPU service, `infra/facefusion/server.py`) or `flux` (OpenRouter diffusion edit via `swapFaceWithImageModel()`) per-block, with a server-wide default and per-block override (`TemplateBlock.swapModel`).

## A23. FFmpeg / render pipeline

Four cooperating backend modules:

- **`apps/backend/src/lib/ffmpeg.ts`** — low-level utilities shelling out to `ffmpeg`/`ffprobe`: `stitchTimeline()` (the core compositor — scales/pads/normalizes each clip, concatenates via filter, mixes N audio parts with per-part trim/delay, encodes `libx264`/`yuv420p`/faststart), `mixAudioWindow()` (builds a windowed audio mix for lip-sync reference), `probeMediaDuration()`/`probeImageSize()`, `generateThumbnail()` (frame-grab fallback).
- **`apps/backend/src/lib/templateRender.ts`** — orchestration engine (`renderTemplate()`): bounded-concurrency block generation (`RENDER_BLOCK_CONCURRENCY`, default 3) with a strict reuse-priority order (uploaded clip → baked clip, unless `forceRegenerate` → resumed prior attempt → fresh generation with retry/backoff), `linkGroupId` dedup, fallback-to-baked-clip on persistent generation failure, `buildTimelineSegments()` (flattens overlapping multi-track blocks, highest track wins), and AI thumbnail generation with fallback chain.
- **`apps/backend/src/lib/runRender.ts`** — persistence wrapper (`runAndStoreRender()`): bridges in-memory progress callbacks to serialized DB writes (explicitly serialized so out-of-order async writes can't leave a block showing a stale phase), builds a `resume` map from prior `TemplateRenderBlock` rows for retries, uploads final video/thumbnail to MinIO, updates the parent `TemplateRender` row.
- **`apps/backend/src/lib/templateSerialize.ts`** — pure serialization: attaches public MinIO URLs to every stored key so the frontend never talks to MinIO directly.

## A24. Deployment / Vercel configuration

**No `vercel.json` exists anywhere in the repo.** Vercel is referenced only informally (a `.gitignore` entry, and comments noting `VITE_DEMO_MODE=true` exists to support "a frontend-only deployment (e.g. a Vercel client preview) with no backend reachable"). It is not part of the committed production pipeline.

**Actual production deployment is Docker + Kubernetes via GitHub Actions** (`.github/workflows/deploy.yml`): builds `apps/backend/Dockerfile` and `apps/frontend/Dockerfile` on push to `main`, pushes to Docker Hub as `100xdevs/video-arena-backend` / `100xdevs/video-arena-frontend`. **`VITE_API_URL` is baked in at Docker build time** (hardcoded in the workflow as `https://api.pixovid.com`), not runtime-configurable. Comments indicate a separate (not-in-this-repo) "production-ops" manifest set drives the actual k8s rollout. `docker-compose.yml` provides local/dev + self-hosted-prod orchestration (postgres, minio, backend, frontend, optional `facefusion` profile). `turbo.json` defines the monorepo build pipeline (`build` depends on `^build`, etc).

## A25. Environment variables

**Frontend (`VITE_*`, both safe to expose):**
- `VITE_API_URL` — backend origin, baked in at build time.
- `VITE_DEMO_MODE` — demo sandbox toggle.

**Backend (validated via zod in `apps/backend/src/env.ts`):** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `OPENROUTER_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` are **secrets**. Non-secret config includes `NODE_ENV`, `PORT`, `BACKEND_URL`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, `SUPERADMIN_EMAILS`, `OPENROUTER_BASE_URL`/`OPENROUTER_THUMBNAIL_MODEL`/`OPENROUTER_THUMBNAIL_FALLBACK_MODELS`/`OPENROUTER_SWAP_MODEL`, `SWAP_PROVIDER`, `FACEFUSION_URL`, `RENDER_BLOCK_CONCURRENCY`, `RENDER_VIDEO_MAX_ATTEMPTS`, `RAZORPAY_KEY_ID` (publishable), `CREDITS_PER_IMAGE`/`CREDITS_PER_VIDEO`/`CREDITS_PER_TEMPLATE_RENDER`, `USD_INR_RATE`, `MINIO_ENDPOINT`/`MINIO_FRONTEND_ENDPOINT`/`MINIO_PORT`/`MINIO_USE_SSL`/`MINIO_BUCKET`. None of the backend secrets are exposed through `VITE_*` — this invariant currently holds.

## A26. Legacy brand-name occurrences

Full classification (A = public-facing brand text, B = internal package identifier, C = deployment/storage/env identifier, D = historical comment/doc reference):

**Category A — public-facing, needs cre8.ai migration (UNIT 01 scope):**
- `apps/frontend/index.html` — meta description, OG title, `<title>` (lines 10, 12, 18)
- `apps/frontend/src/components/Logo.tsx:44` — the literal rendered wordmark `content` + `.ai`, used site-wide in navbar/footer/auth screens
- `apps/frontend/src/pages/BillingPage.tsx:66` — Razorpay checkout modal `name` field
- `apps/frontend/src/pages/LandingPage.tsx:369` — landing page copy
- `apps/frontend/src/pages/PrivacyPage.tsx`, `RefundPage.tsx`, `TermsPage.tsx` — legal copy body text and `CONTACT_EMAIL = "hello@content.ai"` (each file)
- `apps/frontend/src/components/AuthModal.tsx:42`, `AuthForm.tsx:88` — auth screen copy
- `apps/frontend/src/components/Footer.tsx:4,91` — `CONTACT_EMAIL` and site-wide copyright line
- `apps/frontend/src/lib/demoMode.ts:39,71` — `DEMO_EMAIL = "demo@content.ai"` and demo user display name `"Content.ai Demo"`

**Category B — internal package identifier (usually keep):**
- Root `package.json`/`package-lock.json`/`bun.lock` — workspace name `"video-arena"`

**Category C — deployment/storage identifier (do not rename blindly):**
- `docker-compose.yml`, `.env.example` (root and backend) — `MINIO_BUCKET` default `video-arena`, `POSTGRES_DB=video_arena`
- `apps/backend/src/env.ts` — `MINIO_BUCKET` zod default `"video-arena"` (active runtime default)
- `.github/workflows/deploy.yml` — Docker Hub image names `video-arena-backend`/`video-arena-frontend`, k8s deploy names, and **`FRONTEND_API_URL: https://api.pixovid.com`** (active build-time env var, legacy production domain)
- `apps/frontend/src/lib/demoMode.ts:70,91` — `id: "content-ai-demo-user"`, `STORAGE_KEY = "content.ai-demo-session"` (internal identifiers derived from the old brand, not literal string matches but will need updating alongside the brand text)

**Category D — historical comment/doc reference (update only if misleading):**
- `AGENTS.md`, `CLAUDE.md`, `spec/CRE8_AI_SPEC.md`, `spec/CRE8_AI_LOOP_ENGINEERING.md` — the "Legacy names" sections and framing paragraphs (these are the audit/spec docs themselves, intentionally referencing the legacy names)
- Various code comments: `apps/frontend/src/pages/LandingPage.tsx:10`, `index.css:6,21`, `GlassWorkspacePreview.tsx:7`, `apps/backend/src/env.ts:12`, `apps/backend/src/auth.ts:18`, `packages/db/prisma/schema.prisma:1` (`// Prisma schema for video-arena`)

No occurrences of "Pixovid" as a rendered UI string were found (only in comments/docs referencing the old production domain `api.pixovid.com`). No occurrences of "Video Arena" (with space) were found in application code — only the kebab-case `video-arena` package/deployment identifier. Confirmed zero matches for the concatenated tokens `videoarena` or `contentai`.

---

# PART B — TARGET CRE8.AI STATE (planned, not yet implemented)

Everything in this section describes the direction defined in `spec/CRE8_AI_SPEC.md` and `spec/CRE8_AI_LOOP_ENGINEERING.md`. **None of it exists in code today.** It is included here only so this document can serve as the single before/after reference for planning UNIT 01 onward.

- **Brand Workspace / Brand Memory** — planned data model and UI concept (spec §6–8). No `BrandWorkspace`/`BrandMemory`/`BrandAsset`/`BrandProduct`/`BrandCompetitor` models exist in `packages/db/prisma/schema.prisma` (confirmed in A18). Not to be implemented until a dedicated UNIT 13-equivalent designs it.
- **Mission Control** — planned authenticated home screen (spec §21). Does not exist; the current authenticated landing experience is just the flat Navbar tool list.
- **Marketing Departments** (CMO, Marketing Director, Head of Brand & Creative, Head of Content Marketing, Head of Social Media, Marketing Analytics Manager) — planned organizing structure (spec §9, CLAUDE.md departments list). None of these exist as UI or routes today. Existing AI Video/Image/Templates/Avatar are the functional seed for "Head of Brand & Creative" but are not yet repositioned under it.
- **New department tools** (Marketing Strategies, Trend Intelligence, Marketing Campaigns, Digital Marketing, AI Music, Logos, Presentations, Hashtags, Captions, Prompts, Voiceovers, Auto-Posting, Reports, Insights) — none exist. Every one of these must be classified REAL/DEMO/PLANNED per `AGENTS.md` §17 before any UI implies it's live; currently there is no UI for any of them, so no misclassification risk yet.
- **Proposed route architecture** (`/app/brands/:brandId/...`, `/app/departments/...`, spec §34) — does not exist. Current routes are the flat list in A1. Spec explicitly notes this is "a target architecture, not permission to rename all existing routes immediately."
- **cre8.ai visual identity** (black/navy/electric-blue/cyan, cinematic public pages) — not yet implemented. Current theme is the recently-shipped violet/glassmorphism "content.ai" rebrand (see commit `dfd8065`, "Rebrand to content.ai: glassmorphism redesign") — i.e. the codebase's most recent visual work moved *toward* a content.ai identity, which is itself now superseded by the cre8.ai direction. This is a real conflict worth flagging per CLAUDE.md's "if product direction and current technical behavior conflict, report it" rule: the current visual system was deliberately built and should be treated as a foundation to evolve, not code to silently discard.
- **cre8.ai brand name in UI** — not yet applied anywhere; see A26 for every current occurrence of the legacy `content.ai` brand text that a UNIT 01 brand-foundation pass would need to touch.

---

# PART C — Migration matrix

"Reuse as-is" = the underlying engine/logic needs no rework, only repositioning. "UI migration needed" = needs new presentation/navigation but not new backend contracts. "Backend migration needed" = needs new/changed API or data model. "High risk?" flags areas `AGENTS.md`/`CLAUDE.md` explicitly call out as requiring extra care.

| Area | Current implementation | Reuse as-is | UI migration needed | Backend migration needed | High risk? | Proposed cre8.ai destination |
|---|---|---|---|---|---|---|
| Video generation | `VideoPage.tsx` + `routes/videos.ts` + `openrouter.ts`, sync IN_PROGRESS→COMPLETED pattern | Yes | Yes (reposition under department workspace shell, per spec §23) | No | Yes (credits/generation invariants) | Head of Brand & Creative → AI Videos |
| Image generation | `ImagePage.tsx` + `routes/images.ts` | Yes | Yes | No | Yes (credits) | Head of Brand & Creative → AI Images |
| Templates (end-user) | `TemplatesPage.tsx` + `routes/templates.ts` + render pipeline | Yes | Yes | No | Yes (render pipeline, credits) | Head of Brand & Creative (templates as a video sub-flow) |
| Avatar | `AvatarPage.tsx` + `routes/avatars.ts` | Yes | Yes | No | No | Head of Social Media → AI Avatars |
| Face swap | `FaceSwapPage.tsx` + `routes/faceswaps.ts` + FaceFusion/flux | Yes | Yes (also: fix zero-discoverability — not in nav today) | No | Yes (provider abstraction, no credit charge today) | Utility inside AI Video/Avatar flows, or its own Brand & Creative tool |
| Admin template editor / timeline | `AdminTemplateCreatePage.tsx` + `components/timeline/*` + `routes/adminTemplates.ts` | Yes, do not refactor casually | No (admin-internal tool, not public-facing) | No | **Very high** (drag/crop/link-group/bake behavior) | Stays as internal admin tooling; not part of department UX |
| Credits | `lib/credits.ts`, atomic spend/idempotent refund | Yes | Minor (credits pill already works) | No | Yes (ledger invariants) | Shared across all departments unchanged |
| Billing / Razorpay | `BillingPage.tsx` + `routes/credits.ts` | Yes | Yes (visual redesign only, spec §18) | No | Yes (payment verification, webhook) | Global billing/pricing surface |
| Demo Mode | `lib/demoMode.ts`, frontend-only sandbox | Yes (mechanism) | Yes (rebrand demo content + extend fixtures for new department concepts) | No (stays frontend-only) | Yes (isolation invariants) | Must cover Brand Workspace/Mission Control fixtures eventually (UNIT 34) |
| Auth | better-auth + Prisma adapter, Google OAuth | Yes | Minor (rebrand copy only) | No | Yes (session/cookie contracts) | Unchanged; brand onboarding (spec §8) sits after login |
| Navbar | Flat tool-link list (`Navbar.tsx`) | No | **Full replacement** — becomes Mission Control global nav (spec §22) | No | No | Public shell nav (Home/Departments/Pricing/Login) + authenticated Mission Control nav |
| Landing page | `LandingPage.tsx`, hero + video showcase | Partial (existing video/showcase assets must be preserved per spec §14) | **Full redesign** (cinematic hero, orbital departments, Brand Memory section) | No | No | Public marketing site |
| Brand Memory | Does not exist | — | New | New (models + API) | New system | Core shared layer above all departments |
| Mission Control | Does not exist | — | New | Minimal (aggregates existing data) | New system | Authenticated home |
| Departments (CMO, Marketing Director, Content, Social, Analytics shells) | Do not exist | — | New | Mostly new (each tool needs its own contract) | New system | The department pages themselves |
| Strategy / Trend Intelligence | Does not exist | — | New | New | New system | CMO department |
| Campaigns / Digital Marketing | Does not exist | — | New | New | New system | Marketing Director department |
| Captions / Prompts | Does not exist | — | New | New | New system | Content Marketing department |
| Voiceovers / Auto-Posting | Does not exist | — | New | New (classify provider as REAL/DEMO/PLANNED) | New system | Social Media department |
| Reports / Insights | Does not exist | — | New | New | New system | Analytics department |
| AI Music / Logos / Presentations / Hashtags | Does not exist | — | New | New (classify each provider) | New system | Brand & Creative department |
| Legacy brand text (`content.ai`) | Scattered across ~15 public-facing files (A26) | — | Yes, targeted find-and-replace with per-occurrence review | No | Medium (must not touch B/C-classified identifiers) | UNIT 01 |
| Storage (MinIO) | Single bucket, prefix-namespaced, public unsigned URLs | Yes | No | No (unless brand-scoped storage is later required) | Yes (do not rename buckets) | Unchanged infrastructure layer |
| Prisma schema | Flat `User`-owned models, no tenancy | Yes (existing models) | — | **New models required** for Brand Workspace/Brand Memory (no existing model to extend) | Yes (every new model needs its own migration unit) | Extend schema, don't rewrite it |

---

# Appendix — Notable structural observations for future units

1. **No route-level auth guard.** Eight pages independently reimplement the same `SignedOut` check. A future unit (not this one) could introduce a shared layout-level guard — but per `AGENTS.md`, do not refactor this casually outside a scoped unit, since every one of those pages currently works correctly.
2. **`/face-swap` is fully functional but has zero navigation discoverability** (absent from Navbar and Footer). Worth a product decision in the department-migration unit: keep it as a hidden capability, fold it into Video/Avatar flows, or surface it explicitly.
3. **Demo Mode has no backend awareness.** This is by design (client-only sandbox for previews with no reachable backend) and should stay that way — do not introduce backend demo-mode branching.
4. **The frontend `Me` type is missing `isSuperAdmin`**, which the backend already returns. No superadmin-specific UI exists yet; this is a latent gap, not a bug, since superadmin behavior today is fully server-enforced.
5. **The codebase's most recent visual direction (commit `dfd8065`) moved toward a "content.ai" glassmorphism identity** — this is the opposite direction from the cre8.ai black/navy/electric-blue spec. UNIT 02 (New Design System) should treat this as the baseline to evolve from, not assume a blank slate.
6. **API types are hand-written, not generated**, so any backend contract change for new cre8.ai domains must be manually mirrored in `apps/frontend/src/lib/api.ts` — there's no type-safety net across the boundary today.
7. **`VITE_API_URL` is baked in at Docker build time**, not runtime-configurable — relevant if a future unit needs multiple environments/preview URLs.
