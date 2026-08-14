import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { isCinematicRoute } from "@/lib/publicRoutes";

const STORAGE_KEY = "va_promo_dismissed";

/**
 * Full-width primary-colored promo bar pinned above the navbar.
 * Dismissible; the choice is remembered in localStorage.
 *
 * Hidden on cinematic public routes (/ and /departments) — UNIT 04's visual
 * QA confirmed the bright bar clashes with the premium cinematic direction
 * on those two pages specifically. Still shown everywhere else (login,
 * legal, and every authenticated/commercial page), so the underlying
 * promotional messaging/behavior is unchanged, not deleted — just not
 * rendered on the two pages it visually damages.
 */
export function PromoBanner() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1",
  );
  if (dismissed || isCinematicRoute(location.pathname)) return null;

  return (
    <div className="relative z-50 flex items-center justify-center bg-primary px-10 py-2 text-primary-foreground">
      <Link
        to="/billing"
        className="group flex items-center gap-3 text-center text-sm font-semibold tracking-wide"
      >
        <span className="hidden group-hover:underline sm:inline">
          SIGN UP AND GET ADDITIONAL DISCOUNT ON PREMIUM PLANS
        </span>
        <span className="group-hover:underline sm:hidden">EXTRA DISCOUNT ON PREMIUM PLANS</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-2 px-2.5 py-0.5 text-xs font-bold text-white">
          EXTRA DISCOUNT
        </span>
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-primary-foreground/70 transition-colors hover:bg-black/10 hover:text-primary-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
