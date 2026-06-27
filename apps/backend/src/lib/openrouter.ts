import { env } from "../env.js";

const BASE_URL = env.OPENROUTER_BASE_URL;

function authHeaders(): Record<string, string> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it in the backend .env to generate videos.",
    );
  }
  return {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface VideoModel {
  id: string;
  name: string;
  description?: string;
  supported_resolutions?: string[];
  supported_aspect_ratios?: string[];
  supported_sizes?: string[];
  /** Discrete clip lengths (seconds) the model accepts, e.g. veo-3.1 → [4, 6, 8]. */
  supported_durations?: number[];
}

/** List the video-generation models available on OpenRouter. */
export async function listVideoModels(): Promise<VideoModel[]> {
  const res = await fetch(`${BASE_URL}/videos/models`, {
    headers: env.OPENROUTER_API_KEY ? authHeaders() : { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to list video models: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: VideoModel[] };
  return json.data ?? [];
}

interface ImageRef {
  /** A data URL (data:image/png;base64,...) or a publicly reachable URL. */
  url: string;
}

// ---------------------------------------------------------------------------
// Image generation (dedicated OpenRouter Image API)
// ---------------------------------------------------------------------------

interface CapabilityDescriptor {
  type?: string;
  values?: string[];
}

interface RawImageModel {
  id: string;
  name?: string;
  description?: string;
  supported_parameters?: Record<string, CapabilityDescriptor | undefined>;
}

/**
 * List image-generation models. We normalise the response into the same shape
 * the video models use so the frontend can share one model-picker component.
 */
export async function listImageModels(): Promise<VideoModel[]> {
  const res = await fetch(`${BASE_URL}/images/models`, {
    headers: env.OPENROUTER_API_KEY ? authHeaders() : { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to list image models: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: RawImageModel[] };
  return (json.data ?? []).map((m) => ({
    id: m.id,
    name: m.name ?? m.id,
    description: m.description,
    supported_resolutions: m.supported_parameters?.resolution?.values,
    supported_aspect_ratios: m.supported_parameters?.aspect_ratio?.values,
  }));
}

export interface GenerateImageParams {
  model: string;
  prompt: string;
  resolution?: string;
  aspectRatio?: string;
  references?: ImageRef[];
}

export interface GeneratedImage {
  buffer: Buffer;
  contentType: string;
  cost?: number;
}

interface ImageGenerationResponse {
  data?: { b64_json?: string; url?: string }[];
  usage?: { cost?: number };
  error?: string | { message?: string };
}

/** Guess an image content type from the leading bytes of the buffer. */
function detectImageContentType(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return "image/png";
}

/** Generate an image synchronously and return the decoded bytes. */
export async function generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
  };
  if (params.resolution) body.resolution = params.resolution;
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
  if (params.references && params.references.length > 0) {
    body.input_references = params.references.map((ref) => ({
      type: "image_url",
      image_url: { url: ref.url },
    }));
  }

  const res = await fetch(`${BASE_URL}/images`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter image generation failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as ImageGenerationResponse;
  const first = json.data?.[0];

  if (first?.b64_json) {
    const buffer = Buffer.from(first.b64_json, "base64");
    return { buffer, contentType: detectImageContentType(buffer), cost: json.usage?.cost };
  }
  if (first?.url) {
    const imgRes = await fetch(first.url);
    if (!imgRes.ok) {
      throw new Error(`Failed to download generated image: ${imgRes.status}`);
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return {
      buffer,
      contentType: imgRes.headers.get("content-type") ?? detectImageContentType(buffer),
      cost: json.usage?.cost,
    };
  }

  const message =
    typeof json.error === "string" ? json.error : json.error?.message ?? "No image returned";
  throw new Error(message);
}

export interface GenerateVideoParams {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  generateAudio?: boolean;
  firstFrame?: ImageRef;
  lastFrame?: ImageRef;
  references?: ImageRef[];
}

export interface GeneratedVideo {
  buffer: Buffer;
  contentType: string;
  providerJobId: string;
  cost?: number;
}

type JobStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled" | "expired";

interface JobResponse {
  id: string;
  polling_url?: string;
  status: JobStatus;
  unsigned_urls?: string[];
  usage?: { cost?: number };
  error?: string;
}

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate a video synchronously: submit the job, poll until it reaches a
 * terminal state, then download and return the resulting video bytes.
 */
export async function generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
  const body: Record<string, unknown> = {
    model: params.model,
    prompt: params.prompt,
  };
  if (params.duration) body.duration = params.duration;
  if (params.resolution) body.resolution = params.resolution;
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
  if (params.generateAudio !== undefined) body.generate_audio = params.generateAudio;

  const frameImages: unknown[] = [];
  if (params.firstFrame) {
    frameImages.push({
      type: "image_url",
      image_url: { url: params.firstFrame.url },
      frame_type: "first_frame",
    });
  }
  if (params.lastFrame) {
    frameImages.push({
      type: "image_url",
      image_url: { url: params.lastFrame.url },
      frame_type: "last_frame",
    });
  }
  if (frameImages.length > 0) body.frame_images = frameImages;

  if (params.references && params.references.length > 0) {
    body.input_references = params.references.map((ref) => ({
      type: "image_url",
      image_url: { url: ref.url },
    }));
  }

  // Step 1: submit
  const submitRes = await fetch(`${BASE_URL}/videos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    throw new Error(`OpenRouter submit failed: ${submitRes.status} ${await submitRes.text()}`);
  }
  const submitted = (await submitRes.json()) as JobResponse;
  const jobId = submitted.id;
  const pollingUrl = submitted.polling_url ?? `${BASE_URL}/videos/${jobId}`;

  // Step 2: poll until terminal
  const deadline = Date.now() + MAX_POLL_MS;
  let status: JobResponse = submitted;
  while (status.status === "pending" || status.status === "in_progress") {
    if (Date.now() > deadline) {
      throw new Error(`Video generation timed out after ${MAX_POLL_MS / 1000}s (job ${jobId})`);
    }
    await sleep(POLL_INTERVAL_MS);
    const pollRes = await fetch(pollingUrl, { headers: authHeaders() });
    if (!pollRes.ok) {
      throw new Error(`OpenRouter poll failed: ${pollRes.status} ${await pollRes.text()}`);
    }
    status = (await pollRes.json()) as JobResponse;
  }

  if (status.status !== "completed") {
    throw new Error(status.error ?? `Video generation ${status.status} (job ${jobId})`);
  }

  // Step 3: download the content
  const contentUrl = status.unsigned_urls?.[0] ?? `${BASE_URL}/videos/${jobId}/content?index=0`;
  const videoRes = await fetch(contentUrl, { headers: authHeaders() });
  if (!videoRes.ok) {
    throw new Error(`Failed to download generated video: ${videoRes.status}`);
  }
  const arrayBuffer = await videoRes.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: videoRes.headers.get("content-type") ?? "video/mp4",
    providerJobId: jobId,
    cost: status.usage?.cost,
  };
}
