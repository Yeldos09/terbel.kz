import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { DEMO_QUERY_KEY } from "../../app/query-key.ts";
import { useDemoDb } from "../../app/hooks.ts";
import { venueBySlug } from "../../domain/selectors.ts";
import { staffHref } from "../../features/auth/access.ts";
import { useSession } from "../../features/auth/session.ts";
import { repository } from "../../mocks/repository.ts";
import { useMessages } from "../i18n/context.ts";
import { Button } from "../ui/button.tsx";

const DJ_GUEST_SLUG = "loft-47";
const DIRECT_ORDER_SLUG = "nochnaya-kuhnya";

function focusDirectOrderVenue(): void {
  const db = repository.read();
  const venue = venueBySlug(db, DIRECT_ORDER_SLUG);
  if (!venue) return;
  if (db.activeDashboardVenueId !== venue.id) {
    repository.setActiveDashboardVenue(venue.id);
  }
}

export function DemoWalkButtons() {
  const messages = useMessages();
  const session = useSession();
  const db = useDemoDb();
  const client = useQueryClient();
  const djVenue = db.data ? venueBySlug(db.data, DJ_GUEST_SLUG) : null;
  const direct = db.data ? venueBySlug(db.data, DIRECT_ORDER_SLUG) : null;
  const djName = djVenue?.name ?? "Лофт 47";
  const directName = direct?.name ?? "Ночная кухня";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid content-start gap-2">
        <Button asChild size="lg" className="h-auto min-h-12 w-full whitespace-normal py-3">
          <Link to={`/v/${DJ_GUEST_SLUG}`}>{messages.demo.walkGuestDj}</Link>
        </Button>
        <p className="text-xs leading-5 text-subtle">
          {djName} · {messages.mode.DJ}. {messages.modeHint.DJ}
        </p>
      </div>
      <div className="grid content-start gap-2">
        <Button asChild size="lg" className="h-auto min-h-12 w-full whitespace-normal py-3">
          <Link to={`/v/${DIRECT_ORDER_SLUG}`}>{messages.demo.walkGuestBox}</Link>
        </Button>
        <p className="text-xs leading-5 text-subtle">
          {directName} · {messages.mode.JUKEBOX}. {messages.modeHint.JUKEBOX}
        </p>
      </div>
      <div className="grid content-start gap-2">
        <Button asChild size="lg" className="h-auto min-h-12 w-full whitespace-normal py-3">
          <Link to={staffHref("/dj", session)}>{messages.demo.walkDj}</Link>
        </Button>
        <p className="text-xs leading-5 text-subtle">{messages.demo.walkDjHint}</p>
      </div>
      <div className="grid content-start gap-2">
        <Button asChild size="lg" className="h-auto min-h-12 w-full whitespace-normal py-3">
          <Link
            to={staffHref("/venue", session)}
            onClick={() => {
              if (session?.role !== "platform") return;
              focusDirectOrderVenue();
              client.setQueryData(DEMO_QUERY_KEY, repository.read());
            }}
          >
            {messages.demo.walkAdmin}
          </Link>
        </Button>
        <p className="text-xs leading-5 text-subtle">
          {directName} · {messages.mode.JUKEBOX}. {messages.demo.walkAdminHint}
        </p>
      </div>
    </div>
  );
}
