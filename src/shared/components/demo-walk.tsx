import { Link } from "react-router";
import { useDemoDb } from "../../app/hooks.ts";
import { venueBySlug } from "../../domain/selectors.ts";
import type { VenueMode } from "../../domain/types.ts";
import { useMessages } from "../i18n/context.ts";
import { Button } from "../ui/button.tsx";

export function demoVenueSlug(mode: VenueMode): string {
  return mode === "DJ" ? "loft-47" : "nochnaya-kuhnya";
}

export function DemoWalkButtons({ mode }: { mode: VenueMode }) {
  const messages = useMessages();
  const db = useDemoDb();
  const slug = demoVenueSlug(mode);
  const venue = db.data ? venueBySlug(db.data, slug) : null;
  const venueName = venue?.name ?? (mode === "DJ" ? "Лофт 47" : "Ночная кухня");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid content-start gap-2">
        <Button asChild size="lg" className="w-full">
          <Link to={`/v/${slug}`}>{messages.demo.walkGuest}</Link>
        </Button>
        <p className="text-xs leading-5 text-zinc-300">
          {venueName} · {messages.mode[mode]}. {messages.modeHint[mode]}
        </p>
      </div>
      <div className="grid content-start gap-2">
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to="/dj">{messages.demo.walkDj}</Link>
        </Button>
        <p className="text-xs leading-5 text-zinc-300">{messages.demo.walkDjHint}</p>
      </div>
    </div>
  );
}
