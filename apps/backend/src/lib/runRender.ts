import { prisma, type Avatar, type TemplateBlock } from "@repo/db";
import { uploadBuffer } from "./storage.js";
import { extFromMime } from "./uploads.js";
import { renderTemplate } from "./templateRender.js";

/**
 * Execute a template render synchronously and persist the result on the given
 * TemplateRender row (marking it COMPLETED/FAILED). Returns the stored object
 * keys on success, or throws (after marking the row FAILED) on failure.
 */
export async function runAndStoreRender(params: {
  renderId: string;
  blocks: TemplateBlock[];
  orderedAvatars: Avatar[];
  audioKey?: string | null;
  /** AI-generate the cover thumbnail from the block prompts (used on export). */
  aiThumbnail?: boolean;
  /**
   * When true, re-generate every block even if a baked videoKey exists.
   * Set this for user renders so the user's avatar is applied instead of
   * the admin's baked clip.
   */
  forceRegenerate?: boolean;
}): Promise<{ videoKey: string; thumbnailKey: string; cost: number }> {
  try {
    const result = await renderTemplate({
      blocks: params.blocks,
      avatars: params.orderedAvatars.map((a) => ({ faceKey: a.faceKey })),
      audioKey: params.audioKey,
      aiThumbnail: params.aiThumbnail,
      forceRegenerate: params.forceRegenerate,
    });

    const [videoKey, thumbnailKey] = await Promise.all([
      uploadBuffer(result.videoBuffer, result.contentType, "templates/renders", "mp4"),
      uploadBuffer(
        result.thumbnailBuffer,
        result.thumbnailContentType,
        "templates/thumbnails",
        extFromMime(result.thumbnailContentType),
      ),
    ]);

    await prisma.templateRender.update({
      where: { id: params.renderId },
      data: { status: "COMPLETED", videoKey, thumbnailKey, cost: result.cost },
    });
    return { videoKey, thumbnailKey, cost: result.cost };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Template render failed";
    console.error("Template render failed:", message);
    await prisma.templateRender.update({
      where: { id: params.renderId },
      data: { status: "FAILED", error: message },
    });
    throw err instanceof Error ? err : new Error(message);
  }
}
