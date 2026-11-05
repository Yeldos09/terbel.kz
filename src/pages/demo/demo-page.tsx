import { useState } from "react";
import { Link } from "react-router";
import { useDemoDb } from "../../app/hooks.ts";
import { staffHref } from "../../features/auth/access.ts";
import { useSession } from "../../features/auth/session.ts";
import { requestView, tracksForVenue, venueBySlug } from "../../domain/selectors.ts";
import type { VenueMode } from "../../domain/types.ts";
import { CheckoutPanel } from "../../features/ordering/checkout-panel.tsx";
import { OrderForm } from "../../features/ordering/order-form.tsx";
import { QueueBoard } from "../../features/queue/queue-board.tsx";
import { RequestActions } from "../../features/requests/request-actions.tsx";
import { BrandLink, PageMain, PageSkeleton } from "../../shared/components/chrome.tsx";
import { DemoWalkButtons } from "../../shared/components/demo-walk.tsx";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { cn } from "../../shared/lib/utils.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shared/ui/tabs.tsx";

export function DemoPage() {
  const messages = useMessages();
  const session = useSession();
  const [mode, setMode] = useState<VenueMode>("DJ");
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <BrandLink />
          <Link to={staffHref("/admin", session)} className="text-sm text-muted-foreground">{messages.nav.admin}</Link>
        </div>
      </header>
      <PageMain className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="font-display text-4xl">{messages.demo.title}</h1>
        <p className="mt-3 max-w-2xl text-subtle">{messages.demo.lead}</p>
        <Tabs value={mode} onValueChange={(value) => setMode(value as VenueMode)} className="mt-6">
          <TabsList>
            <TabsTrigger value="DJ">{messages.demo.djTab}</TabsTrigger>
            <TabsTrigger value="JUKEBOX">{messages.demo.boxTab}</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <DemoWalkButtons />
          </div>
          <TabsContent value="DJ" className="mt-6">
            <Walkthrough mode="DJ" />
          </TabsContent>
          <TabsContent value="JUKEBOX" className="mt-6">
            <Walkthrough mode="JUKEBOX" />
          </TabsContent>
        </Tabs>
      </PageMain>
    </div>
  );
}

function Walkthrough({ mode }: { mode: VenueMode }) {
  const messages = useMessages();
  const session = useSession();
  const db = useDemoDb();
  const slug = mode === "DJ" ? "loft-47" : "nochnaya-kuhnya";
  const venue = db.data ? venueBySlug(db.data, slug) : null;
  const tracks = db.data && venue ? tracksForVenue(db.data, venue.id, true).slice(0, 6) : [];
  const [trackId, setTrackId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  if (!db.data || !venue) return <PageSkeleton />;
  const track = tracks.find((item) => item.id === trackId) ?? null;
  const created = requestId ? requestView(db.data, requestId) : null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link to={`/v/${venue.slug}`}>{messages.demo.openGuest}</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={staffHref("/dj/requests", session)}>{messages.demo.openDj}</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={staffHref("/dj/queue", session)}>{messages.demo.openQueue}</Link></Button>
        {mode === "JUKEBOX" ? (
          <Button asChild variant="outline" size="sm">
            <Link to={`/v/${venue.slug}/checkout/draft_kitchen_demo`}>{messages.demo.sample}</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/request/req_loft_pending_a">{messages.demo.sample}</Link>
          </Button>
        )}
      </div>
      <section>
        <h2 className="font-display text-2xl">{messages.demo.pick}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {tracks.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === trackId}
              onClick={() => {
                setTrackId(item.id);
                setRequestId(null);
                setDraftId(null);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-2 text-left",
                item.id === trackId ? "border-primary" : "border-border",
              )}
            >
              <CoverArt title={item.title} artist={item.artist} hue={item.coverHue} coverUrl={item.coverUrl} className="h-12 w-12" />
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="block text-sm text-muted-foreground">{item.artist}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      {track ? (
        <section className="rounded-2xl border border-border p-4">
          <h2 className="font-display text-2xl">{messages.demo.details}</h2>
          <div className="mt-4">
            <OrderForm
              key={track.id}
              venue={venue}
              track={track}
              onDone={(result) => {
                if (result.kind === "request") setRequestId(result.id);
                else setDraftId(result.id);
              }}
            />
          </div>
        </section>
      ) : null}
      {mode === "DJ" && created ? (
        <section className="rounded-2xl border border-border p-4">
          <h2 className="font-display text-2xl">{messages.demo.decide}</h2>
          <p className="mt-2 text-sm text-subtle">
            {created.request.trackTitle} · {created.request.guestName}
          </p>
          <div className="mt-3">
            <RequestActions request={created.request} />
          </div>
          <Button asChild variant="outline" className="mt-4">
            <Link to={`/request/${created.request.id}`}>{messages.demo.openStatus}</Link>
          </Button>
        </section>
      ) : null}
      {mode === "JUKEBOX" && draftId ? (
        <section>
          <h2 className="mb-3 font-display text-2xl">{messages.demo.pay}</h2>
          <CheckoutPanel draftId={draftId} venueSlug={venue.slug} onPaid={(id) => setRequestId(id)} />
        </section>
      ) : null}
      <section>
        <h2 className="font-display text-2xl">{mode === "DJ" ? messages.demo.air : messages.demo.place}</h2>
        <div className="mt-3">
          <QueueBoard venueId={venue.id} guestPath={`/v/${venue.slug}`} />
        </div>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => {
            setTrackId(null);
            setRequestId(null);
            setDraftId(null);
          }}
        >
          {messages.demo.another}
        </Button>
      </section>
    </div>
  );
}
