import { useMemo, useState } from "react";
import { Link, Outlet } from "react-router";
import { toast } from "sonner";
import { useActiveVenue, useDemoDb } from "../../app/hooks.ts";
import { queueViews } from "../../domain/selectors.ts";
import type { RequestStatus } from "../../domain/types.ts";
import { QueueBoard } from "../../features/queue/queue-board.tsx";
import { RequestActions } from "../../features/requests/request-actions.tsx";
import { repository } from "../../mocks/repository.ts";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { StatusBadge } from "../../shared/components/status-badge.tsx";
import { WorkShell } from "../../shared/components/work-shell.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { useDebouncedValue } from "../../shared/hooks/use-debounced-value.ts";
import { formatDateTime, formatKzt, formatNumber } from "../../shared/lib/format.ts";
import { appUrl, cn } from "../../shared/lib/utils.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Input } from "../../shared/ui/field.tsx";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../../shared/ui/menu.tsx";
import { EmptyState, Skeleton } from "../../shared/ui/misc.tsx";

function useDjNav() {
  const messages = useMessages();
  return [
    { to: "/dj", label: messages.nav.overview, end: true },
    { to: "/dj/requests", label: messages.nav.requests },
    { to: "/dj/queue", label: messages.nav.queue },
    { to: "/dj/history", label: messages.nav.history },
  ];
}

