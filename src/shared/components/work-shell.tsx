import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { BrandLink, PageMain } from "./chrome.tsx";
import { cn } from "../lib/utils.ts";

export function WorkShell({
  title,
  lead,
  items,
  aside,
  children,
}: {
  title: string;
  lead: string;
  items: { to: string; label: string; end?: boolean }[];
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <BrandLink />
          <div className="min-w-0 text-right">
            <p className="font-display text-lg leading-none">{title}</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">{lead}</p>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <div className="grid gap-4">
          <nav aria-label={title} className="flex gap-2 overflow-x-auto lg:flex-col">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-subtle hover:bg-accent",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {aside}
        </div>
        <PageMain className="min-w-0">{children}</PageMain>
      </div>
    </div>
  );
}
