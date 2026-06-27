import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/db";
import { env } from "./env.js";

const socialProviders =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  baseURL: env.BACKEND_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // No email server wired up locally yet; allow sign-in immediately.
    requireEmailVerification: false,
  },
  socialProviders,
  trustedOrigins: [env.FRONTEND_URL],
});

export type Session = typeof auth.$Infer.Session;
