import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // Public URL the backend is reachable at (used for auth callbacks).
  BACKEND_URL: z.string().url().default("http://localhost:4000"),
  // Frontend origin, used for CORS + auth trusted origins.
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  DATABASE_URL: z.string().url(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Comma-separated list of emails that should be treated as admins. Users with
  // a matching email are promoted to the "admin" role on their next request.
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  // Image model used to AI-generate a template's cover thumbnail (from block prompts).
  OPENROUTER_THUMBNAIL_MODEL: z.string().default("google/gemini-3.1-flash-image"),

  // Self-hosted FaceFusion face-swap service.
  // Use "localhost" for host-based dev, "facefusion" inside docker-compose.
  FACEFUSION_URL: z.string().url().default("http://localhost:7865"),

  // MinIO / S3-compatible object store
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_FRONTEND_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("video-arena"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
