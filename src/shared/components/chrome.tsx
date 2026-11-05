import { Link } from "react-router";
import type { ReactNode } from "react";
import { useMessages } from "../i18n/context.ts";
import { cn } from "../lib/utils.ts";
import { Skeleton } from "../ui/misc.tsx";

export function BrandLink({ className }: { className?: string }) {
  const messages = useMessages();
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 font-display text-lg", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        te
      </span>
      {messages.brand}
    </Link>
  );
}

export function PageMain({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main id="content" tabIndex={-1} className={className}>
      {children}
    </main>
  );
}

export function PageSkeleton() {
  const messages = useMessages();
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8" aria-busy="true">
      <p className="sr-only">{messages.loading}</p>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function TrackSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
