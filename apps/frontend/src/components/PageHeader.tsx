import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border bg-card/80 p-6 shadow-xl shadow-violet-950/5 backdrop-blur sm:p-8">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
