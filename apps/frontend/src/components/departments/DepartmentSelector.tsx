import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "./departments.data";

interface DepartmentSelectorProps {
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Horizontal layout for the mobile snap-selector; vertical for the
   * desktop sidebar list. Same accessible tablist semantics either way. */
  orientation?: "vertical" | "horizontal";
  className?: string;
}

/**
 * DOM-based department picker — a WAI-ARIA tablist. This is the primary,
 * always-available way to navigate departments (per UNIT 05 brief §6:
 * "do not require the user to click directly on tiny 3D planets"). Full
 * keyboard support: Tab to enter, Arrow keys to move + select, Home/End to
 * jump to the first/last department, matching standard tablist behavior.
 */
export function DepartmentSelector({
  activeIndex,
  onSelect,
  orientation = "vertical",
  className,
}: DepartmentSelectorProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusAndSelect(index: number) {
    const wrapped = (index + DEPARTMENTS.length) % DEPARTMENTS.length;
    onSelect(wrapped);
    buttonRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    if (e.key === nextKey) {
      e.preventDefault();
      focusAndSelect(index + 1);
    } else if (e.key === prevKey) {
      e.preventDefault();
      focusAndSelect(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusAndSelect(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusAndSelect(DEPARTMENTS.length - 1);
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Departments"
      aria-orientation={orientation}
      className={cn(
        "flex gap-2",
        orientation === "vertical" ? "flex-col" : "snap-x snap-mandatory overflow-x-auto pb-1",
        className,
      )}
    >
      {DEPARTMENTS.map((dept, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={dept.id}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`department-tab-${dept.id}`}
            aria-selected={active}
            aria-controls={`department-panel-${dept.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors duration-(--duration-control) ease-(--ease-standard)",
              orientation === "horizontal" && "snap-start",
              active
                ? "border-primary/50 bg-primary/12 text-foreground"
                : "border-transparent text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                active ? "bg-primary" : "bg-muted-foreground/40",
              )}
            />
            <span className="whitespace-nowrap">{dept.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
