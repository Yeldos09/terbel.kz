import { Link, useParams } from "react-router";
import { useDemoDb } from "../../app/hooks.ts";
import { requestView } from "../../domain/selectors.ts";
import type { RequestStatus } from "../../domain/types.ts";
import { BrandLink, PageMain, PageSkeleton } from "../../shared/components/chrome.tsx";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { PaymentBadge, StatusBadge } from "../../shared/components/status-badge.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { formatDateTime, formatKzt, interpolate } from "../../shared/lib/format.ts";
import { cn } from "../../shared/lib/utils.ts";
import { Button } from "../../shared/ui/button.tsx";
import { EmptyState } from "../../shared/ui/misc.tsx";

const FLOW: RequestStatus[] = ["PENDING", "ACCEPTED", "QUEUED", "PLAYING", "COMPLETED"];

export function RequestStatusPage() {
  const { requestId = "" } = useParams();
  const messages = useMessages();
  const db = useDemoDb(4_000);
  if (!db.data) return <PageSkeleton />;
  const view = requestView(db.data, requestId);
  if (!view) {
    return (
      <PageMain className="mx-auto max-w-lg px-4 py-16">
        <EmptyState title={messages.tracker.missing} text={messages.notFound.text} action={<Button asChild><Link to="/demo">{messages.nav.demo}</Link></Button>} />
      </PageMain>
    );
  }
  const { request, venue } = view;
  const terminal = request.status === "REJECTED" || request.status === "EXPIRED";
  const stepIndex = FLOW.indexOf(request.status);
  const note =
    request.decisionCode === "dj_rejected"
      ? messages.decision.dj_rejected
      : request.decisionCode === "expired"
        ? messages.decision.expired
        : request.paymentStatus === "MOCK_PAID"
          ? messages.decision.paid
          : request.mode === "DJ"
            ? messages.decision.hold
            : "";

  return (
    <div className="min-h-dvh bg-[#09090b]">
      <header className="border-b border-white/10 px-4 py-3">
        <BrandLink />
      </header>
      <PageMain className="mx-auto max-w-lg px-4 py-6">
        <p className="text-sm text-zinc-400">{venue?.name}</p>
        <h1 className="mt-1 font-display text-3xl">{messages.tracker.title}</h1>
        <div className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-[#121216] p-4">
          <CoverArt title={request.trackTitle} artist={request.trackArtist} hue={request.coverHue} coverUrl={request.coverUrl} className="h-16 w-16 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{request.trackTitle}</p>
            <p className="truncate text-sm text-zinc-400">{request.trackArtist}</p>
            <p className="mt-1 text-sm">{formatKzt(request.amountKzt)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status={request.status} />
          <PaymentBadge status={request.paymentStatus} />
        </div>
        {request.status === "PLAYING" ? <p className="mt-4 text-lg font-semibold text-primary">{messages.tracker.now}</p> : null}
        {request.status === "QUEUED" && view.position ? (
          <p className="mt-4 text-lg font-semibold">{interpolate(messages.tracker.position, { position: view.position })}</p>
        ) : null}
        {request.status === "PENDING" ? <p className="mt-4 text-sm text-zinc-300">{messages.tracker.waiting}</p> : null}
        {request.status === "ACCEPTED" ? <p className="mt-4 text-sm text-zinc-300">{messages.tracker.accepted}</p> : null}
        {request.status === "COMPLETED" ? <p className="mt-4 text-sm text-zinc-300">{messages.tracker.done}</p> : null}
        {note ? <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm leading-6 text-zinc-200">{note}</p> : null}
        <p className="mt-4 text-xs text-zinc-500">{formatDateTime(request.updatedAt)} · {messages.timezone}</p>
        {!terminal ? (
          <ol className="mt-6 grid gap-2" aria-label={messages.tracker.path}>
            {FLOW.map((status, index) => {
              const done = stepIndex >= index;
              return (
                <li key={status} className={cn("rounded-lg px-3 py-2 text-sm", done ? "bg-primary/15 text-primary" : "bg-white/5 text-zinc-500")}>
                  {messages.status[status]}
                </li>
              );
            })}
          </ol>
        ) : null}
        {venue ? (
          <Button asChild variant="outline" className="mt-6">
            <Link to={`/v/${venue.slug}`}>{messages.tracker.catalog}</Link>
          </Button>
        ) : null}
      </PageMain>
    </div>
  );
}
