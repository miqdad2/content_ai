import { Router } from "express";
import { z } from "zod";
import { prisma } from "@repo/db";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import { runAndStoreRender } from "../lib/runRender.js";
import { serializeRender, serializeTemplate } from "../lib/templateSerialize.js";

export const templatesRouter: Router = Router();
export const templateRendersRouter: Router = Router();

// ---- Templates (published, read-only for users) ----

// List all published templates.
templatesRouter.get("/", requireAuth, async (_req, res) => {
  const templates = await prisma.template.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { blocks: true } } },
  });
  res.json(
    templates.map((t) => ({
      ...serializeTemplate(t),
      blockCount: t._count.blocks,
    })),
  );
});

// A single published template.
templatesRouter.get("/:id", requireAuth, async (req, res) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, published: true },
    include: { _count: { select: { blocks: true } } },
  });
  if (!template) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...serializeTemplate(template), blockCount: template._count.blocks });
});

// The current user's renders of a given template.
templatesRouter.get("/:id/renders", requireAuth, async (req: AuthedRequest, res) => {
  const renders = await prisma.templateRender.findMany({
    where: { templateId: req.params.id, userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(renders.map(serializeRender));
});

const renderSchema = z.object({
  avatarIds: z.array(z.string()).min(1).max(2),
});

// Generate a personalised video from a template using the user's own avatars.
templatesRouter.post("/:id/render", requireAuth, async (req: AuthedRequest, res) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, published: true },
    include: { blocks: { orderBy: { startSec: "asc" } } },
  });
  if (!template) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const parsed = renderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  if (template.blocks.length === 0) {
    res.status(400).json({ error: "This template has no video blocks." });
    return;
  }
  if (parsed.data.avatarIds.length !== template.avatarSlots) {
    res.status(400).json({ error: `This template needs exactly ${template.avatarSlots} avatar(s).` });
    return;
  }

  const avatars = await prisma.avatar.findMany({
    where: { id: { in: parsed.data.avatarIds }, userId: req.userId },
  });
  if (avatars.length !== parsed.data.avatarIds.length) {
    res.status(400).json({ error: "One or more selected avatars were not found." });
    return;
  }
  const orderedAvatars = parsed.data.avatarIds.map((id) => avatars.find((a) => a.id === id)!);

  const render = await prisma.templateRender.create({
    data: {
      templateId: template.id,
      userId: req.userId!,
      avatarIds: parsed.data.avatarIds,
      avatars: { connect: parsed.data.avatarIds.map((id) => ({ id })) },
      status: "IN_PROGRESS",
    },
  });

  try {
    await runAndStoreRender({
      renderId: render.id,
      blocks: template.blocks,
      orderedAvatars,
      audioKey: template.audioKey,
      forceRegenerate: true,
    });
    const updated = await prisma.templateRender.findUnique({ where: { id: render.id } });
    res.status(201).json(serializeRender(updated!));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Template render failed";
    const failed = await prisma.templateRender.findUnique({ where: { id: render.id } });
    res.status(502).json({ error: message, render: failed ? serializeRender(failed) : null });
  }
});

// ---- Renders (the user's generated template videos) ----

// List all of the current user's template renders, newest first.
templateRendersRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const renders = await prisma.templateRender.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    include: { template: { select: { name: true } } },
  });
  res.json(
    renders.map((r) => ({ ...serializeRender(r), templateName: r.template.name })),
  );
});

// A single render owned by the user.
templateRendersRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const render = await prisma.templateRender.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { template: { select: { name: true } } },
  });
  if (!render) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...serializeRender(render), templateName: render.template.name });
});
