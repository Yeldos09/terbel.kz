import { Link } from "react-router";
import { PageMain } from "../shared/components/chrome.tsx";
import { useMessages } from "../shared/i18n/context.ts";
import { Button } from "../shared/ui/button.tsx";

export function NotFoundPage() {
  const messages = useMessages();
  return (
    <PageMain className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
      <p className="text-sm font-semibold text-primary">{messages.brand}</p>
      <h1 className="mt-3 font-display text-4xl">{messages.notFound.title}</h1>
      <p className="mt-3 text-muted-foreground">{messages.notFound.text}</p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link to="/">{messages.notFound.home}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/demo">{messages.nav.demo}</Link>
        </Button>
      </div>
    </PageMain>
  );
}