export function DjLayout() {
  const messages = useMessages();
  const { query, venue } = useActiveVenue("dj");
  const nav = useDjNav();
  return (
    <WorkShell
      tone="dj"
      title={messages.dj.title}
      lead={messages.dj.lead}
      items={nav}
      aside={
        query.data && venue ? (
          <div className="grid gap-2">
            <p className="text-xs text-zinc-500" id="dj-venue-label">{messages.dj.venueLabel}</p>
            <Menu>
              <MenuTrigger asChild>
                <Button variant="outline" aria-labelledby="dj-venue-label">{venue.name}</Button>
              </MenuTrigger>
              <MenuContent>
                {query.data.venues.map((item) => (
                  <MenuItem
                    key={item.id}
                    onSelect={() => {
                      repository.setActiveDjVenue(item.id);
                      toast.success(messages.toast.venueSwitched);
                    }}
                  >
                    {item.name} · {messages.mode[item.mode]}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            <p className="text-xs text-zinc-500">{messages.timezone}</p>
            <Button asChild size="sm" variant="secondary">
              <Link to={`/v/${venue.slug}`}>{messages.demo.openGuest}</Link>
            </Button>
          </div>
        ) : null
      }
    >
      {query.isPending ? <Skeleton className="h-40 w-full" /> : <Outlet />}
    </WorkShell>
  );
}

export function DjHomePage() {
  const messages = useMessages();
  const { venue } = useActiveVenue("dj");
  const db = useDemoDb();
  if (!db.data || !venue) return null;
  const rows = db.data.requests.filter((request) => request.venueId === venue.id);
  const pending = rows.filter((request) => request.status === "PENDING" || request.status === "ACCEPTED");
  const playing = queueViews(db.data, venue.id).find((row) => row.request.status === "PLAYING");
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label={messages.dj.pending} value={formatNumber(pending.length)} />
        <Metric label={messages.nav.queue} value={formatNumber(queueViews(db.data, venue.id).length)} />
        <Metric label={messages.admin.columnRequests} value={formatNumber(rows.length)} />
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#101114] p-4">
        <h2 className="font-display text-2xl">{messages.dj.now}</h2>
        {playing ? (
          <p className="mt-2">
            {playing.request.trackTitle} — {playing.request.trackArtist}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">{messages.dj.emptyQueue}</p>
        )}
        <Button
          className="mt-3"
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(appUrl(`/v/${venue.slug}`)).then(
              () => toast.success(messages.toast.copied),
              () => toast.error(messages.toast.copyFailed),
            );
          }}
        >
          {messages.dj.guestLink}
        </Button>
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl">{messages.dj.pending}</h2>
        {pending.length === 0 ? <EmptyState title={messages.dj.emptyRequests} text={messages.dj.lead} /> : null}
        {pending.slice(0, 3).map((request) => (
          <article key={request.id} className="rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />
              <span className="font-semibold">{request.trackTitle}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {request.guestName} · {formatKzt(request.amountKzt)} · {formatDateTime(request.createdAt)}
            </p>
            <div className="mt-3">
              <RequestActions request={request} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export function DjRequestsPage() {
  const messages = useMessages();
  const { venue } = useActiveVenue("dj");
  const db = useDemoDb();
  const [filter, setFilter] = useState<"all" | "PENDING" | "ACCEPTED">("all");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const rows = useMemo(() => {
    if (!db.data || !venue) return [];
    const needle = debounced.trim().toLocaleLowerCase("ru-KZ");
    return db.data.requests
      .filter((request) => request.venueId === venue.id)
      .filter((request) => request.status === "PENDING" || request.status === "ACCEPTED")
      .filter((request) => filter === "all" || request.status === filter)
      .filter((request) => {
        const text = `${request.guestName} ${request.trackTitle} ${request.trackArtist}`.toLocaleLowerCase("ru-KZ");
        return needle.length === 0 || text.includes(needle);
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [db.data, venue, filter, debounced]);
  if (!venue) return null;
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl">{messages.nav.requests}</h1>
      <label htmlFor="dj-search" className="text-sm">
        {messages.dj.search}
        <Input id="dj-search" className="mt-1" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label={messages.dj.filter}>
        {(["all", "PENDING", "ACCEPTED"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={cn("cursor-pointer rounded-full px-3 py-1.5 text-sm", filter === item ? "bg-primary text-primary-foreground" : "bg-white/10")}
          >
            {item === "all" ? messages.dj.all : messages.status[item]}
          </button>
        ))}
      </div>
      {query !== debounced ? <Skeleton className="h-24 w-full" /> : null}
      {query === debounced && rows.length === 0 ? (
        <EmptyState
          title={messages.dj.emptyRequests}
          text={messages.dj.lead}
          action={<Button asChild><Link to={`/v/${venue.slug}`}>{messages.demo.openGuest}</Link></Button>}
        />
      ) : null}
      <div className="grid gap-3">
        {query === debounced
          ? rows.map((request) => (
            <article key={request.id} className="rounded-2xl border border-white/10 bg-[#101114] p-4">
              <div className="flex gap-3">
                <CoverArt title={request.trackTitle} artist={request.trackArtist} hue={request.coverHue} coverUrl={request.coverUrl} className="h-14 w-14" />
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={request.status} />
                    <span className="font-semibold">{request.trackTitle}</span>
                  </div>
                  <p className="text-sm text-zinc-400">{request.trackArtist}</p>
                  <p className="text-sm">
                    {request.guestName} · {venue.tableLabel} {request.tableLabel} · {formatKzt(request.amountKzt)}
                  </p>
                  {request.note ? <p className="text-sm text-zinc-300">«{request.note}»</p> : null}
                  <p className="text-xs text-zinc-500">{formatDateTime(request.createdAt)}</p>
                </div>
              </div>
              <div className="mt-3">
                <RequestActions request={request} />
              </div>
            </article>
          ))
          : null}
      </div>
    </div>
  );
}

export function DjQueuePage() {
  const messages = useMessages();
  const { venue } = useActiveVenue("dj");
  if (!venue) return null;
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl">{messages.nav.queue}</h1>
      <p className="text-sm text-zinc-400">{messages.dj.drag}</p>
      <QueueBoard venueId={venue.id} guestPath={`/v/${venue.slug}`} />
    </div>
  );
}

const HISTORY: Array<RequestStatus | "all"> = ["all", "PLAYING", "QUEUED", "COMPLETED", "REJECTED", "EXPIRED"];

export function DjHistoryPage() {
  const messages = useMessages();
  const { venue } = useActiveVenue("dj");
  const db = useDemoDb();
  const [filter, setFilter] = useState<(typeof HISTORY)[number]>("all");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const rows = useMemo(() => {
    if (!db.data || !venue) return [];
    const needle = debounced.trim().toLocaleLowerCase("ru-KZ");
    return db.data.requests
      .filter((request) => request.venueId === venue.id)
      .filter((request) => filter === "all" || request.status === filter)
      .filter((request) => `${request.guestName} ${request.trackTitle}`.toLocaleLowerCase("ru-KZ").includes(needle))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [db.data, venue, filter, debounced]);
  if (!venue) return null;
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl">{messages.nav.history}</h1>
      <p className="text-sm text-zinc-400">{messages.dj.historyLead}</p>
      <label htmlFor="history-search" className="text-sm">
        {messages.dj.search}
        <Input id="history-search" className="mt-1" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {HISTORY.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={cn("cursor-pointer rounded-full px-3 py-1.5 text-sm", filter === item ? "bg-primary text-primary-foreground" : "bg-white/10")}
          >
            {item === "all" ? messages.dj.all : messages.status[item]}
          </button>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState title={messages.dj.emptyHistory} text={messages.dj.historyLead} /> : null}
      <ul className="grid gap-2">
        {rows.map((request) => (
          <li key={request.id}>
            <Link to={`/request/${request.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-3 hover:bg-white/5">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{request.trackTitle}</span>
                <span className="block text-sm text-zinc-400">{request.guestName} · {formatDateTime(request.updatedAt)}</span>
              </span>
              <StatusBadge status={request.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101114] p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 font-display text-3xl text-primary">{value}</p>
    </div>
  );
}
