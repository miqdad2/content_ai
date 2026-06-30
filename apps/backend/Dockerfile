# Backend image. Build context must be the repo root (monorepo workspace).
FROM oven/bun:1.3.11 AS base
WORKDIR /app

# ffmpeg is required to stitch template clips together + generate thumbnails.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies for the whole workspace (cached when manifests are unchanged).
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
RUN bun install

# Copy source.
COPY packages/db packages/db
COPY packages/typescript-config packages/typescript-config
COPY packages/eslint-config packages/eslint-config
COPY apps/backend apps/backend

# Generate the Prisma client.
RUN cd packages/db && bunx prisma generate

ENV NODE_ENV=production
EXPOSE 4000

# Sync the database schema, then start the server.
# `prisma db push` creates the schema directly from schema.prisma (no migration
# history needed at this stage). Switch to `prisma migrate deploy` once you commit
# migrations under packages/db/prisma/migrations.
#
# Run from apps/backend so Prisma (and `bun start`'s dotenv) load config the same
# way: when the config is provided as a mounted `.env` file (k8s secret volume at
# /app/apps/backend/.env) Prisma reads DATABASE_URL from it; when it's provided as
# real process env vars (docker-compose) Prisma uses those. Either path works.
CMD ["sh", "-c", "cd apps/backend && bunx prisma db push --schema=../../packages/db/prisma/schema.prisma --skip-generate ; bun start"]
