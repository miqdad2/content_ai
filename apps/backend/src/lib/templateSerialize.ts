import type { Template, TemplateBlock, TemplateRender } from "@repo/db";
import { getPublicUrl } from "./storage.js";

export function serializeBlock(block: TemplateBlock) {
  return {
    ...block,
    startImageUrl: block.startImageKey ? getPublicUrl(block.startImageKey) : null,
    endImageUrl: block.endImageKey ? getPublicUrl(block.endImageKey) : null,
    videoUrl: block.videoKey ? getPublicUrl(block.videoKey) : null,
  };
}

export function serializeTemplate(template: Template & { blocks?: TemplateBlock[] }) {
  return {
    ...template,
    audioUrl: template.audioKey ? getPublicUrl(template.audioKey) : null,
    previewVideoUrl: template.previewVideoKey ? getPublicUrl(template.previewVideoKey) : null,
    thumbnailUrl: template.thumbnailKey ? getPublicUrl(template.thumbnailKey) : null,
    blocks: template.blocks ? template.blocks.map(serializeBlock) : undefined,
  };
}

export function serializeRender(render: TemplateRender) {
  return {
    ...render,
    videoUrl: render.videoKey ? getPublicUrl(render.videoKey) : null,
    thumbnailUrl: render.thumbnailKey ? getPublicUrl(render.thumbnailKey) : null,
  };
}
