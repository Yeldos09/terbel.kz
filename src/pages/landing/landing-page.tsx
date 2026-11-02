import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { useDemoDb } from "../../app/hooks.ts";
import { buildAnalytics } from "../../domain/analytics.ts";
import { quickBidAmounts } from "../../domain/pricing.ts";
import { tracksForVenue, venueBySlug } from "../../domain/selectors.ts";
import type { Track, Venue, VenueMode } from "../../domain/types.ts";
import { BrandLink, PageMain } from "../../shared/components/chrome.tsx";
import { DemoWalkButtons } from "../../shared/components/demo-walk.tsx";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { LocaleSwitch, ResetDemoButton } from "../../shared/components/locale-and-reset.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { formatKzt, formatNumber } from "../../shared/lib/format.ts";
import { cn } from "../../shared/lib/utils.ts";
import { Accordion } from "../../shared/ui/accordion.tsx";
import { Button } from "../../shared/ui/button.tsx";
import { Dialog, DialogContent, DialogTitle } from "../../shared/ui/dialog.tsx";
import { Skeleton } from "../../shared/ui/misc.tsx";

export function LandingPage() {
  const messages = useMessages();
  const [mode, setMode] = useState<VenueMode>("DJ");
  const [menu, setMenu] = useState(false);
  const links = [
    [messages.nav.how, "#how"],
    [messages.nav.modes, "#modes"],
    [messages.nav.faq, "#faq"],
  ] as const;

  return (
    <div className="landing-bg min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09090b]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <BrandLink />
          <nav aria-label={messages.brand} className="hidden items-center gap-5 text-sm text-zinc-300 md:flex">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-white">
                {label}
              </a>
            ))}
            <Link to="/demo" className="hover:text-white">{messages.nav.demo}</Link>
            <Link to="/venue" className="hover:text-white">{messages.nav.venue}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="md:hidden" onClick={() => setMenu(true)}>
              {messages.nav.menu}
            </Button>
          </div>
        </div>
      </header>
      <Dialog open={menu} onOpenChange={setMenu}>
        <DialogContent>
          <DialogTitle>{messages.nav.menu}</DialogTitle>
          <div className="mt-4 grid gap-2">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 hover:bg-accent">
                {label}
              </a>
            ))}
            <Link to="/demo" onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 hover:bg-accent">{messages.nav.demo}</Link>
            <Link to="/dj" onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 hover:bg-accent">{messages.nav.dj}</Link>
            <Link to="/venue" onClick={() => setMenu(false)} className="rounded-lg px-3 py-2 hover:bg-accent">{messages.nav.venue}</Link>
          </div>
        </DialogContent>
      </Dialog>
      <PageMain>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{messages.demoBadge}</p>
            <h1 className="mt-4 font-display text-[1.85rem] leading-tight text-balance sm:text-5xl">
              {messages.landing.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">{messages.landing.sub}</p>
            <div className="mt-7">
              <DemoWalkButtons />
            </div>
          </div>
          <HeroStage mode={mode} onModeChange={setMode} />
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
          <h2 className="font-display text-3xl">{messages.landing.howTitle}</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {messages.landing.how.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="text-sm font-bold text-primary">0{index + 1}</span>
                <h3 className="mt-3 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="dj" className="mx-auto grid max-w-6xl scroll-mt-24 gap-4 px-4 py-8 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[#101014] p-6">
            <h2 className="font-display text-3xl">{messages.landing.djTitle}</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
              {messages.landing.djPoints.map((point) => (
                <li key={point} className="rounded-xl bg-white/5 px-3 py-3">{point}</li>
              ))}
            </ul>
          </article>
          <article id="venue-benefits" className="rounded-2xl border border-white/10 bg-[#101014] p-6">
            <h2 className="font-display text-3xl">{messages.landing.venueTitle}</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
              {messages.landing.venuePoints.map((point) => (
                <li key={point} className="rounded-xl bg-white/5 px-3 py-3">{point}</li>
              ))}
            </ul>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/venue">{messages.nav.venue}</Link>
            </Button>
          </article>
        </section>

        <section id="modes" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
          <h2 className="font-display text-3xl">{messages.landing.compareTitle}</h2>
          <p className="mt-2 text-sm text-zinc-400">{messages.landing.compareCaption}</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/5 text-zinc-300">
                <tr>
                  <th className="px-4 py-3 font-medium"> </th>
                  <th className="px-4 py-3 font-medium">{messages.mode.DJ}</th>
                  <th className="px-4 py-3 font-medium">{messages.mode.JUKEBOX}</th>
                </tr>
              </thead>
              <tbody>
                {messages.landing.compare.map((row) => (
                  <tr key={row.label} className="border-t border-white/10">
                    <th className="px-4 py-3 font-medium text-zinc-200">{row.label}</th>
                    <td className="px-4 py-3 text-zinc-400">{row.dj}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.box}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <StatsBlock />

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-12">
          <h2 className="mb-6 font-display text-3xl">{messages.landing.faqTitle}</h2>
          <Accordion
            items={messages.landing.faq.map((item) => ({
              id: item.q,
              title: item.q,
              body: item.a,
            }))}
          />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-3xl border border-primary/30 bg-primary/10 px-6 py-10 sm:px-10">
            <h2 className="font-display text-3xl sm:text-4xl">{messages.landing.finalTitle}</h2>
            <p className="mt-3 max-w-2xl text-zinc-300">{messages.landing.finalText}</p>
            <div className="mt-6">
              <DemoWalkButtons />
            </div>
          </div>
        </section>
      </PageMain>
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <p className="text-sm text-zinc-400">{messages.landing.footerNote}</p>
          <p className="text-xs text-zinc-500">{messages.localeHint}</p>
          <div className="flex flex-wrap items-center gap-4">
            <LocaleSwitch />
            <ResetDemoButton variant="ghost" />
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-zinc-300">
            <Link to="/demo">{messages.nav.demo}</Link>
            <Link to="/dj">{messages.nav.dj}</Link>
            <Link to="/venue">{messages.nav.venue}</Link>
            <Link to="/admin">{messages.nav.admin}</Link>
            <Link to="/v/loft-47">Лофт 47</Link>
            <Link to="/v/nochnaya-kuhnya">Ночная кухня</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function StatsBlock() {
  const messages = useMessages();
  const db = useDemoDb();
  if (!db.data) {
    return (
      <section id="stats" className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-36 w-full" />
      </section>
    );
  }
  const stats = buildAnalytics(db.data);
  const cards = [
    [messages.landing.statRequests, formatNumber(stats.totals.requests)],
    [messages.landing.statQueue, formatNumber(stats.totals.queued)],
    [messages.landing.statVenues, formatNumber(stats.totals.venues)],
    [messages.landing.statAmount, formatKzt(stats.totals.exampleAmount)],
  ] as const;
  return (
    <section id="stats" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8">
      <h2 className="font-display text-3xl">{messages.landing.statsTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">{messages.landing.statsCaption}</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <dt className="text-sm text-zinc-400">{label}</dt>
            <dd className="mt-2 font-display text-2xl text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HeroStage({ mode, onModeChange }: { mode: VenueMode; onModeChange: (mode: VenueMode) => void }) {
  const messages = useMessages();
  const db = useDemoDb();
  const reduce = useReducedMotion();
  return (
    <div>
      <div role="radiogroup" aria-label={messages.landing.modeSwitch} className="mb-3 grid grid-cols-2 gap-2">
        {(["DJ", "JUKEBOX"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => onModeChange(value)}
            className={cn(
              "cursor-pointer rounded-xl border px-3 py-3 text-left",
              mode === value ? "border-primary bg-primary/10" : "border-white/10 bg-black/30",
            )}
          >
            <span className="block text-sm font-bold">{messages.mode[value]}</span>
            <span className="mt-1 block text-xs text-zinc-400">{messages.modeHint[value]}</span>
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">{messages.landing.liveLabel}</p>
      {!db.data || !db.data.venues.length ? (
        <Skeleton className="h-[420px] w-full" />
      ) : (
        <HeroPhone
          key={mode}
          venue={venueBySlug(db.data, mode === "DJ" ? "loft-47" : "nochnaya-kuhnya")}
          tracks={tracksForVenue(
            db.data,
            venueBySlug(db.data, mode === "DJ" ? "loft-47" : "nochnaya-kuhnya")?.id ?? "",
            true,
          ).slice(0, 4)}
          reduce={Boolean(reduce)}
        />
      )}
    </div>
  );
}

function HeroPhone({
  venue,
  tracks,
  reduce,
}: {
  venue: Venue | null;
  tracks: Track[];
  reduce: boolean;
}) {
  const messages = useMessages();
  const [trackId, setTrackId] = useState(tracks[0]?.id ?? "");
  const track = tracks.find((item) => item.id === trackId) ?? tracks[0];
  const [amount, setAmount] = useState(venue?.minBidKzt ?? 1000);
  const [shown, setShown] = useState(false);
  if (!venue || !track) return null;
  const amounts = quickBidAmounts(venue.minBidKzt);

  return (
    <div className={cn("rounded-[2rem] border border-white/15 bg-[#070709] p-3 shadow-2xl", reduce ? "" : "transition-transform")}>
      <div className="rounded-[1.4rem] border border-white/10 bg-[#101014] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">{venue.city}</p>
            <p className="font-display text-lg">{venue.name}</p>
          </div>
          <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-bold text-primary">{messages.mode[venue.mode]}</span>
        </div>
        <div className="mt-4 grid gap-2">
          {tracks.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === track.id}
              onClick={() => {
                setTrackId(item.id);
                setShown(false);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-2 py-2 text-left",
                item.id === track.id ? "border-primary/60 bg-white/5" : "border-transparent hover:bg-white/5",
              )}
            >
              <CoverArt title={item.title} artist={item.artist} hue={item.coverHue} coverUrl={item.coverUrl} className="h-10 w-10" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.title}</span>
                <span className="block truncate text-xs text-zinc-400">{item.artist}</span>
              </span>
              <span className="text-xs font-semibold text-primary">
                {venue.mode === "JUKEBOX" ? formatKzt(item.priceKzt) : `${messages.guest.from} ${formatKzt(venue.minBidKzt)}`}
              </span>
            </button>
          ))}
        </div>
        {venue.mode === "DJ" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {amounts.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={amount === value}
                onClick={() => setAmount(value)}
                className={cn(
                  "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold",
                  amount === value ? "bg-primary text-primary-foreground" : "bg-white/10",
                )}
              >
                {formatKzt(value)}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-300">{formatKzt(track.priceKzt)} · {messages.mode.JUKEBOX}</p>
        )}
        <Button className="mt-3 w-full" onClick={() => setShown(true)}>
          {messages.landing.heroSubmit}
        </Button>
        {shown ? (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
            <p>{venue.mode === "DJ" ? messages.landing.heroPreviewDj : messages.landing.heroPreviewBox}</p>
            <p className="mt-1 font-semibold">
              {track.title} · {venue.mode === "DJ" ? formatKzt(amount) : formatKzt(track.priceKzt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShown(false)}>
                {messages.landing.heroAgain}
              </Button>
              <Button asChild size="sm">
                <Link to={venue.mode === "DJ" ? "/v/loft-47" : "/v/nochnaya-kuhnya"}>{messages.landing.heroReal}</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
