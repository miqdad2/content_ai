/**
 * Routes that render the cinematic public shell (floating nav, footer
 * platform links, subtle star-field backdrop) instead of the authenticated
 * app shell. Single source of truth for Navbar/PublicBackdrop so they can't
 * drift out of sync with each other. Keep in sync with the public routes
 * declared in App.tsx.
 */
export const PUBLIC_ROUTES = new Set(["/", "/login", "/privacy", "/refund", "/terms", "/departments"]);

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname);
}

/**
 * The subset of public routes that are full cinematic 3D experiences
 * (landing hero, department universe) rather than plain public pages
 * (login, legal). Introduced in UNIT 05: PromoBanner's bright full-width
 * bar visually clashed with these two pages specifically (confirmed via
 * UNIT 04 visual QA) — legal/login pages don't have that conflict, so they
 * keep the banner.
 */
export const CINEMATIC_ROUTES = new Set(["/", "/departments"]);

export function isCinematicRoute(pathname: string): boolean {
  return CINEMATIC_ROUTES.has(pathname);
}
