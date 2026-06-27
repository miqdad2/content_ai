import { randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "@repo/db";
import { requireAdmin } from "../middleware/requireAdmin.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { downloadObject, uploadBuffer } from "../lib/storage.js";
import { audioUpload, extFromMime, upload } from "../lib/uploads.js";
import { runAndStoreRender } from "../lib/runRender.js";
import { renderBlockClip } from "../lib/templateRender.js";
import { serializeBlock, serializeRender, serializeTemplate } from "../lib/templateSerialize.js";

export const adminTemplatesRouter: Router = Router();

const bool = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true"));

// Multipart fields arrive as a string (single value) or string[] (repeated).
const stringArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v]));

const templateMetaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  avatarIds: stringArray,
  durationSec: z.coerce.number().positive().optional(),
});

const blockSchema = z.object({
  order: z.coerce.number().int().min(0).optional(),
  startSec: z.coerce.number().min(0),
  // Optional: the footprint is derived from the crop window over `duration`.
  endSec: z.coerce.number().min(0).optional(),
  track: z.coerce.number().int().min(0).optional(),
  duration: z.coerce.number().int().positive().optional(),
  // Crop window into the generated clip (Premiere-style trim).
  cropStart: z.coerce.number().min(0).optional(),
  cropEnd: z.coerce.number().min(0).optional(),
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().min(1, "Model is required"),
  resolution: z.string().optional(),
  aspectRatio: z.string().optional(),
  faceSwapStart: bool,
  faceSwapEnd: bool,
  avatarSlot: z.coerce.number().int().min(0).max(1).optional(),
});

const MIN_CLIP = 1; // minimum cropped clip length (seconds)

/** Clamp a crop window to [0, duration] with a minimum length. */
function clampCrop(cropStart: number, cropEnd: number, duration: number) {
  const cs = Math.min(Math.max(0, cropStart), Math.max(0, duration - MIN_CLIP));
  const ce = Math.min(Math.max( cs + MIN_CLIP, cropEnd), duration);
  return { cropStart: cs, cropEnd: ce };
}

const blockPatchSchema = blockSchema.partial();

type Files = Record<string, Express.Multer.File[] | undefined>;

/** Validate that the given avatar ids exist and belong to the user. Throws on mismatch. */
async function assertOwnedAvatars(avatarIds: string[], userId: string): Promise<void> {
  if (avatarIds.length < 1 || avatarIds.length > 2) {
    throw new Error("Select 1 or 2 avatars for the template.");
  }
  const found = await prisma.avatar.count({ where: { id: { in: avatarIds }, userId } });
  if (found !== avatarIds.length) {
    throw new Error("One or more selected avatars were not found.");
  }
}

async function uploadIfPresent(file?: Express.Multer.File, prefix = "templates") {
  if (!file) return undefined;
  return uploadBuffer(file.buffer, file.mimetype, prefix, extFromMime(file.mimetype));
}

/** Ensure the template exists and is owned by the requesting admin. */
async function ownedTemplate(req: AuthedRequest, res: Response) {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, creatorId: req.userId },
  });
  if (!template) {
    res.status(404).json({ error: "Not found" });
    return null;
  }
  return template;
}

// ---- Templates ----

// List the admin's own templates (with block counts).
adminTemplatesRouter.get("/", requireAdmin, async (req: AuthedRequest, res) => {
  const templates = await prisma.template.findMany({
    where: { creatorId: req.userId },
    orderBy: { updatedAt: "desc" },
    include: { blocks: true },
  });
  res.json(templates.map((t) => serializeTemplate(t)));
});

// Full template with ordered blocks.
adminTemplatesRouter.get("/:id", requireAdmin, async (req: AuthedRequest, res) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, creatorId: req.userId },
    include: { blocks: { orderBy: { startSec: "asc" } } },
  });
  if (!template) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeTemplate(template));
});

// Create a template. The admin assigns 1-2 of their own avatars to the slots
// up front; these become "Avatar 1"/"Avatar 2" for blocks + the admin's export.
adminTemplatesRouter.post(
  "/",
  requireAdmin,
  audioUpload.fields([{ name: "audio", maxCount: 1 }]),
  async (req: AuthedRequest, res) => {
    const parsed = templateMetaSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.name) {
      res.status(400).json({ error: parsed.success ? { name: ["Name is required"] } : parsed.error.flatten().fieldErrors });
      return;
    }
    const avatarIds = parsed.data.avatarIds ?? [];
    try {
      await assertOwnedAvatars(avatarIds, req.userId!);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid avatars" });
      return;
    }

    const files = (req.files ?? {}) as Files;
    const audio = files.audio?.[0];
    const audioKey = audio
      ? await uploadBuffer(audio.buffer, audio.mimetype, "templates/audio", audio.originalname.split(".").pop())
      : undefined;

    const template = await prisma.template.create({
      data: {
        creatorId: req.userId!,
        name: parsed.data.name,
        description: parsed.data.description,
        avatarIds,
        avatarSlots: avatarIds.length,
        durationSec: parsed.data.durationSec,
        audioKey,
      },
      include: { blocks: true },
    });
    res.status(201).json(serializeTemplate(template));
  },
);

