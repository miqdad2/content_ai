import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Coins, LogOut, Menu, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { useMe } from "@/lib/useMe";
import { isPublicRoute } from "@/lib/publicRoutes";
import { AuthModal } from "./AuthModal";
import { Logo } from "./Logo";
import { DemoBadge } from "./DemoBadge";

interface NavLink {
  to: string;
  label: string;
  badge?: string;
}

const NAV_LINKS: NavLink[] = [
  { to: "/", label: "Explore" },
  { to: "/video", label: "Video" },
  { to: "/image", label: "Image" },
  { to: "/user/templates", label: "Templates", badge: "New" },
  { to: "/user/avatar", label: "Avatar" },
];

/**
 * Public shell nav links. `/departments` shipped in UNIT 05 (Department
 * Universe). "Pricing" still temporarily points at the existing `/billing`
 * page rather than a not-yet-built `/pricing` route — safe because
 * BillingPage already renders a friendly signed-out prompt (`SignedOut`)
 * for anonymous visitors instead of anything broken or exposing account
 * data. A dedicated public pricing page belongs to UNIT 10.
 */
const PUBLIC_NAV_LINKS: NavLink[] = [
  { to: "/", label: "Home" },
  { to: "/departments", label: "Departments" },
  { to: "/billing", label: "Pricing" },
];

