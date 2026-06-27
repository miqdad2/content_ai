import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middleware/requireAuth.js";
import { resolveIsAdmin } from "../middleware/requireAdmin.js";

export const meRouter: Router = Router();

// Current user's profile + admin status (used by the frontend to gate admin UI).
meRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const isAdmin = await resolveIsAdmin(req.userId!, req.userEmail);
  res.json({ id: req.userId, email: req.userEmail, isAdmin });
});