// Update template metadata: name/description/duration, the assigned avatars
// (which resets avatarSlots), and/or the base audio track.
adminTemplatesRouter.patch(
  "/:id",
  requireAdmin,
  audioUpload.fields([{ name: "audio", maxCount: 1 }]),
  async (req: AuthedRequest, res) => {
    const template = await ownedTemplate(req, res);
    if (!template) return;

    const parsed = templateMetaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const avatarIds = parsed.data.avatarIds;
    if (avatarIds) {
      try {
        await assertOwnedAvatars(avatarIds, req.userId!);
      } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Invalid avatars" });
        return;
      }
    }

    const files = (req.files ?? {}) as Files;
    const audio = files.audio?.[0];
    const audioKey = audio
      ? await uploadBuffer(audio.buffer, audio.mimetype, "templates/audio", audio.originalname.split(".").pop())
      : undefined;

    const updated = await prisma.template.update({
      where: { id: template.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        durationSec: parsed.data.durationSec,
        ...(avatarIds ? { avatarIds, avatarSlots: avatarIds.length } : {}),
        ...(audioKey ? { audioKey } : {}),
      },
      include: { blocks: { orderBy: { startSec: "asc" } } },
    });
    res.json(serializeTemplate(updated));
  },
);

adminTemplatesRouter.delete("/:id", requireAdmin, async (req: AuthedRequest, res) => {
  const template = await ownedTemplate(req, res);
  if (!template) return;
  await prisma.template.delete({ where: { id: template.id } });
  res.status(204).end();
});

// ---- Blocks ----

const blockUpload = upload.fields([
  { name: "startImage", maxCount: 1 },
  { name: "endImage", maxCount: 1 },
]);

// Add a video block to a template.
adminTemplatesRouter.post("/:id/blocks", requireAdmin, blockUpload, async (req: AuthedRequest, res) => {
  const template = await ownedTemplate(req, res);
  if (!template) return;

  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const files = (req.files ?? {}) as Files;
  const [startImageKey, endImageKey] = await Promise.all([
    uploadIfPresent(files.startImage?.[0]),
    uploadIfPresent(files.endImage?.[0]),
  ]);

  const count = await prisma.templateBlock.count({ where: { templateId: template.id } });
  const slot = Math.min(parsed.data.avatarSlot ?? 0, Math.max(0, template.avatarSlots - 1));
  const duration =
    parsed.data.duration ??
    (parsed.data.endSec != null
      ? Math.max(1, Math.round(parsed.data.endSec - parsed.data.startSec))
      : 4);
  // Crop window (defaults to the whole clip); footprint = cropEnd - cropStart.
  const { cropStart, cropEnd } = clampCrop(
    parsed.data.cropStart ?? 0,
    parsed.data.cropEnd ?? duration,
    duration,
  );
  const block = await prisma.templateBlock.create({
    data: {
      templateId: template.id,
      order: parsed.data.order ?? count,
      startSec: parsed.data.startSec,
      endSec: parsed.data.startSec + (cropEnd - cropStart),
      track: parsed.data.track ?? 0,
      duration,
      cropStart,
      cropEnd,
      prompt: parsed.data.prompt,
      model: parsed.data.model,
      resolution: parsed.data.resolution,
      aspectRatio: parsed.data.aspectRatio,
      faceSwapStart: parsed.data.faceSwapStart ?? false,
      faceSwapEnd: parsed.data.faceSwapEnd ?? false,
      avatarSlot: slot,
      startImageKey,
      endImageKey,
    },
  });
  res.status(201).json(serializeTemplate({ ...template, blocks: [block] }).blocks![0]);
});

