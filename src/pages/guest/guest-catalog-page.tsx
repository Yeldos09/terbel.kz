import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useDemoDb } from "../../app/hooks.ts";
import { tracksForVenue, venueBySlug } from "../../domain/selectors.ts";
import type { Track } from "../../domain/types.ts";
import { OrderForm } from "../../features/ordering/order-form.tsx";
import { BrandLink, PageMain } from "../../shared/components/chrome.tsx";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { TrackSkeleton } from "../../shared/components/chrome.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { useDebouncedValue } from "../../shared/hooks/use-debounced-value.ts";
import { formatDuration, formatKzt, interpolate } from "../../shared/lib/format.ts";
import { cn } from "../../shared/lib/utils.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../shared/ui/dialog.tsx";
import { EmptyState } from "../../shared/ui/misc.tsx";
import { Input } from "../../shared/ui/field.tsx";

export function GuestCatalogPage() {
  const { venueSlug = "" } = useParams();
  const messages = useMessages();
  const navigate = useNavigate();
  const db = useDemoDb();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [genre, setGenre] = useState("all");
  const [track, setTrack] = useState<Track | null>(null);
  const venue = db.data ? venueBySlug(db.data, venueSlug) : null;
  const tracks = useMemo(() => {
    if (!db.data || !venue) return [];
    const needle = debounced.trim().toLocaleLowerCase("ru-KZ");
    return tracksForVenue(db.data, venue.id, true).filter((item) => {
      const genreOk = genre === "all" || item.genre === genre;
      const text = `${item.title} ${item.artist}`.toLocaleLowerCase("ru-KZ");
      return genreOk && (needle.length === 0 || text.includes(needle));
    });
  }, [db.data, venue, debounced, genre]);
  const genres = useMemo(() => {
    if (!db.data || !venue) return [];
    return [...new Set(tracksForVenue(db.data, venue.id, true).map((item) => item.genre))];
  }, [db.data, venue]);

  if (!db.data) {
    return (
      <PageMain className="mx-auto max-w-lg px-4 py-6">
        <TrackSkeleton />
      </PageMain>
    );
  }
  if (!venue) {
    return (
      <PageMain className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title={messages.guest.missing}
          text={messages.notFound.text}
          action={<Button asChild><Link to="/demo">{messages.guest.toDemo}</Link></Button>}
        />
      </PageMain>
    );
  }

  const searching = query !== debounced;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <BrandLink />
          <Link to="/demo" className="text-sm text-muted-foreground">{messages.nav.demo}</Link>
        </div>
      </header>
      <PageMain className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-5 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-faint">{venue.city} · {messages.kind[venue.kind]}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl">{venue.name}</h1>
            <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-bold text-primary">{messages.mode[venue.mode]}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-subtle">{venue.greeting}</p>
          <p className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-3 text-sm leading-6">
            <span className="font-semibold">{messages.mode[venue.mode]}.</span> {messages.modeHint[venue.mode]}
            {" "}
            {venue.mode === "DJ"
              ? interpolate(messages.guest.rulesDj, { min: formatKzt(venue.minBidKzt) })
              : messages.guest.rulesBox}
          </p>
          {!venue.isOpen ? <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">{messages.guest.closed}</p> : null}
          <label className="mt-5 block text-sm" htmlFor="catalog-search">
            <span className="sr-only">{messages.guest.search}</span>
            <Input
              id="catalog-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={messages.guest.search}
            />
          </label>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={messages.venue.genres}>
            <FilterChip active={genre === "all"} onClick={() => setGenre("all")}>{messages.guest.allGenres}</FilterChip>
            {genres.map((item) => (
              <FilterChip key={item} active={genre === item} onClick={() => setGenre(item)}>{item}</FilterChip>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            {searching ? <TrackSkeleton /> : null}
            {!searching && tracks.length === 0 ? (
              <EmptyState title={messages.emptyTitle} text={messages.guest.empty} />
            ) : null}
            {!searching
              ? tracks.map((item) => (
                <article key={item.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  <CoverArt title={item.title} artist={item.artist} hue={item.coverHue} coverUrl={item.coverUrl} className="h-16 w-16 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{item.title}</h2>
                    <p className="truncate text-sm text-muted-foreground">{item.artist} · {item.genre}</p>
                    <p className="text-xs text-faint">{formatDuration(item.durationSec)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-primary">
                        {venue.mode === "JUKEBOX" ? formatKzt(item.priceKzt) : `${messages.guest.from} ${formatKzt(venue.minBidKzt)}`}
                      </p>
                      <Button size="sm" onClick={() => setTrack(item)} disabled={!venue.isOpen}>
                        {messages.guest.order}
                      </Button>
                    </div>
                  </div>
                </article>
              ))
              : null}
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-muted p-4 md:sticky md:top-4">
          <h2 className="font-display text-xl">{messages.mode[venue.mode]}</h2>
          <p className="mt-2 text-sm leading-6 text-subtle">
            {venue.mode === "DJ"
              ? interpolate(messages.guest.rulesDj, { min: formatKzt(venue.minBidKzt) })
              : messages.guest.rulesBox}
          </p>
          <p className="mt-3 text-xs text-faint">{messages.guest.yourRequests}</p>
          <p className="mt-4 text-xs text-faint">{messages.timezone}</p>
        </aside>
      </PageMain>
      <Dialog open={Boolean(track)} onOpenChange={(open) => { if (!open) setTrack(null); }}>
        <DialogContent>
          {track ? (
            <>
              <DialogTitle>{messages.guest.sheetTitle}</DialogTitle>
              <DialogDescription>
                {track.title} — {track.artist}
              </DialogDescription>
              <div className="mt-4">
                <OrderForm
                  key={track.id}
                  venue={venue}
                  track={track}
                  onDone={(result) => {
                    setTrack(null);
                    if (result.kind === "request") navigate(`/request/${result.id}`);
                    else navigate(`/v/${venue.slug}/checkout/${result.id}`);
                  }}
                />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-sm",
        active ? "bg-primary font-semibold text-primary-foreground" : "bg-accent",
      )}
    >
      {children}
    </button>
  );
}
