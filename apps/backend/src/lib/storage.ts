import { randomUUID } from "node:crypto";
import { Client as MinioClient } from "minio";
import { env } from "../env.js";

export const minio = new MinioClient({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

const BUCKET = env.MINIO_BUCKET;

/** Anonymous read-only policy so objects are publicly fetchable by key. */
const publicReadPolicy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { AWS: ["*"] },
      Action: ["s3:GetObject"],
      Resource: [`arn:aws:s3:::${BUCKET}/*`],
    },
  ],
});

/** Base URL objects are publicly served from. */
const PUBLIC_BASE = `${env.MINIO_USE_SSL ? "https" : "http"}://${env.MINIO_FRONTEND_ENDPOINT}:${env.MINIO_PORT}/${BUCKET}`;

/** Ensure the bucket exists and allows anonymous reads. Safe to call repeatedly. */
export async function ensureBucket(): Promise<void> {
  const exists = await minio.bucketExists(BUCKET).catch(() => false);
  if (!exists) {
    await minio.makeBucket(BUCKET);
    console.log(`📦 Created object-store bucket "${BUCKET}"`);
  }
  await minio.setBucketPolicy(BUCKET, publicReadPolicy);
}

/** Upload a buffer and return the object key. */
export async function uploadBuffer(
  buffer: Buffer,
  contentType: string,
  prefix = "uploads",
  extension?: string,
): Promise<string> {
  const ext = extension ? `.${extension.replace(/^\./, "")}` : "";
  const key = `${prefix}/${randomUUID()}${ext}`;
  await minio.putObject(BUCKET, key, buffer, buffer.length, {
    "Content-Type": contentType,
  });
  return key;
}

/** Build a public, permanent URL for a stored object (bucket is anonymous-read). */
export function getPublicUrl(key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${PUBLIC_BASE}/${encoded}`;
}

/** Download an object into a Buffer. */
export async function downloadObject(key: string): Promise<Buffer> {
  const stream = await minio.getObject(BUCKET, key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}