// Update a block (only provided fields/images change).
adminTemplatesRouter.patch(
  "/:id/blocks/:blockId",
  requireAdmin,
  blockUpload,
  async (req: AuthedRequest, res) => {
    const template = await ownedTemplate(req, res);
    if (!template) return;
    const existing = await prisma.templateBlock.findFirst({
      where: { id: req.params.blockId, templateId: template.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Block not found" });
      return;
    }
    const parsed = blockPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }
    const files = (req.files ?? {}) as Files;
    const startImageKey = await uploadIfPresent(files.startImage?.[0]);
    const endImageKey = await uploadIfPresent(files.endImage?.[0]);
    const slot =
      parsed.data.avatarSlot === undefined
        ? undefined
        : Math.min(parsed.data.avatarSlot, Math.max(0, template.avatarSlots - 1));

    const startSec = parsed.data.startSec ?? existing.startSec;
    const duration =
      parsed.data.duration ??
      existing.duration ??
      Math.max(1, Math.round(existing.endSec - existing.startSec));
    // Resolve + clamp the crop window; footprint = cropEnd - cropStart.
    const { cropStart, cropEnd } = clampCrop(
      parsed.data.cropStart ?? existing.cropStart,
      parsed.data.cropEnd ?? existing.cropEnd ?? duration,
      duration,
    );

    // Content fields are shared across a link group; position/crop are per-block.
    const content = {
      ...(parsed.data.prompt !== undefined ? { prompt: parsed.data.prompt } : {}),
      ...(parsed.data.model !== undefined ? { model: parsed.data.model } : {}),
      ...(parsed.data.duration !== undefined ? { duration } : {}),
      ...(parsed.data.resolution !== undefined ? { resolution: parsed.data.resolution } : {}),
      ...(parsed.data.aspectRatio !== undefined ? { aspectRatio: parsed.data.aspectRatio } : {}),
      ...(parsed.data.faceSwapStart !== undefined ? { faceSwapStart: parsed.data.faceSwapStart } : {}),
      ...(parsed.data.faceSwapEnd !== undefined ? { faceSwapEnd: parsed.data.faceSwapEnd } : {}),
      ...(slot !== undefined ? { avatarSlot: slot } : {}),
      ...(startImageKey ? { startImageKey } : {}),
      ...(endImageKey ? { endImageKey } : {}),
    };

    const block = await prisma.templateBlock.update({
      where: { id: existing.id },
      data: {
        ...content,
        order: parsed.data.order,
        startSec,
        track: parsed.data.track,
        cropStart,
        cropEnd,
        endSec: startSec + (cropEnd - cropStart),
      },
    });

    // Propagate shared content (incl. a duration change) to linked siblings,
    // re-clamping each one's own crop window + footprint.
    if (existing.linkGroupId && Object.keys(content).length > 0) {
      const siblings = await prisma.templateBlock.findMany({
        where: { linkGroupId: existing.linkGroupId, id: { not: existing.id } },
      });
      await Promise.all(
        siblings.map((s) => {
          const c = clampCrop(s.cropStart, s.cropEnd ?? duration, duration);
          return prisma.templateBlock.update({
            where: { id: s.id },
            data: { ...content, cropStart: c.cropStart, cropEnd: c.cropEnd, endSec: s.startSec + (c.cropEnd - c.cropStart) },
          });
        }),
      );
    }

    res.json(serializeTemplate({ ...template, blocks: [block] }).blocks![0]);
  },
);

adminTemplatesRouter.delete(
  "/:id/blocks/:blockId",
  requireAdmin,
  async (req: AuthedRequest, res) => {
    const template = await ownedTemplate(req, res);
    if (!template) return;
    const existing = await prisma.templateBlock.findFirst({
      where: { id: req.params.blockId, templateId: template.id },
    });
    if (!existing) {
      res.status(404).json({ error: "Block not found" });
      return;
    }
    await prisma.templateBlock.delete({ where: { id: existing.id } });
    res.status(204).end();
  },
);

const copySchema = z.object({
  startSec: z.coerce.number().min(0),
  track: z.coerce.number().int().min(0).optional(),
});

// Copy/paste: clone a block's *content* into a new, linked block at a new
// position. Linked blocks share generation content, so editing/re-baking any of
// them updates the rest. The source is given a linkGroupId on first copy.
adminTemplatesRouter.post(
  "/:id/blocks/:blockId/copy",
  requireAdmin,
  async (req: AuthedRequest, res) => {
    const template = await ownedTemplate(req, res);
    if (!template) return;
    const source = await prisma.templateBlock.findFirst({
      where: { id: req.params.blockId, templateId: template.id },
    });
    if (!source) {
      res.status(404).json({ error: "Block not found" });
      return;
    }
    const parsed = copySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    // Ensure the source belongs to a link group (create one on first copy).
    const linkGroupId = source.linkGroupId ?? randomUUID();
    let updatedSource = source;
    if (!source.linkGroupId) {
      updatedSource = await prisma.templateBlock.update({
        where: { id: source.id },
        data: { linkGroupId },
      });
    }

    const count = await prisma.templateBlock.count({ where: { templateId: template.id } });
    const footprint = (source.cropEnd ?? source.duration ?? 4) - source.cropStart;
    const copy = await prisma.templateBlock.create({
      data: {
        templateId: template.id,
        order: count,
        startSec: parsed.data.startSec,
        endSec: parsed.data.startSec + footprint,
        track: parsed.data.track ?? source.track,
        duration: source.duration,
        cropStart: source.cropStart,
        cropEnd: source.cropEnd,
        linkGroupId,
        prompt: source.prompt,
        model: source.model,
        resolution: source.resolution,
        aspectRatio: source.aspectRatio,
        faceSwapStart: source.faceSwapStart,
        faceSwapEnd: source.faceSwapEnd,
        avatarSlot: source.avatarSlot,
        startImageKey: source.startImageKey,
        endImageKey: source.endImageKey,
        videoKey: source.videoKey,
      },
    });
    res.status(201).json({ block: serializeBlock(copy), source: serializeBlock(updatedSource) });
  },
);

// "Bake" a single block: generate just this clip (face-swapping the template's
// avatar onto the frames when enabled) so the admin can preview it on the
// timeline. Stores the clip on the block and returns the updated block.
adminTemplatesRouter.post(
  "/:id/blocks/:blockId/bake",
  requireAdmin,
  async (req: AuthedRequest, res) => {
    const template = await prisma.template.findFirst({
      where: { id: req.params.id, creatorId: req.userId },
    });
    if (!template) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const block = await prisma.templateBlock.findFirst({
      where: { id: req.params.blockId, templateId: template.id },
    });
    if (!block) {
      res.status(404).json({ error: "Block not found" });
      return;
    }

    // Resolve the avatar face for this block's slot (if assigned).
    let face: Buffer | null = null;
    const avatarId = template.avatarIds[block.avatarSlot];
    if (avatarId) {
      const avatar = await prisma.avatar.findFirst({
        where: { id: avatarId, userId: req.userId },
      });
      if (avatar?.faceKey) face = await downloadObject(avatar.faceKey);
    }

    try {
      const clip = await renderBlockClip(block, face);
      const videoKey = await uploadBuffer(clip.buffer, clip.contentType, "templates/blocks", "mp4");
      const updated = await prisma.templateBlock.update({
        where: { id: block.id },
        data: { videoKey },
      });
      // Linked copies share the same baked clip.
      if (block.linkGroupId) {
        await prisma.templateBlock.updateMany({
          where: { linkGroupId: block.linkGroupId, id: { not: block.id } },
          data: { videoKey },
        });
      }
      res.json(serializeBlock(updated));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to bake block";
      console.error("Block bake failed:", message);
      res.status(502).json({ error: message });
    }
  },
);

// ---- Export (render with the template's assigned avatars + publish) ----

adminTemplatesRouter.post("/:id/export", requireAdmin, async (req: AuthedRequest, res) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, creatorId: req.userId },
    include: { blocks: { orderBy: { startSec: "asc" } } },
  });
  if (!template) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (template.blocks.length === 0) {
    res.status(400).json({ error: "Add at least one video block before exporting." });
    return;
  }
  if (template.avatarIds.length === 0) {
    res.status(400).json({ error: "Assign avatars to this template before exporting." });
    return;
  }

  const avatars = await prisma.avatar.findMany({
    where: { id: { in: template.avatarIds }, userId: req.userId },
  });
  if (avatars.length !== template.avatarIds.length) {
    res.status(400).json({ error: "One or more of the template's avatars were not found." });
    return;
  }
  // Preserve slot order from the template.
  const orderedAvatars = template.avatarIds.map((id) => avatars.find((a) => a.id === id)!);

  const render = await prisma.templateRender.create({
    data: {
      templateId: template.id,
      userId: req.userId!,
      avatarIds: template.avatarIds,
      avatars: { connect: template.avatarIds.map((id) => ({ id })) },
      status: "IN_PROGRESS",
    },
  });

  try {
    const { videoKey, thumbnailKey } = await runAndStoreRender({
      renderId: render.id,
      blocks: template.blocks,
      orderedAvatars,
      audioKey: template.audioKey,
      aiThumbnail: true, // export → AI-generate the cover thumbnail from the prompts
    });

    const updated = await prisma.template.update({
      where: { id: template.id },
      data: { published: true, previewVideoKey: videoKey, thumbnailKey },
      include: { blocks: { orderBy: { startSec: "asc" } } },
    });
    res.json(serializeTemplate(updated));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Template export failed";
    const failed = await prisma.templateRender.findUnique({ where: { id: render.id } });
    res.status(502).json({ error: message, render: failed ? serializeRender(failed) : null });
  }
});
