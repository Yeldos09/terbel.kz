import { Suspense, useEffect } from "react";
import { Outlet, useRouteError, Link } from "react-router";
import { toast, Toaster } from "sonner";
import { repository } from "../mocks/repository.ts";
import { useDemoDb } from "./hooks.ts";
import { sessionStore, useSession } from "../features/auth/session.ts";
import { useTheme } from "./theme-context.ts";
import { CommandPalette } from "../shared/components/command-palette.tsx";
import { PageMain } from "../shared/components/chrome.tsx";
import { PageSkeleton } from "../shared/components/chrome.tsx";
import { ThemeSwitch } from "../shared/components/locale-and-reset.tsx";
import { useMessages } from "../shared/i18n/context.ts";
import { Button } from "../shared/ui/button.tsx";

function SessionSync() {
  const db = useDemoDb();
  const session = useSession();
  useEffect(() => {
    if (!session || !db.data) return;
    if (!db.data.accounts.some((account) => account.id === session.accountId)) sessionStore.logout();
  }, [db.data, session]);
  return null;
}

function RecoveryNotice() {
  const messages = useMessages();
  useEffect(() => {
    if (repository.consumeRecovery()) toast.message(messages.toast.recovered);
  }, [messages.toast.recovered]);
  return null;
}

export function RootLayout() {
  const messages = useMessages();
  const { theme } = useTheme();
  return (
    <>
      <a className="skip-link" href="#content">
        {messages.skip}
      </a>
      <RecoveryNotice />
      <SessionSync />
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
      <div className="fixed bottom-4 left-4 z-40 rounded-full border border-border bg-card px-3 py-2 shadow-lg">
        <ThemeSwitch />
      </div>
      <CommandPalette />
      <Toaster theme={theme} position="top-center" richColors closeButton />
    </>
  );
}

export function RootError() {
  const messages = useMessages();
  const error = useRouteError();
  const detail = error instanceof Error ? error.message : messages.errors.unknown;
  return (
    <PageMain className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-display text-3xl">{messages.errors.unknown}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
      <Button asChild className="mt-6">
        <Link to="/">{messages.notFound.home}</Link>
      </Button>
    </PageMain>
  );
}
