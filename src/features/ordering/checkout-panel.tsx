import { Link } from "react-router";
import { toast } from "sonner";
import { useDemoDb, useRepoMutation } from "../../app/hooks.ts";
import { draftView } from "../../domain/selectors.ts";
import { repository } from "../../mocks/repository.ts";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { EmptyState } from "../../shared/ui/misc.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { formatKzt, interpolate } from "../../shared/lib/format.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Card } from "../../shared/ui/misc.tsx";

export function CheckoutPanel({
  draftId,
  venueSlug,
  onPaid,
}: {
  draftId: string;
  venueSlug: string;
  onPaid?: (requestId: string) => void;
}) {
  const messages = useMessages();
  const db = useDemoDb();
  const action = useRepoMutation();
  if (!db.data) return null;
  const paid = db.data.requests.find((request) => request.id === draftId);
  const view = draftView(db.data, draftId);

  if (!view && paid) {
    return (
      <EmptyState
        title={messages.checkout.already}
        text={messages.decision.paid}
        action={
          <Button asChild>
            <Link to={`/request/${paid.id}`}>{messages.checkout.openStatus}</Link>
          </Button>
        }
      />
    );
  }

  if (!view || !view.venue || view.venue.slug !== venueSlug) {
    return (
      <EmptyState
        title={messages.checkout.missing}
        text={messages.checkout.lead}
        action={
          <Button asChild variant="outline">
            <Link to={`/v/${venueSlug}`}>{messages.checkout.backToCatalog}</Link>
          </Button>
        }
      />
    );
  }

  const track = view.track;
  const price = track?.priceKzt ?? view.draft.amountKzt;
  const changed = track ? track.priceKzt !== view.draft.amountKzt : false;
  const blocked = !view.venue.isOpen || view.venue.mode !== "JUKEBOX" || !track?.enabled;

  return (
    <Card className="p-5">
      <p className="text-sm text-primary">{messages.mode.JUKEBOX}</p>
      <h1 className="mt-1 font-display text-3xl">{messages.checkout.title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{messages.checkout.lead}</p>
      <div className="mt-5 flex gap-3">
        <CoverArt
          title={track?.title ?? view.draft.trackId}
          artist={track?.artist ?? view.venue.name}
          hue={track?.coverHue ?? 80}
          coverUrl={track?.coverUrl}
          className="h-16 w-16 shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{track?.title}</p>
          <p className="truncate text-sm text-muted-foreground">{track?.artist}</p>
          <p className="text-sm">
            {view.draft.guestName} · {view.venue.tableLabel} {view.draft.tableLabel}
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">{messages.checkout.summary}</p>
      <p className="font-display text-4xl text-primary">{formatKzt(price)}</p>
      {changed ? <p className="mt-2 text-sm text-warning">{interpolate(messages.checkout.priceChanged, { price: formatKzt(price) })}</p> : null}
      {blocked ? <p className="mt-3 text-sm text-muted-foreground">{messages.guest.closed}</p> : null}
      <Button
        className="mt-5 w-full"
        size="lg"
        disabled={blocked || action.isPending}
        onClick={() => {
          action.mutate(
            () => {
              repository.confirmCheckout(draftId);
            },
            {
              onSuccess: () => {
                toast.success(messages.toast.paid);
                onPaid?.(draftId);
              },
            },
          );
        }}
      >
        {action.isPending ? messages.checkout.confirming : `${messages.checkout.confirm} · ${formatKzt(price)}`}
      </Button>
    </Card>
  );
}
