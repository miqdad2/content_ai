import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Department } from "./departments.data";

interface DepartmentInfoProps {
  department: Department;
  signedIn: boolean;
  onCtaClick: () => void;
}

/**
 * Accessible tabpanel for the active department — role, mission,
 * capability list, and a safe CTA (see UNIT 05 brief §10: every CTA either
 * enters the existing app or opens auth, never a not-yet-built route).
 * `key`'d by department id at the call site so screen readers announce the
 * panel as new content rather than a silent attribute swap.
 */
export function DepartmentInfo({ department, signedIn, onCtaClick }: DepartmentInfoProps) {
  return (
    <div
      role="tabpanel"
      id={`department-panel-${department.id}`}
      aria-labelledby={`department-tab-${department.id}`}
      tabIndex={-1}
      className="glass-strong glass-edge relative flex flex-col gap-5 rounded-3xl p-6 sm:p-8"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {department.shortLabel}
        </p>
        <h3 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{department.role}</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
          {department.mission}
        </p>
      </div>

      <ul className="flex flex-wrap gap-2" aria-label={`${department.role} capabilities`}>
        {department.capabilities.map((cap) => (
          <li
            key={cap}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-foreground/90"
          >
            {cap}
          </li>
        ))}
      </ul>

      {signedIn ? (
        <Button asChild size="lg" className="w-fit rounded-full px-6">
          <Link to="/video">
            {department.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button size="lg" className="w-fit rounded-full px-6" onClick={onCtaClick}>
          {department.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
