import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env.js";
import { auth } from "./auth.js";
import { ensureBucket } from "./lib/storage.js";
import { videosRouter } from "./routes/videos.js";
import { imagesRouter } from "./routes/images.js";
import { faceSwapsRouter } from "./routes/faceswaps.js";
import { modelsRouter } from "./routes/models.js";
import { meRouter } from "./routes/me.js";
import { avatarsRouter } from "./routes/avatars.js";
import { templatesRouter, templateRendersRouter } from "./routes/templates.js";
import { adminTemplatesRouter } from "./routes/adminTemplates.js";
import { uploadErrorHandler } from "./lib/uploads.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Better-auth handler must be mounted BEFORE express.json().
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/videos", videosRouter);
app.use("/api/images", imagesRouter);
app.use("/api/faceswaps", faceSwapsRouter);
app.use("/api/models", modelsRouter);
app.use("/api/me", meRouter);
app.use("/api/avatars", avatarsRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/template-renders", templateRendersRouter);
app.use("/api/admin/templates", adminTemplatesRouter);

// Turn multer upload failures into clean 400s (mounted after all routers).
app.use(uploadErrorHandler);

async function start() {
  await ensureBucket().catch((err) => {
    console.error("⚠️  Could not ensure object-store bucket exists:", err.message);
  });
  app.listen(env.PORT, () => {
    console.log(`🚀 Backend listening on ${env.BACKEND_URL} (port ${env.PORT}) Started`);
  });
}

start();
