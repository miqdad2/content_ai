import { env } from "../env.js";
import { faceSwap } from "./facefusion.js";
import { stitchTimeline, generateThumbnail, type TimelineSegment } from "./ffmpeg.js";
import { generateImage, generateVideo } from "./openrouter.js";
import { downloadObject } from "./storage.js";

export interface RenderBlock {
  prompt: string;
  model: string;
  resolution?: string | null;
  aspectRatio?: string | null;
  startSec: number;
  endSec: number;
  track: number;
  duration?: number | null;
  cropStart?: number | null;
  cropEnd?: number | null;
  startImageKey?: string | null;
  endImageKey?: string | null;
  videoKey?: string | null;
  linkGroupId?: string | null;
  faceSwapStart: boolean;
  faceSwapEnd: boolean;
  avatarSlot: number;
}

export interface RenderAvatar {
  faceKey: string | null;
}

export interface RenderResult {
  videoBuffer: Buffer;
  contentType: string;
  thumbnailBuffer: Buffer;
  thumbnailContentType: string;
  cost: number;
}

export interface ClipResult {
  buffer: Buffer;
  contentType: string;
  cost: number;
}

/** Sniff an image mime type from the leading bytes (defaults to png). */
function sniffImageMime(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "image/png";
}

function ext(mime: string): string {
  return mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
}

const toDataUrl = (buffer: Buffer, mime: string) =>
  `data:${mime};base64,${buffer.toString("base64")}`;

