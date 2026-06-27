import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Images,
  LayoutTemplate,
  LogOut,
  Sparkles,
  UserRound,
  Video as VideoIcon,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { useMe } from "@/lib/useMe";
import { AuthModal } from "./AuthModal";

const NAV_LINKS = [
  { to: "/video", label: "Video", icon: VideoIcon },
  { to: "/image", label: "Image", icon: Images },
  { to: "/face-swap", label: "Face Swap", icon: Wand2 },
  { to: "/user/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/user/avatar", label: "Avatar", icon: UserRound },
];

export function Navbar() {
  const { data: session, isPending } = useSession();
  const { me } = useMe();
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();

  const links = me?.isAdmin
    ? [
        ...NAV_LINKS,
        { to: "/admin/template/create", label: "Admin", icon: Sparkles },
      ]
    : NAV_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-violet-950/15">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Video Arena</span>
          </Link>
          <nav className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border bg-card/70 p-1 shadow-sm backdrop-blur">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  location.pathname === to
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isPending ? null : session?.user ? (
            <>
              <div className="flex items-center gap-2">
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
                <span className="hidden max-w-28 truncate text-sm sm:inline">
                  {session.user.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button className="rounded-full" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
