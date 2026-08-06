import type {
  Avatar,
  CreditBalance,
  CreditPacksResponse,
  CreditTransaction,
  CreditTxnType,
  FaceSwap,
  GenerationModel,
  Image,
  Me,
  RenderBlockProgress,
  SwapModelOption,
  Template,
  TemplateAudioClip,
  TemplateBlock,
  TemplateRender,
  Video,
  VideoModel,
} from "@/lib/api";

/**
 * Frontend-only demo sandbox for showing the approved UI to a client via a
 * Vercel preview with no backend reachable. Active only when
 * VITE_DEMO_MODE=true. Every function here is a drop-in stand-in for the
 * real apps/frontend/src/lib/api.ts call it backs — same return shape, same
 * thrown-Error-on-failure contract — so no page/component needs to know
 * demo mode exists.
 *
 * Sample media is drawn only from the existing public/showcase wall clips +
 * stills. templates/dhurandhar.mp4 and templates/boyfriend.mp4 are
 * deliberately never referenced here — they were removed from public
 * rendering for containing real film/celebrity references and must not
 * resurface, including in the demo.
 */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

export const DEMO_EMAIL = "demo@content.ai";
export const DEMO_PASSWORD = "demo1234";

// ---------------------------------------------------------------------------
// Session store — a minimal external store compatible with useSyncExternalStore.
// ---------------------------------------------------------------------------

/**
 * Isolated demo-only user shape. `demoPlan` deliberately has no equivalent
 * anywhere in the production data model (Me type in api.ts, Better Auth
 * user, Prisma schema) — the app has no subscription-plan concept at all.
 * It reaches the shared useSession() surface structurally (DemoUser has
 * every field AuthSessionResult's user type expects, plus this one extra),
 * but that surface's declared TS type never mentions `demoPlan`, so no
 * production component can read it through `session.user`. The only
 * sanctioned read path is getDemoPlan() below.
 */
interface DemoUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  demoPlan: "Agency";
}

interface DemoSessionData {
  user: DemoUser;
  session: { id: string };
}

const DEMO_USER: DemoUser = {
  id: "content-ai-demo-user",
  name: "Content.ai Demo",
  email: DEMO_EMAIL,
  image: null,
  demoPlan: "Agency",
};

/**
 * The only sanctioned way to read the demo plan label. Returns null when
 * Demo Mode is disabled — no production component should ever assume a
 * plan exists.
 */
export function getDemoPlan(): DemoUser["demoPlan"] | null {
  return isDemoMode() ? DEMO_USER.demoPlan : null;
}

const SIGNED_IN_SNAPSHOT: DemoSessionData = {
  user: DEMO_USER,
  session: { id: "demo-session" },
};

const STORAGE_KEY = "content.ai-demo-session";

function readPersistedSignIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let signedIn = readPersistedSignIn();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeDemoSession(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Stable reference while signed in/out — required by useSyncExternalStore. */
export function getDemoSessionSnapshot(): DemoSessionData | null {
  return signedIn ? SIGNED_IN_SNAPSHOT : null;
}

export function demoSignIn(): void {
  signedIn = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
  emit();
}

export function demoSignOut(): void {
  signedIn = false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

// ---------------------------------------------------------------------------
// Credits ledger — mutable, seeded with a plausible history.
// ---------------------------------------------------------------------------

let txnSeq = 0;
const nextTxnId = () => `demo-txn-${(txnSeq += 1)}`;
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

let credits = 5000;
const transactions: CreditTransaction[] = [];

function record(
  type: CreditTxnType,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: string,
  createdAt?: string,
): CreditTransaction {
  credits += amount;
  const txn: CreditTransaction = {
    id: nextTxnId(),
    type,
    amount,
    balanceAfter: credits,
    description,
    referenceType: referenceType ?? null,
    referenceId: referenceId ?? null,
    createdAt: createdAt ?? new Date().toISOString(),
  };
  transactions.unshift(txn);
  return txn;
}

// Seed a short, plausible history (oldest first, so balanceAfter reads
// correctly) — ends at exactly 4850, matching the fixed demo balance.
credits = 0;
record("PURCHASE", 5000, "Studio pack", "payment", "demo-payment-seed", hoursAgo(72));
record("SPEND", -60, "Video generation", "video", "demo-video-seed", hoursAgo(30));
record("SPEND", -60, "Video generation", "video", "demo-video-seed-2", hoursAgo(10));
record("SPEND", -30, "Image generation", "image", "demo-image-seed", hoursAgo(2));

export const DEMO_ACTION_COSTS = { video: 60, image: 6, template_render: 1000 };

export class DemoInsufficientCreditsError extends Error {
  constructor(required: number, available: number) {
    super(`Insufficient credits: need ${required}, have ${available}.`);
    this.name = "InsufficientCreditsError";
  }
}

function spend(amount: number, description: string, referenceType: string, referenceId: string) {
  if (credits < amount) throw new DemoInsufficientCreditsError(amount, credits);
  record("SPEND", -amount, description, referenceType, referenceId);
}

// ---------------------------------------------------------------------------
// Sample media pool (excludes the two removed celebrity/film banner clips).
// ---------------------------------------------------------------------------

const CLIPS = [
  "storm-giant",
  "drift-racing",
  "football-invader",
  "night-vision",
  "baseball-game",
  "cgi-breakdown",
  "final-serve",
  "nightline",
  "apex-hunter",
  "dragon-fantasy",
  "kung-fu-hit",
  "free-fall",
  "red-thread",
  "summer-haze",
  "in-the-dark",
].map((slug) => `/showcase/${slug}.mp4`);

const STILLS = [1, 2, 3, 4].map((n) => `/showcase/stills/img-${n}.jpg`);

let clipCursor = 0;
const nextClip = () => CLIPS[(clipCursor++) % CLIPS.length]!;
let stillCursor = 0;
const nextStill = () => STILLS[(stillCursor++) % STILLS.length]!;

// ---------------------------------------------------------------------------
// Models (static lists — enough to populate the pickers realistically).
// ---------------------------------------------------------------------------

export function demoFetchModels(): VideoModel[] {
  return [
    { id: "bytedance/seedance-2.0", name: "Seedance 2.0", supported_durations: [4, 6, 8], supported_resolutions: ["720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16", "1:1"] },
    { id: "bytedance/seedance-2.0-fast", name: "Seedance 2.0 Fast", supported_durations: [2, 3, 4], supported_resolutions: ["720p"], supported_aspect_ratios: ["16:9", "9:16"] },
    { id: "kwaivgi/kling-v3.0-std", name: "Kling 3.0", supported_durations: [5, 10], supported_resolutions: ["720p", "1080p"], supported_aspect_ratios: ["16:9", "9:16"] },
  ];
}

export function demoFetchImageModels(): GenerationModel[] {
  return [
    { id: "google/nano-banana", name: "Nano Banana", supported_resolutions: ["1K", "2K"], supported_aspect_ratios: ["1:1", "16:9", "9:16"] },
    { id: "black-forest-labs/flux.2", name: "Flux.2", supported_resolutions: ["1K", "2K", "4K"], supported_aspect_ratios: ["1:1", "16:9", "9:16", "4:3"] },
    { id: "bytedance-seed/seedream", name: "Seedream", supported_resolutions: ["1K", "2K"], supported_aspect_ratios: ["1:1", "16:9", "9:16"] },
  ];
}

export function demoFetchSwapModels(): SwapModelOption[] {
  return [{ id: "facefusion", name: "FaceFusion (local)", local: true }];
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

const videos: Video[] = [
  mkVideo("A golden retriever playing fetch on a sunny beach, slow motion", "bytedance/seedance-2.0", nextClip(), 4),
  mkVideo("Tokyo night street racing, neon reflections on wet asphalt", "bytedance/seedance-2.0-fast", nextClip(), 3),
  mkVideo("A giant emerging from storm clouds, cinematic blockbuster opening", "kwaivgi/kling-v3.0-std", nextClip(), 5),
];

function mkVideo(prompt: string, model: string, src: string, duration: number, hoursOld = 24): Video {
  return {
    id: `demo-video-${Math.random().toString(36).slice(2, 8)}`,
    status: "COMPLETED",
    prompt,
    model,
    duration,
    resolution: "1080p",
    aspectRatio: "16:9",
    generateAudio: true,
    error: null,
    cost: DEMO_ACTION_COSTS.video,
    createdAt: hoursAgo(hoursOld),
    videoUrl: src,
    startFrameUrl: null,
    endFrameUrl: null,
    referenceFrameUrls: [],
  };
}

export function demoFetchVideos(): Video[] {
  return videos;
}

export function demoCreateVideo(form: FormData): Video {
  spend(DEMO_ACTION_COSTS.video, "Video generation", "video", "demo-video-new");
  const video = mkVideo(
    String(form.get("prompt") ?? "Untitled prompt"),
    String(form.get("model") ?? "bytedance/seedance-2.0"),
    nextClip(),
    Number(form.get("duration") ?? 4),
    0,
  );
  videos.unshift(video);
  return video;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const images: Image[] = [
  mkImage("A red panda astronaut floating in space, studio lighting", "black-forest-labs/flux.2", nextStill()),
  mkImage("Minimalist product shot of a perfume bottle on marble", "google/nano-banana", nextStill()),
];

function mkImage(prompt: string, model: string, src: string, hoursOld = 20): Image {
  return {
    id: `demo-image-${Math.random().toString(36).slice(2, 8)}`,
    status: "COMPLETED",
    prompt,
    model,
    resolution: "2K",
    aspectRatio: "1:1",
    error: null,
    cost: DEMO_ACTION_COSTS.image,
    createdAt: hoursAgo(hoursOld),
    imageUrl: src,
    referenceImageUrls: [],
  };
}

export function demoFetchImages(): Image[] {
  return images;
}

export function demoCreateImage(form: FormData): Image {
  spend(DEMO_ACTION_COSTS.image, "Image generation", "image", "demo-image-new");
  const image = mkImage(
    String(form.get("prompt") ?? "Untitled prompt"),
    String(form.get("model") ?? "google/nano-banana"),
    nextStill(),
    0,
  );
  images.unshift(image);
  return image;
}

// ---------------------------------------------------------------------------
// Face swaps
// ---------------------------------------------------------------------------

const faceSwaps: FaceSwap[] = [
  {
    id: "demo-swap-1",
    status: "COMPLETED",
    error: null,
    createdAt: hoursAgo(15),
    sourceUrl: STILLS[0]!,
    targetUrl: STILLS[1]!,
    outputUrl: STILLS[1]!,
  },
];

export function demoFetchFaceSwaps(): FaceSwap[] {
  return faceSwaps;
}

export function demoCreateFaceSwap(form: FormData): FaceSwap {
  const source = form.get("source");
  const target = form.get("target");
  const sourceUrl = source instanceof File ? URL.createObjectURL(source) : nextStill();
  const targetUrl = target instanceof File ? URL.createObjectURL(target) : nextStill();
  const swap: FaceSwap = {
    id: `demo-swap-${Math.random().toString(36).slice(2, 8)}`,
    status: "COMPLETED",
    error: null,
    createdAt: new Date().toISOString(),
    sourceUrl,
    targetUrl,
    // We can't actually run FaceFusion in a frontend-only demo — reuse the
    // uploaded target as the "result" rather than an unrelated stock photo.
    outputUrl: targetUrl,
  };
  faceSwaps.unshift(swap);
  return swap;
}

// ---------------------------------------------------------------------------
// Avatars
// ---------------------------------------------------------------------------

const avatars: Avatar[] = [
  { id: "demo-avatar-1", status: "COMPLETED", name: "Studio headshot", error: null, createdAt: hoursAgo(72), faceUrl: STILLS[2]!, sourceImageUrls: [STILLS[2]!] },
  { id: "demo-avatar-2", status: "COMPLETED", name: "Outdoor, natural light", error: null, createdAt: hoursAgo(50), faceUrl: STILLS[3]!, sourceImageUrls: [STILLS[3]!] },
];

export function demoFetchAvatars(): Avatar[] {
  return avatars;
}

export function demoCreateAvatar(form: FormData): Avatar {
  const name = String(form.get("name") ?? "New avatar");
  const photo = form.getAll("images")[0];
  const faceUrl = photo instanceof File ? URL.createObjectURL(photo) : nextStill();
  const avatar: Avatar = {
    id: `demo-avatar-${Math.random().toString(36).slice(2, 8)}`,
    status: "COMPLETED",
    name,
    error: null,
    createdAt: new Date().toISOString(),
    faceUrl,
    sourceImageUrls: [faceUrl],
  };
  avatars.unshift(avatar);
  return avatar;
}

export function demoDeleteAvatar(id: string): void {
  const i = avatars.findIndex((a) => a.id === id);
  if (i >= 0) avatars.splice(i, 1);
}

// ---------------------------------------------------------------------------
// Templates (published, user-facing) + admin authoring copies
// ---------------------------------------------------------------------------

function mkBlock(templateId: string, order: number, startSec: number, duration: number, videoUrl: string): TemplateBlock {
  return {
    id: `demo-block-${templateId}-${order}`,
    order,
    startSec,
    endSec: startSec + duration,
    track: 0,
    duration,
    prompt: "Sample clip",
    model: "bytedance/seedance-2.0",
    resolution: "1080p",
    aspectRatio: "16:9",
    cropStart: 0,
    cropEnd: null,
    linkGroupId: null,
    faceSwapStart: true,
    faceSwapEnd: false,
    avatarSlot: 0,
    swapContext: null,
    swapModel: null,
    lipsync: false,
    startImageUrl: null,
    endImageUrl: null,
    swappedStartUrl: null,
    swappedEndUrl: null,
    videoUrl,
    sourceVideoUrl: null,
  };
}

interface DemoTemplateRecord {
  meta: Omit<Template, "blocks" | "audioClips" | "blockCount">;
  blocks: TemplateBlock[];
  audioClips: TemplateAudioClip[];
}

const templateStore = new Map<string, DemoTemplateRecord>();

function seedTemplate(name: string, description: string, avatarSlots: number): DemoTemplateRecord {
  const id = `demo-template-${templateStore.size + 1}`;
  const preview = nextClip();
  const record: DemoTemplateRecord = {
    meta: {
      id,
      name,
      description,
      avatarSlots,
      avatarIds: avatars.slice(0, avatarSlots).map((a) => a.id),
      published: true,
      thumbnailPrompt: null,
      previewVideoUrl: preview,
      thumbnailUrl: nextStill(),
      createdAt: hoursAgo(96),
      updatedAt: hoursAgo(10),
    },
    blocks: [mkBlock(id, 0, 0, 4, preview), mkBlock(id, 1, 4, 3, nextClip())],
    audioClips: [],
  };
  templateStore.set(id, record);
  return record;
}

seedTemplate("Cinematic Reveal", "A dramatic hero-shot opener with a smooth camera push-in.", 1);
seedTemplate("Night Drive Montage", "Fast-cut night driving sequence with reflections and neon.", 1);
seedTemplate("Action Highlight Reel", "High-energy multi-clip highlight cut with impact moments.", 2);

function toPublicTemplate(rec: DemoTemplateRecord, withBlocks: boolean): Template {
  return {
    ...rec.meta,
    blockCount: rec.blocks.length,
    ...(withBlocks ? { blocks: rec.blocks, audioClips: rec.audioClips } : {}),
  };
}

export function demoFetchTemplates(): Template[] {
  return Array.from(templateStore.values())
    .filter((r) => r.meta.published)
    .map((r) => toPublicTemplate(r, false));
}

export function demoFetchTemplate(id: string): Template {
  const rec = templateStore.get(id);
  if (!rec) throw new Error("Template not found.");
  return toPublicTemplate(rec, true);
}

export function demoFetchAdminTemplates(): Template[] {
  return Array.from(templateStore.values()).map((r) => toPublicTemplate(r, false));
}

export function demoFetchAdminTemplate(id: string): Template {
  return demoFetchTemplate(id);
}

export function demoCreateTemplate(form: FormData): Template {
  const name = String(form.get("name") ?? "New template");
  const description = form.get("description") ? String(form.get("description")) : null;
  const avatarIds = form.getAll("avatarIds").map(String);
  const id = `demo-template-${templateStore.size + 1}`;
  const rec: DemoTemplateRecord = {
    meta: {
      id,
      name,
      description,
      avatarSlots: avatarIds.length || 1,
      avatarIds,
      published: false,
      thumbnailPrompt: null,
      previewVideoUrl: null,
      thumbnailUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    blocks: [],
    audioClips: [],
  };
  templateStore.set(id, rec);
  return toPublicTemplate(rec, true);
}

export function demoUpdateTemplate(id: string, form: FormData): Template {
  const rec = templateStore.get(id);
  if (!rec) throw new Error("Template not found.");
  if (form.has("thumbnailPrompt")) rec.meta.thumbnailPrompt = String(form.get("thumbnailPrompt"));
  if (form.has("name")) rec.meta.name = String(form.get("name"));
  if (form.has("description")) rec.meta.description = String(form.get("description"));
  rec.meta.updatedAt = new Date().toISOString();
  return toPublicTemplate(rec, true);
}

export function demoDeleteTemplate(id: string): void {
  templateStore.delete(id);
}

export function demoExportTemplate(id: string): Template {
  const rec = templateStore.get(id);
  if (!rec) throw new Error("Template not found.");
  rec.meta.published = true;
  rec.meta.previewVideoUrl ??= nextClip();
  rec.meta.thumbnailUrl ??= nextStill();
  rec.meta.updatedAt = new Date().toISOString();
  return toPublicTemplate(rec, true);
}

function numOrUndef(v: FormDataEntryValue | null): number | undefined {
  return v == null ? undefined : Number(v);
}

export function demoCreateBlock(templateId: string, form: FormData): TemplateBlock {
  const rec = templateStore.get(templateId);
  if (!rec) throw new Error("Template not found.");
  const sourceVideo = form.get("sourceVideo");
  const isUpload = sourceVideo instanceof File;
  const startSec = Number(form.get("startSec") ?? 0);
  const duration = isUpload ? 4 : Number(form.get("duration") ?? 4);
  const block: TemplateBlock = {
    id: `demo-block-${templateId}-${rec.blocks.length}-${Math.random().toString(36).slice(2, 6)}`,
    order: rec.blocks.length,
    startSec,
    endSec: startSec + (numOrUndef(form.get("cropEnd")) ?? duration) - Number(form.get("cropStart") ?? 0),
    track: Number(form.get("track") ?? 0),
    duration,
    prompt: isUpload ? "" : String(form.get("prompt") ?? "New clip"),
    model: isUpload ? "" : String(form.get("model") ?? "bytedance/seedance-2.0"),
    resolution: null,
    aspectRatio: null,
    cropStart: Number(form.get("cropStart") ?? 0),
    cropEnd: numOrUndef(form.get("cropEnd")) ?? null,
    linkGroupId: null,
    faceSwapStart: false,
    faceSwapEnd: false,
    avatarSlot: 0,
    swapContext: null,
    swapModel: null,
    lipsync: false,
    startImageUrl: null,
    endImageUrl: null,
    swappedStartUrl: null,
    swappedEndUrl: null,
    videoUrl: isUpload ? null : nextClip(),
    sourceVideoUrl: isUpload ? URL.createObjectURL(sourceVideo) : null,
  };
  rec.blocks.push(block);
  rec.meta.updatedAt = new Date().toISOString();
  return block;
}

function findBlock(templateId: string, blockId: string): { rec: DemoTemplateRecord; block: TemplateBlock } {
  const rec = templateStore.get(templateId);
  const block = rec?.blocks.find((b) => b.id === blockId);
  if (!rec || !block) throw new Error("Block not found.");
  return { rec, block };
}

export function demoUpdateBlock(templateId: string, blockId: string, form: FormData): TemplateBlock {
  const { rec, block } = findBlock(templateId, blockId);
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    switch (key) {
      case "startSec":
      case "endSec":
      case "cropStart":
      case "cropEnd":
      case "track":
      case "duration":
      case "avatarSlot":
        (block as unknown as Record<string, number>)[key] = Number(value);
        break;
      case "faceSwapStart":
      case "faceSwapEnd":
      case "lipsync":
        (block as unknown as Record<string, boolean>)[key] = value === "true";
        break;
      default:
        (block as unknown as Record<string, string>)[key] = value;
    }
  }
  rec.meta.updatedAt = new Date().toISOString();
  return block;
}

export function demoDeleteBlock(templateId: string, blockId: string): void {
  const rec = templateStore.get(templateId);
  if (!rec) return;
  rec.blocks = rec.blocks.filter((b) => b.id !== blockId);
}

export function demoCopyBlock(
  templateId: string,
  blockId: string,
  startSec: number,
  track: number,
): { block: TemplateBlock; source: TemplateBlock } {
  const { rec, block: source } = findBlock(templateId, blockId);
  const linkGroupId = source.linkGroupId ?? `demo-link-${source.id}`;
  source.linkGroupId = linkGroupId;
  const footprint = source.endSec - source.startSec;
  const copy: TemplateBlock = {
    ...source,
    id: `demo-block-${templateId}-copy-${Math.random().toString(36).slice(2, 6)}`,
    order: rec.blocks.length,
    startSec,
    endSec: startSec + footprint,
    track,
    linkGroupId,
  };
  rec.blocks.push(copy);
  return { block: copy, source };
}

export function demoBakeBlock(templateId: string, blockId: string): TemplateBlock {
  const { block } = findBlock(templateId, blockId);
  block.videoUrl = block.sourceVideoUrl ?? nextClip();
  return block;
}

export function demoGenerateBlockSwap(templateId: string, blockId: string): TemplateBlock {
  const { block } = findBlock(templateId, blockId);
  block.swappedStartUrl = nextStill();
  block.swappedEndUrl = block.faceSwapEnd ? nextStill() : null;
  return block;
}

export function demoCaptureBlockFrame(
  templateId: string,
  blockId: string,
  body: { slot: "start" | "end" },
): TemplateBlock {
  const { block } = findBlock(templateId, blockId);
  const frame = nextStill();
  if (body.slot === "start") block.startImageUrl = frame;
  else block.endImageUrl = frame;
  return block;
}

export function demoCreateAudioClip(templateId: string, form: FormData): TemplateAudioClip {
  const rec = templateStore.get(templateId);
  if (!rec) throw new Error("Template not found.");
  const file = form.get("audio");
  const startSec = Number(form.get("startSec") ?? 0);
  const duration = 6;
  const clip: TemplateAudioClip = {
    id: `demo-audio-${templateId}-${rec.audioClips.length}`,
    order: rec.audioClips.length,
    startSec,
    endSec: startSec + duration,
    track: Number(form.get("track") ?? 0),
    audioUrl: file instanceof File ? URL.createObjectURL(file) : "",
    name: file instanceof File ? file.name : "Audio clip",
    duration,
    cropStart: 0,
    cropEnd: null,
  };
  rec.audioClips.push(clip);
  return clip;
}

export function demoUpdateAudioClip(templateId: string, clipId: string, form: FormData): TemplateAudioClip {
  const rec = templateStore.get(templateId);
  const clip = rec?.audioClips.find((c) => c.id === clipId);
  if (!rec || !clip) throw new Error("Audio clip not found.");
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    if (["startSec", "endSec", "cropStart", "cropEnd", "track"].includes(key)) {
      (clip as unknown as Record<string, number>)[key] = Number(value);
    }
  }
  return clip;
}

export function demoDeleteAudioClip(templateId: string, clipId: string): void {
  const rec = templateStore.get(templateId);
  if (!rec) return;
  rec.audioClips = rec.audioClips.filter((c) => c.id !== clipId);
}

// ---------------------------------------------------------------------------
// Template renders (user-facing generate + the /generation/:id progress page)
// ---------------------------------------------------------------------------

const renders = new Map<string, TemplateRender>();
let renderSeq = 0;

(function seedRender() {
  const templates = Array.from(templateStore.values());
  const template = templates[0];
  if (!template) return;
  const id = "demo-render-seed";
  renders.set(id, {
    id,
    templateId: template.meta.id,
    templateName: template.meta.name,
    status: "COMPLETED",
    avatarIds: template.meta.avatarIds,
    videoUrl: template.meta.previewVideoUrl,
    thumbnailUrl: template.meta.thumbnailUrl,
    cost: DEMO_ACTION_COSTS.template_render,
    error: null,
    createdAt: hoursAgo(30),
  });
})();

function mkRenderBlocks(templateId: string): RenderBlockProgress[] {
  const rec = templateStore.get(templateId);
  if (!rec) return [];
  return rec.blocks.map((b, i) => ({
    id: `demo-renderblock-${b.id}`,
    blockId: b.id,
    order: i,
    startSec: b.startSec,
    endSec: b.endSec,
    label: null,
    phase: "COMPLETED",
    attempt: 1,
    error: null,
  }));
}

export function demoRenderTemplate(templateId: string, avatarIds: string[]): TemplateRender {
  const rec = templateStore.get(templateId);
  if (!rec) throw new Error("Template not found.");
  spend(DEMO_ACTION_COSTS.template_render, "Template render", "template_render", `demo-render-${renderSeq}`);
  renderSeq += 1;
  const id = `demo-render-${renderSeq}`;
  const render: TemplateRender = {
    id,
    templateId,
    templateName: rec.meta.name,
    status: "COMPLETED",
    avatarIds,
    videoUrl: rec.meta.previewVideoUrl ?? nextClip(),
    thumbnailUrl: rec.meta.thumbnailUrl ?? nextStill(),
    cost: DEMO_ACTION_COSTS.template_render,
    error: null,
    createdAt: new Date().toISOString(),
    blocks: mkRenderBlocks(templateId),
  };
  renders.set(id, render);
  return render;
}

export function demoFetchTemplateRenders(): TemplateRender[] {
  return Array.from(renders.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function demoFetchRender(id: string): TemplateRender {
  const render = renders.get(id);
  if (!render) throw new Error("Render not found.");
  return render;
}

export function demoRetryRender(id: string): TemplateRender {
  return demoFetchRender(id);
}

// ---------------------------------------------------------------------------
// Me / credits / billing
// ---------------------------------------------------------------------------

export function demoFetchMe(): Me {
  // Public demo account is intentionally not admin-capable — see the audit
  // note in this file's header. /admin/template/create is still reachable by
  // URL but AdminTemplateCreatePage's own `if (!me?.isAdmin)` gate blocks it,
  // same as it would for a real non-admin user — this isn't just a hidden
  // nav link, the route itself refuses to render admin content.
  return { id: DEMO_USER.id, email: DEMO_USER.email, isAdmin: false, credits };
}

export function demoFetchCredits(): CreditBalance {
  return { balance: credits, transactions: transactions.slice(0, 50) };
}

const DEMO_PACKS = [
  { id: "starter", name: "Starter", description: "Enough credits to try things out.", priceInr: 499, baseCredits: 500, bonusCredits: 0 },
  { id: "pro", name: "Pro", description: "Best for regular creators — 10% bonus credits.", priceInr: 1999, baseCredits: 2000, bonusCredits: 200 },
  { id: "studio", name: "Studio", description: "For heavy use — 20% bonus credits.", priceInr: 4999, baseCredits: 5000, bonusCredits: 1000 },
];

/** Shown wherever a demo payment action would otherwise fire. */
export const DEMO_PAYMENTS_DISABLED_MESSAGE = "Payments are disabled in the demo environment.";

export function demoFetchCreditPacks(): CreditPacksResponse {
  return {
    currency: "INR",
    // False on purpose — BillingPage.tsx already has real, unmodified UI for
    // "payments not configured" (disables the Buy buttons, shows a banner).
    // Reusing that existing code path is safer than adding a new one.
    razorpayConfigured: false,
    razorpayKeyId: null,
    packs: DEMO_PACKS.map((p) => ({ ...p, credits: p.baseCredits + p.bonusCredits })),
    actionCosts: DEMO_ACTION_COSTS,
  };
}

/**
 * Demo payments are fully disabled — no order is created, nothing is ever
 * sent to Razorpay, no credits are granted. `packs.razorpayConfigured: false`
 * (above) already keeps BillingPage's Buy buttons disabled so this normally
 * can't be reached from the UI at all; it throws too, as a second, direct
 * guarantee against ever completing a simulated purchase.
 */
export function demoStartCheckout(_packId: string): never {
  throw new Error(DEMO_PAYMENTS_DISABLED_MESSAGE);
}

export function demoVerifyPayment(_orderId: string): never {
  throw new Error(DEMO_PAYMENTS_DISABLED_MESSAGE);
}
