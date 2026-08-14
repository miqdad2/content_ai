import { useLocation } from "react-router-dom";
import { isPublicRoute } from "@/lib/publicRoutes";

/**
 * Very low-opacity, CSS-only star field shown behind public pages only
 * (landing, login, legal). Purely decorative: fixed, non-interactive, and
 * z-indexed behind all content — establishes the "subtle space texture"
 * part of the public shell without any per-page changes. Authenticated app
 * pages intentionally do not render this (see AGENTS.md's public-vs-
 * authenticated design split — cinematic treatment is for public/marketing
 * surfaces, not daily-use workspaces).
 */
export function PublicBackdrop() {
  const location = useLocation();
  if (!isPublicRoute(location.pathname)) return null;
  return (
    <div
      aria-hidden="true"
      className="cre8-space-field pointer-events-none fixed inset-0 -z-10"
    />
  );
}
