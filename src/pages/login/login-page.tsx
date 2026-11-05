import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useDemoDb } from "../../app/hooks.ts";
import { safeNext } from "../../features/auth/access.ts";
import { sessionStore, useSession } from "../../features/auth/session.ts";
import { BrandLink, PageMain, PageSkeleton } from "../../shared/components/chrome.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { describeError } from "../../shared/lib/describe-error.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Field, Input } from "../../shared/ui/field.tsx";

export function LoginPage() {
  const messages = useMessages();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const session = useSession();
  const db = useDemoDb();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (session) return <Navigate to={safeNext(params.get("next"), session)} replace />;
  if (!db.data) return <PageSkeleton />;

  const enter = (nextEmail: string, nextPassword: string) => {
    try {
      const next = sessionStore.login(nextEmail, nextPassword);
      toast.success(messages.toast.loggedIn);
      navigate(safeNext(params.get("next"), next));
    } catch (error) {
      toast.error(describeError(error, messages));
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <BrandLink />
          <Link className="text-sm text-muted-foreground" to="/">{messages.nav.home}</Link>
        </div>
      </header>
      <PageMain className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <div>
          <h1 className="font-display text-4xl">{messages.cabinet.loginTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{messages.cabinet.loginLead}</p>
        </div>
        <form
          className="grid max-w-md gap-4 rounded-2xl border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            enter(email, password);
          }}
        >
          <Field label={messages.cabinet.email} htmlFor="login-email">
            <Input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label={messages.cabinet.password} htmlFor="login-password">
            <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          <Button type="submit">{messages.cabinet.submit}</Button>
        </form>
      </PageMain>
    </div>
  );
}
