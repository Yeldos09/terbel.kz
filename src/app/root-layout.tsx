import { Suspense, useEffect } from "react";
import { Outlet, useRouteError, Link } from "react-router";
import { toast, Toaster } from "sonner";
import { repository } from "../mocks/repository.ts";
import { CommandPalette } from "../shared/components/command-palette.tsx";
import { PageMain } from "../shared/components/chrome.tsx";
import { PageSkeleton } from "../shared/components/chrome.tsx";
import { useMessages } from "../shared/i18n/context.ts";
import { Button } from "../shared/ui/button.tsx";

function RecoveryNotice() {
  const messages = useMessages();
  useEffect(() => {
    if (repository.consumeRecovery()) toast.message(messages.toast.recovered);
  }, [messages.toast.recovered]);
  return null;
}

export function RootLayout() {
  const messages = useMessages();
  return (
    <>
      <a className="skip-link" href="#content">
        {messages.skip}
      </a>
      <RecoveryNotice />
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
      <CommandPalette />
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </>
  );
}

export function RootError() {
  const messages = useMessages();
  const error = useRouteError();
  const detail = error instanceof Error ? error.message : messages.errors.unknown;
  return (
    <PageMain className="mx-auto max-w-lg px-4 py-20">
      <p className="text-sm text-primary">{messages.demoBadge}</p>
      <h1 className="mt-2 font-display text-3xl">{messages.errors.unknown}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
      <Button asChild className="mt-6">
        <Link to="/">{messages.notFound.home}</Link>
      </Button>
    </PageMain>
  );
}
