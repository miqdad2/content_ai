import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const CONTACT_EMAIL = "hello@content.ai";

/**
 * Public-shell footer groups. "Pricing" points at the existing `/billing`
 * page (no dedicated `/pricing` route yet — see Navbar's PUBLIC_NAV_LINKS
 * comment for the same decision). Deliberately does not list the
 * authenticated tools (Video/Image/Templates/Avatar) — those are already
 * one click away via the app nav for signed-in users, and this is now a
 * site-wide/public-facing footer, not an in-app shortcut rail.
 */
const PLATFORM_LINKS = [
  { to: "/", label: "Home" },
  { to: "/departments", label: "Departments" },
  { to: "/billing", label: "Pricing" },
  { to: "/login", label: "Login" },
];

const LEGAL_LINKS = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/refund", label: "Refund & Cancellation" },
  { to: "/terms", label: "Terms of Service" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background">
      {/* Faint top-edge wash so the footer reads as a continuation of the
          page's atmosphere rather than a sudden flat-dark stop. Subtle by
          design — a footer, unlike the hero, should stay in the dark
          register. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32"
        style={{
          background: "linear-gradient(180deg, var(--primary) 0%, transparent 100%)",
          opacity: 0.07,
        }}
      />
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-6">
        {/* Brand */}
        <div>
          <Link to="/">
            <Logo />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            AI content generation for Kuwait &amp; GCC creators, freelancers, agencies and
            enterprises. Generate video, images, face swaps and templates in minutes.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h3 className="text-sm font-semibold">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {PLATFORM_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="transition-colors hover:text-foreground"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row lg:px-6">
          <span>© {new Date().getFullYear()} cre8.ai. All rights reserved.</span>
          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
