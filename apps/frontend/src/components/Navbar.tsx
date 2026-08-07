import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Coins, LogOut, Menu, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { useMe } from "@/lib/useMe";
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
          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(199,168,255,0.28)]"
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

export function Navbar() {
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