/** Map an aspect ratio to output dimensions for the stitched video. */
function aspectToDims(aspectRatio?: string | null): { width: number; height: number } {
  switch (aspectRatio) {
    case "9:16":
      return { width: 720, height: 1280 };
    case "1:1":
      return { width: 1024, height: 1024 };
    case "4:3":
      return { width: 960, height: 720 };
    case "3:4":
      return { width: 720, height: 960 };
    case "16:9":
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * AI-generate a cover thumbnail for a template from its block prompts (instead of
 * grabbing an ffmpeg frame). Returns null when there are no usable prompts; throws
 * on a provider error so the caller can fall back to a frame grab.
 */
async function generateAiThumbnail(
  blocks: RenderBlock[],
  aspectRatio?: string | null,
): Promise<{ buffer: Buffer; contentType: string; cost: number }> {
  const scenes = [...blocks]
    .sort((a, b) => a.startSec - b.startSec)
    .map((b) => b.prompt?.trim())
    .filter((p): p is string => !!p);
  if (scenes.length === 0) throw new Error("No block prompts to build a thumbnail from.");

  let joined = scenes.join("; ");
  if (joined.length > 1500) joined = `${joined.slice(0, 1500)}…`;
  const prompt =
    `Design a single, eye-catching cover thumbnail image that represents this short video. ` +
    `The video's scenes are: ${joined}. ` +
    `Cinematic, high quality, cohesive composition, no text, captions or watermarks.`;

  const img = await generateImage({
    model: env.OPENROUTER_THUMBNAIL_MODEL,
    prompt,
    aspectRatio: aspectRatio ?? "16:9",
  });
  return { buffer: img.buffer, contentType: img.contentType, cost: img.cost ?? 0 };
}

/**
 * Generate a single block's video clip: face-swap the avatar onto the start/end
 * frames when enabled, pass the avatar as a reference, then call the model.
 * `face` is the avatar face buffer for this block's slot (or null for none).
 */
export async function renderBlockClip(block: RenderBlock, face: Buffer | null): Promise<ClipResult> {
  // Resolve the start/end frames, face-swapping the avatar on when requested.
  const prepareFrame = async (
    key: string | null | undefined,
    swap: boolean,
  ): Promise<{ buffer: Buffer; mime: string } | null> => {
    if (!key) return null;
    const buffer = await downloadObject(key);
    const mime = sniffImageMime(buffer);
    if (swap && face) {
      const faceMime = sniffImageMime(face);
      const result = await faceSwap(
        { buffer: face, mimetype: faceMime, filename: `face.${ext(faceMime)}` },
        { buffer, mimetype: mime, filename: `frame.${ext(mime)}` },
      );
      return { buffer: result.buffer, mime: result.contentType };
    }
    return { buffer, mime };
  };

  const startFrame = await prepareFrame(block.startImageKey, block.faceSwapStart);
  const endFrame = await prepareFrame(block.endImageKey, block.faceSwapEnd);

  // Reference: the block's selected avatar (used both as a face-swap source
  // above and as an OpenRouter reference image, to keep the person consistent).
  const references: { url: string }[] = [];
  if (face) references.push({ url: toDataUrl(face, sniffImageMime(face)) });

  const duration = block.duration ?? Math.max(1, Math.round(block.endSec - block.startSec));

  const generated = await generateVideo({
    model: block.model,
    prompt: block.prompt,
    duration,
    resolution: block.resolution ?? undefined,
    aspectRatio: block.aspectRatio ?? undefined,
    firstFrame: startFrame ? { url: toDataUrl(startFrame.buffer, startFrame.mime) } : undefined,
    lastFrame: endFrame ? { url: toDataUrl(endFrame.buffer, endFrame.mime) } : undefined,
    references: references.length > 0 ? references : undefined,
    generateAudio: false,
  });

  return { buffer: generated.buffer, contentType: generated.contentType, cost: generated.cost ?? 0 };
}

/**
 * Resolve overlapping, multi-track blocks into a flat list of timeline segments.
 * Boundaries are taken at every block edge (and 0); for each resulting slice the
 * visible block is the one on the highest track that fully spans it (ties broken
 * by the later start, then later index). Uncovered slices become black gaps.
 */
export function buildTimelineSegments(blocks: RenderBlock[]): TimelineSegment[] {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const total = round(Math.max(...blocks.map((b) => b.endSec)));
  if (total <= 0) return [];

  const bounds = new Set<number>([0, total]);
  for (const b of blocks) {
    if (b.startSec > 0 && b.startSec < total) bounds.add(round(b.startSec));
    if (b.endSec > 0 && b.endSec < total) bounds.add(round(b.endSec));
  }
  const points = [...bounds].sort((a, b) => a - b);

  const segments: TimelineSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const s = points[i]!;
    const e = points[i + 1]!;
    const length = round(e - s);
    if (length <= 0) continue;

    // Topmost block fully spanning [s, e).
    let chosen: { block: RenderBlock; idx: number } | null = null;
    blocks.forEach((block, idx) => {
      if (block.startSec - 1e-3 <= s && block.endSec + 1e-3 >= e) {
        if (
          !chosen ||
          block.track > chosen.block.track ||
          (block.track === chosen.block.track && block.startSec >= chosen.block.startSec)
        ) {
          chosen = { block, idx };
        }
      }
    });

    if (chosen) {
      const sel = chosen as { block: RenderBlock; idx: number };
      // Map timeline time to clip time, accounting for the crop in-point.
      const cropStart = sel.block.cropStart ?? 0;
      segments.push({ clip: sel.idx, inPoint: round(cropStart + (s - sel.block.startSec)), length });
    } else {
      segments.push({ clip: null, inPoint: 0, length });
    }
  }
  return segments;
}

/**
 * Render a template end-to-end: generate every block (face-swapping the avatar
 * onto the start/end frames when enabled, and passing the avatar as a reference),
 * then composite the clips across tracks (higher track wins on overlap) over the
 * base audio and produce a thumbnail.
 *
 * Throws on the first block that fails so callers can mark the render FAILED.
 */
export async function renderTemplate(params: {
  blocks: RenderBlock[];
  avatars: (RenderAvatar | undefined)[];
  audioKey?: string | null;
  /** When true, the cover thumbnail is AI-generated from the block prompts. */
  aiThumbnail?: boolean;
  /**
   * When true, always re-generate every block via OpenRouter even if a baked
   * videoKey exists on the block. Use this for user renders so the user's own
   * avatar is applied rather than the admin's baked clip.
   */
  forceRegenerate?: boolean;
}): Promise<RenderResult> {
  const blocks = [...params.blocks];
  if (blocks.length === 0) throw new Error("Template has no video blocks to render.");

  // Pre-download all required avatar face buffers in parallel.
  const uniqueSlots = [...new Set(blocks.map((b) => b.avatarSlot))];
  const faceCache = new Map<number, Buffer | null>();
  await Promise.all(
    uniqueSlots.map(async (slot) => {
      const avatar = params.avatars[slot];
      if (avatar?.faceKey) {
        faceCache.set(slot, await downloadObject(avatar.faceKey));
      } else {
        faceCache.set(slot, null);
      }
    }),
  );
  const avatarFace = (slot: number): Buffer | null => faceCache.get(slot) ?? null;

  // Deduplicate generation by linkGroupId + avatarSlot: blocks that share a
  // linkGroupId reference the same generated content, so we only call
  // OpenRouter once per unique group and reuse the result for the rest.
  // Key: "<linkGroupId>:<slot>" for linked blocks, or null (always generate).
  const linkClipCache = new Map<string, Promise<ClipResult>>();

  // Generate all clips in parallel.
  let totalCost = 0;
  const clipResults = await Promise.all(
    blocks.map(async (block) => {
      // Reuse admin-baked clip only when not forcing regeneration.
      if (block.videoKey && !params.forceRegenerate) {
        const buffer = await downloadObject(block.videoKey);
        return { buffer, cost: 0 };
      }

      // For linked blocks, deduplicate the OpenRouter call.
      const face = avatarFace(block.avatarSlot);
      const dedupeKey = block.linkGroupId
        ? `${block.linkGroupId}:${block.avatarSlot}`
        : null;

      let clipPromise: Promise<ClipResult>;
      if (dedupeKey && linkClipCache.has(dedupeKey)) {
        clipPromise = linkClipCache.get(dedupeKey)!;
      } else {
        clipPromise = renderBlockClip(block, face);
        if (dedupeKey) linkClipCache.set(dedupeKey, clipPromise);
      }

      const clip = await clipPromise;
      return { buffer: clip.buffer, cost: clip.cost };
    }),
  );

  const clips: Buffer[] = clipResults.map((r) => r.buffer);
  for (const r of clipResults) totalCost += r.cost;

  const segments = buildTimelineSegments(blocks);

  // Output dimensions follow the base (earliest, lowest-track) block.
  const base = [...blocks].sort(
    (a, b) => a.startSec - b.startSec || a.track - b.track,
  )[0]!;
  const { width, height } = aspectToDims(base.aspectRatio);

  const audio = params.audioKey ? await downloadObject(params.audioKey) : null;
  const videoBuffer = await stitchTimeline(clips, segments, audio, { width, height });

  // Cover thumbnail: AI-generated from the block prompts (export), else a frame grab.
  let thumbnailBuffer: Buffer;
  let thumbnailContentType = "image/jpeg";
  if (params.aiThumbnail) {
    try {
      const ai = await generateAiThumbnail(blocks, base.aspectRatio);
      thumbnailBuffer = ai.buffer;
      thumbnailContentType = ai.contentType;
      totalCost += ai.cost;
    } catch (err) {
      console.warn(
        "AI thumbnail generation failed, falling back to a frame grab:",
        err instanceof Error ? err.message : err,
      );
      thumbnailBuffer = await generateThumbnail(videoBuffer);
    }
  } else {
    thumbnailBuffer = await generateThumbnail(videoBuffer);
  }

  return { videoBuffer, contentType: "video/mp4", thumbnailBuffer, thumbnailContentType, cost: totalCost };
}
