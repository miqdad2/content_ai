import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { useMe } from "@/lib/useMe";
import { AuthModal } from "./AuthModal";

const NAV_LINKS = [
  { to: "/", label: "Video" },
  { to: "/image", label: "Image" },
  { to: "/face-swap", label: "Face Swap" },
  { to: "/user/templates", label: "Templates" },
  { to: "/user/avatar", label: "Avatar" },
];

export function Navbar() {
  const { data: session, isPending } = useSession();
  const { me } = useMe();
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();

  const links = me?.isAdmin
    ? [...NAV_LINKS, { to: "/admin/template/create", label: "Admin" }]
    : NAV_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <VideoIcon className="h-5 w-5" />
            Video Arena
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  location.pathname === to
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
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
                <span className="hidden text-sm sm:inline">{session.user.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