function NavItem({
  to,
  label,
  badge,
  active,
  onClick,
  block,
}: {
  to: string;
  label: string;
  badge?: string;
  active: boolean;
  onClick?: () => void;
  block?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-(--duration-control) ease-(--ease-standard)",
        block ? "min-h-11 w-full" : "shrink-0",
        active
          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(140,190,255,0.28)]"
          : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      {badge && (
        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}

/** Minimal-link variant for the public shell — no pill background, just a
 * color shift, per the "compact / minimal links" client reference. Active
 * state is communicated by an underline bar in addition to color (UNIT 05
 * fix for UNIT 03's color-only active-state gap) — `aria-current="page"`
 * covers the accessible-name side of the same requirement. */
function PublicNavItem({
  to,
  label,
  active,
  onClick,
  block,
}: {
  to: string;
  label: string;
  active: boolean;
  onClick?: () => void;
  block?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-(--duration-control) ease-(--ease-standard)",
        block ? "min-h-11 w-full justify-center" : "shrink-0",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-3.5 -bottom-0.5 h-px rounded-full bg-primary transition-opacity duration-(--duration-control) ease-(--ease-standard)",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </Link>
  );
}

export function Navbar({ variant }: { variant?: "public" | "app" }) {
  const location = useLocation();
  const isPublic = variant ? variant === "public" : isPublicRoute(location.pathname);

  return isPublic ? <PublicNavbar /> : <AppNavbar />;
}

/**
 * Cinematic public shell — floating, compact, black/navy glass with a
 * subtle electric-blue rim (see `.glass-nav` in index.css). Deliberately
 * minimal: logo, two links, one primary CTA — not the dense tool nav the
 * authenticated shell uses. Renders on `/`, `/login`, `/privacy`, `/refund`,
 * `/terms` (see `src/lib/publicRoutes.ts`).
 */
function PublicNavbar() {
  const { data: session, isPending } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);
  const signedIn = Boolean(session?.user);

  function PublicAuthCluster({ stacked }: { stacked?: boolean }) {
    if (isPending) return null;
    if (signedIn) {
      return (
        <Button asChild className={cn("rounded-full", stacked ? "w-full" : "px-5")} onClick={closeMobile}>
          <Link to="/video">
            Enter cre8.ai
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      );
    }
    return (
      <div className={cn("flex items-center gap-3", stacked && "w-full flex-col items-stretch gap-2")}>
        <button
          type="button"
          onClick={() => {
            setAuthOpen(true);
            closeMobile();
          }}
          className={cn(
            "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            stacked && "text-center",
          )}
        >
          Login
        </button>
        <Button
          className={cn("rounded-full", stacked ? "w-full" : "px-5")}
          onClick={() => {
            setAuthOpen(true);
            closeMobile();
          }}
        >
          Enter cre8.ai
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-4 lg:px-6">
      <div className="glass-nav glass-edge relative mx-auto flex h-14 max-w-[1600px] items-center gap-4 overflow-hidden rounded-full px-4 lg:gap-6 lg:px-6">
        <Link to="/" className="relative z-10 flex shrink-0 items-center" onClick={closeMobile}>
          <Logo />
        </Link>
        <span className="relative z-10">
          <DemoBadge />
        </span>

        {/* Desktop nav */}
        <nav className="relative z-10 hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {PUBLIC_NAV_LINKS.map(({ to, label }) => (
            <PublicNavItem key={to} to={to} label={label} active={location.pathname === to} />
          ))}
        </nav>

        <div className="relative z-10 ml-auto hidden shrink-0 items-center gap-3 lg:flex">
          <PublicAuthCluster />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="relative z-10 ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel — floating elevated sheet just below the bar */}
      {mobileOpen && (
        <div className="glass-nav glass-edge relative mx-auto mt-2 max-w-[1600px] overflow-hidden rounded-3xl lg:hidden">
          <nav className="relative z-10 flex flex-col gap-1 p-3">
            {PUBLIC_NAV_LINKS.map(({ to, label }) => (
              <PublicNavItem
                key={to}
                to={to}
                label={label}
                active={location.pathname === to}
                onClick={closeMobile}
                block
              />
            ))}
          </nav>
          <div className="relative z-10 border-t border-glass-border-elevated p-3">
            <PublicAuthCluster stacked />
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}

/** Authenticated app shell — unchanged from the pre-UNIT-03 implementation.
 * Tool links, credits pill, account cluster, admin link. Renders on every
 * route not covered by `isPublicRoute` (video/image/face-swap/templates/
 * avatar/generation/billing/admin). */
function AppNavbar() {
  const { data: session, isPending } = useSession();
  const { me } = useMe();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const links: NavLink[] = me?.isAdmin
    ? [...NAV_LINKS, { to: "/admin/template/create", label: "Admin" }]
    : NAV_LINKS;

  const closeMobile = () => setMobileOpen(false);

  function AuthCluster({ stacked }: { stacked?: boolean }) {
    if (isPending) return null;
    if (session?.user) {
      return (
        <div className={cn("flex items-center gap-3", stacked && "w-full flex-col items-stretch gap-2")}>
          <Link
            to="/billing"
            onClick={closeMobile}
            title="Credits & billing"
            className={cn(
              "glass-light flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/[0.06]",
              location.pathname === "/billing" && "border-primary/40 text-primary",
              stacked && "justify-center",
            )}
          >
            <Coins className="h-4 w-4 text-primary" />
            <span className="tabular-nums">{me?.credits ?? 0}</span>
            <span className={cn("text-muted-foreground", !stacked && "hidden sm:inline")}>credits</span>
          </Link>
          <div className={cn("flex items-center gap-2", stacked && "justify-center")}>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                {session.user.name?.charAt(0).toUpperCase() ?? "U"}
              </div>
            )}
            <span className="max-w-28 truncate text-sm">{session.user.name}</span>
          </div>
          <Button
            variant="ghost"
            size={stacked ? "default" : "icon"}
            onClick={() => {
              signOut();
              closeMobile();
            }}
            className={stacked ? "justify-start gap-2" : undefined}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            {stacked && "Sign out"}
          </Button>
        </div>
      );
    }
    return (
      <div className={cn("flex items-center gap-3", stacked && "w-full flex-col items-stretch gap-2")}>
        <Link
          to="/billing"
          onClick={closeMobile}
          className={cn(
            "glass-light relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.06]",
            !stacked && "hidden sm:flex",
            stacked && "justify-center",
          )}
        >
          <Tag className="h-3.5 w-3.5" />
          Pricing
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-2 px-1.5 py-px text-[9px] font-bold leading-none text-white">
            30% OFF
          </span>
        </Link>
        {!stacked && <span className="hidden h-5 w-px bg-border sm:block" />}
        <button
          type="button"
          onClick={() => {
            setAuthOpen(true);
            closeMobile();
          }}
          className={cn(
            "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            stacked && "text-center",
          )}
        >
          Login
        </button>
        <Button
          className={cn("rounded-full", stacked ? "w-full" : "px-5")}
          onClick={() => {
            setAuthOpen(true);
            closeMobile();
          }}
        >
          Sign up
        </Button>
      </div>
    );
  }

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-4 lg:px-6">
      <div className="glass-ambient glass-edge relative mx-auto flex h-14 max-w-[1600px] items-center gap-4 overflow-hidden rounded-full px-4 lg:gap-6 lg:px-6">
        <Link to="/" className="relative z-10 flex shrink-0 items-center" onClick={closeMobile}>
          <Logo />
        </Link>
        <span className="relative z-10">
          <DemoBadge />
        </span>

        {/* Desktop nav */}
        <nav className="relative z-10 hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          {links.map(({ to, label, badge }) => (
            <NavItem key={to} to={to} label={label} badge={badge} active={location.pathname === to} />
          ))}
        </nav>

        <div className="relative z-10 ml-auto hidden shrink-0 items-center gap-3 lg:flex">
          <AuthCluster />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="relative z-10 ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile panel — floating elevated sheet just below the bar */}
      {mobileOpen && (
        <div className="glass-elevated glass-edge relative mx-auto mt-2 max-w-[1600px] overflow-hidden rounded-3xl lg:hidden">
          <nav className="relative z-10 flex flex-col gap-1 p-3">
            {links.map(({ to, label, badge }) => (
              <NavItem
                key={to}
                to={to}
                label={label}
                badge={badge}
                active={location.pathname === to}
                onClick={closeMobile}
                block
              />
            ))}
          </nav>
          <div className="relative z-10 border-t border-glass-border-elevated p-3">
            <AuthCluster stacked />
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
