import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { BrandLink, PageMain } from "../../shared/components/chrome.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { Button } from "../../shared/ui/button.tsx";
import { canEnter, homeFor, type StaffArea } from "./access.ts";
import { sessionStore, useSession } from "./session.ts";

export function StaffGate({ area, children }: { area: StaffArea; children: ReactNode }) {
  const messages = useMessages();
  const session = useSession();
  const location = useLocation();
  if (!session) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (!canEnter(session, area)) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <BrandLink />
            <Link className="text-sm text-primary" to={homeFor(session)}>{messages.cabinet.toVenue}</Link>
          </div>
        </header>
        <PageMain className="mx-auto grid max-w-3xl gap-4 px-4 py-10">
          <h1 className="font-display text-4xl">{messages.admin.title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-warning">{messages.cabinet.wrongRole}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={homeFor(session)}>{messages.cabinet.toVenue}</Link>
            </Button>
            <Button variant="outline" onClick={() => sessionStore.logout()}>
              {messages.cabinet.logout}
            </Button>
          </div>
        </PageMain>
      </div>
    );
  }
  return children;
}
