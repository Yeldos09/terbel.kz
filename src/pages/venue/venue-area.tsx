import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { toCanvas } from "qrcode";
import { useActiveVenue, useDemoDb, useRepoMutation } from "../../app/hooks.ts";
import { tracksForVenue } from "../../domain/selectors.ts";
import { trackFormSchema, venueSettingsSchema, type TrackFormInput, type VenueSettingsInput } from "../../domain/schemas.ts";
import type { Track, Venue, VenueKind } from "../../domain/types.ts";
import { GENRE_SUGGESTIONS } from "../../mocks/seed.ts";
import { repository } from "../../mocks/repository.ts";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { ConfirmDialog } from "../../shared/components/confirm-dialog.tsx";
import { WorkShell } from "../../shared/components/work-shell.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { useDebouncedValue } from "../../shared/hooks/use-debounced-value.ts";
import { formatNumber } from "../../shared/lib/format.ts";
import { cn } from "../../shared/lib/utils.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Dialog, DialogContent, DialogTitle } from "../../shared/ui/dialog.tsx";
import { Field, Input, Textarea } from "../../shared/ui/field.tsx";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../../shared/ui/menu.tsx";
import { EmptyState, Skeleton } from "../../shared/ui/misc.tsx";
import { SelectField } from "../../shared/ui/select.tsx";
import { Switch } from "../../shared/ui/switch.tsx";

function useVenueNav() {
  const messages = useMessages();
  return [
    { to: "/venue", label: messages.nav.overview, end: true },
    { to: "/venue/settings", label: messages.nav.settings },
    { to: "/venue/catalog", label: messages.nav.catalog },
    { to: "/venue/qr", label: messages.nav.qr },
  ];
}

export function VenueLayout() {
  const messages = useMessages();
  const { query, venue } = useActiveVenue("dashboard");
  const nav = useVenueNav();
  return (
    <WorkShell
      tone="venue"
      title={messages.venue.title}
      lead={messages.venue.lead}
      items={nav}
      aside={
        query.data && venue ? (
          <div className="grid gap-2">
            <Menu>
              <MenuTrigger asChild>
                <Button variant="outline">{venue.name}</Button>
              </MenuTrigger>
              <MenuContent>
                {query.data.venues.map((item) => (
                  <MenuItem
                    key={item.id}
                    onSelect={() => {
                      repository.setActiveDashboardVenue(item.id);
                      toast.success(messages.toast.venueSwitched);
                    }}
                  >
                    {item.name} · {messages.mode[item.mode]}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
            <Button asChild size="sm">
              <Link to={`/v/${venue.slug}`}>{messages.venue.openGuest}</Link>
            </Button>
          </div>
        ) : null
      }
    >
      {query.isPending ? <Skeleton className="h-40 w-full" /> : <Outlet />}
    </WorkShell>
  );
}

export function VenueHomePage() {
  const messages = useMessages();
  const { venue } = useActiveVenue("dashboard");
  const db = useDemoDb();
  if (!db.data || !venue) return null;
  const requests = db.data.requests.filter((request) => request.venueId === venue.id);
  const recent = [...requests].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5);
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <Info label={messages.venue.mode} value={messages.mode[venue.mode]} />
        <Info label={messages.admin.columnOpen} value={venue.isOpen ? messages.venue.openState : messages.venue.closedState} />
        <Info label={messages.admin.columnRequests} value={formatNumber(requests.length)} />
      </section>
      <section className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{messages.demoBadge}</p>
        <h2 className="mt-2 font-display text-2xl">
          {venue.mode === "JUKEBOX" ? messages.venue.catalogPoint : messages.venue.djPoint}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-200">
          {venue.mode === "JUKEBOX" ? messages.venue.catalogPointLead : messages.venue.djPointLead}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link to="/venue/catalog">{messages.nav.catalog}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/v/${venue.slug}`}>{messages.venue.openGuest}</Link>
          </Button>
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-wider text-zinc-500">{messages.venue.preview}</p>
        <h2 className="mt-2 font-display text-3xl">{venue.name}</h2>
        <p className="mt-2 max-w-xl text-zinc-300">{venue.greeting}</p>
      </section>
      <section>
        <h2 className="font-display text-2xl">{messages.venue.recent}</h2>
        {recent.length === 0 ? <p className="mt-2 text-sm text-zinc-400">{messages.venue.noRecent}</p> : null}
        <ul className="mt-3 grid gap-2">
          {recent.map((request) => (
            <li key={request.id}>
              <Link className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-3 hover:bg-white/5" to={`/request/${request.id}`}>
                <span>{request.trackTitle}</span>
                <span className="text-sm text-zinc-400">{messages.status[request.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function toSettings(venue: Venue): VenueSettingsInput {
  return {
    name: venue.name,
    city: venue.city,
    address: venue.address,
    kind: venue.kind,
    mode: venue.mode,
    minBidKzt: venue.minBidKzt,
    greeting: venue.greeting,
    description: venue.description,
    tableLabel: venue.tableLabel,
    acceptWindowMinutes: venue.acceptWindowMinutes,
    isOpen: venue.isOpen,
  };
}

export function VenueSettingsPage() {
  const { venue } = useActiveVenue("dashboard");
  if (!venue) return null;
  return <SettingsForm key={venue.id} venue={venue} />;
}

function SettingsForm({ venue }: { venue: Venue }) {
  const messages = useMessages();
  const action = useRepoMutation();
  const form = useForm<VenueSettingsInput>({
    resolver: zodResolver(venueSettingsSchema) as Resolver<VenueSettingsInput>,
    defaultValues: toSettings(venue),
  });
  const greeting = form.watch("greeting");
  const mode = form.watch("mode");
  const kind = form.watch("kind");
  const isOpen = form.watch("isOpen");
  const kinds = (["bar", "restaurant", "lounge", "karaoke"] as const).map((value) => ({
    value,
    label: messages.kind[value],
  }));

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => {
        action.mutate(() => repository.updateVenue(venue.id, values), {
          onSuccess: () => toast.success(messages.toast.settingsSaved),
        });
      })}
    >
      <div>
        <h1 className="font-display text-3xl">{messages.nav.settings}</h1>
        <p className="mt-2 text-sm text-zinc-400">{messages.venue.settingsLead}</p>
      </div>
      <Field label={messages.venue.name} htmlFor="venue-name" error={form.formState.errors.name?.message}>
        <Input id="venue-name" {...form.register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={messages.venue.city} htmlFor="venue-city" error={form.formState.errors.city?.message}>
          <Input id="venue-city" {...form.register("city")} />
        </Field>
        <Field label={messages.venue.address} htmlFor="venue-address" error={form.formState.errors.address?.message}>
          <Input id="venue-address" {...form.register("address")} />
        </Field>
      </div>
      <Field label={messages.venue.kind} htmlFor="venue-kind">
        <SelectField
          id="venue-kind"
          ariaLabel={messages.venue.kind}
          value={kind}
          onValueChange={(value) => form.setValue("kind", value as VenueKind, { shouldValidate: true })}
          options={kinds}
        />
      </Field>
      <fieldset>
        <legend className="text-sm font-medium">{messages.venue.mode}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(["DJ", "JUKEBOX"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => form.setValue("mode", value, { shouldValidate: true })}
              className={cn("cursor-pointer rounded-xl border px-3 py-3 text-left", mode === value ? "border-primary bg-primary/10" : "border-white/10")}
            >
              <span className="block font-semibold">{messages.mode[value]}</span>
              <span className="mt-1 block text-xs text-zinc-400">{messages.modeHint[value]}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <Field label={messages.venue.greeting} htmlFor="venue-greeting" error={form.formState.errors.greeting?.message}>
        <Textarea id="venue-greeting" {...form.register("greeting")} />
      </Field>
      <Field label={messages.venue.description} htmlFor="venue-description" error={form.formState.errors.description?.message}>
        <Textarea id="venue-description" {...form.register("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={messages.venue.table} htmlFor="venue-table" error={form.formState.errors.tableLabel?.message}>
          <Input id="venue-table" {...form.register("tableLabel")} />
        </Field>
        <Field label={messages.venue.min} htmlFor="venue-min" error={form.formState.errors.minBidKzt?.message}>
          <Input id="venue-min" type="number" {...form.register("minBidKzt", { valueAsNumber: true })} />
        </Field>
      </div>
      <Field label={messages.venue.window} htmlFor="venue-window" error={form.formState.errors.acceptWindowMinutes?.message}>
        <Input id="venue-window" type="number" {...form.register("acceptWindowMinutes", { valueAsNumber: true })} />
      </Field>
      <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-3">
        <span id="venue-open">{messages.venue.open}</span>
        <Switch labelledBy="venue-open" checked={isOpen} onCheckedChange={(checked) => form.setValue("isOpen", checked)} />
      </div>
      <p className="text-sm text-zinc-400">{messages.venue.slug}: /v/{venue.slug}. {messages.venue.slugHint}</p>
      <div className="rounded-2xl bg-white/5 p-4">
        <p className="text-xs text-zinc-500">{messages.venue.preview}</p>
        <p className="mt-2">{greeting}</p>
      </div>
      <Button type="submit" disabled={action.isPending}>{messages.save}</Button>
    </form>
  );
}

export function VenueCatalogPage() {
  const messages = useMessages();
  const { venue } = useActiveVenue("dashboard");
  const db = useDemoDb();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query);
  const [genre, setGenre] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  if (!db.data || !venue) return null;
  const genres = [...new Set(tracksForVenue(db.data, venue.id).map((track) => track.genre))];
  const needle = debounced.trim().toLocaleLowerCase("ru-KZ");
  const tracks = tracksForVenue(db.data, venue.id).filter((track) => {
    const text = `${track.title} ${track.artist}`.toLocaleLowerCase("ru-KZ");
    return (genre === "all" || track.genre === genre) && (needle.length === 0 || text.includes(needle));
  });
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{messages.demoBadge}</p>
          <h1 className="mt-2 font-display text-3xl">{messages.nav.catalog}</h1>
          <p className="mt-2 text-sm text-zinc-400">{messages.venue.catalogLead}</p>
          <p className="mt-2 text-sm text-zinc-300">
            {venue.mode === "JUKEBOX" ? messages.venue.catalogGuestBox : messages.venue.catalogGuestDj}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>{messages.venue.add}</Button>
      </div>
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={messages.guest.search} aria-label={messages.guest.search} />
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={genre === "all"} className={chip(genre === "all")} onClick={() => setGenre("all")}>{messages.guest.allGenres}</button>
        {genres.map((item) => (
          <button key={item} type="button" aria-pressed={genre === item} className={chip(genre === item)} onClick={() => setGenre(item)}>{item}</button>
        ))}
      </div>
      {query !== debounced ? <Skeleton className="h-24 w-full" /> : null}
      {query === debounced && tracks.length === 0 ? <EmptyState title={messages.venue.emptyCatalog} text={messages.venue.catalogLead} /> : null}
      <div className="grid gap-3">
        {query === debounced ? tracks.map((track) => <TrackEditor key={track.id} track={track} />) : null}
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>{messages.venue.add}</DialogTitle>
          <AddTrackForm
            venueId={venue.id}
            onDone={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function chip(active: boolean): string {
  return cn("cursor-pointer rounded-full px-3 py-1.5 text-sm", active ? "bg-primary text-primary-foreground" : "bg-white/10");
}

function TrackEditor({ track }: { track: Track }) {
  const messages = useMessages();
  const action = useRepoMutation();
  const [price, setPrice] = useState(String(track.priceKzt));
  const [removeOpen, setRemoveOpen] = useState(false);
  return (
    <article className="grid gap-3 rounded-2xl border border-white/10 p-3 sm:grid-cols-[auto_1fr_auto]">
      <CoverArt title={track.title} artist={track.artist} hue={track.coverHue} coverUrl={track.coverUrl} className="h-14 w-14" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{track.title}</p>
        <p className="truncate text-sm text-zinc-400">{track.artist} · {track.genre}</p>
        <p className="text-xs text-zinc-500">{track.enabled ? messages.venue.visible : messages.venue.hidden}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input className="h-9 max-w-36" inputMode="numeric" aria-label={messages.venue.price} value={price} onChange={(event) => setPrice(event.target.value)} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              action.mutate(() => repository.setTrackPrice(track.id, Number(price)), {
                onSuccess: () => toast.success(messages.toast.trackPriced),
              });
            }}
          >
            {messages.venue.savePrice}
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={track.enabled}
          ariaLabel={messages.venue.enabled}
          onCheckedChange={(enabled) => {
            action.mutate(() => repository.setTrackEnabled(track.id, enabled), {
              onSuccess: () => toast.success(messages.toast.trackToggled),
            });
          }}
        />
        <Button size="sm" variant="destructive" onClick={() => setRemoveOpen(true)}>{messages.venue.remove}</Button>
      </div>
      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={messages.confirm.removeTrackTitle}
        description={messages.confirm.removeTrackBody}
        confirmLabel={messages.confirm.removeTrackAction}
        destructive
        onConfirm={() => {
          action.mutate(() => repository.removeTrack(track.id), {
            onSuccess: () => toast.success(messages.toast.trackRemoved),
          });
        }}
      />
    </article>
  );
}

function AddTrackForm({ venueId, onDone }: { venueId: string; onDone: () => void }) {
  const messages = useMessages();
  const action = useRepoMutation();
  const form = useForm<TrackFormInput>({
    resolver: zodResolver(trackFormSchema) as Resolver<TrackFormInput>,
    defaultValues: { title: "", artist: "", genre: "Pop", durationSec: 200, priceKzt: 1500, enabled: true },
  });
  const enabled = form.watch("enabled");
  return (
    <form
      className="mt-4 grid gap-3"
      onSubmit={form.handleSubmit((values) => {
        action.mutate(() => repository.addTrack(venueId, values), {
          onSuccess: () => {
            toast.success(messages.toast.trackAdded);
            onDone();
          },
        });
      })}
    >
      <Field label={messages.venue.titleField} htmlFor="track-title" error={form.formState.errors.title?.message}>
        <Input id="track-title" {...form.register("title")} />
      </Field>
      <Field label={messages.venue.artist} htmlFor="track-artist" error={form.formState.errors.artist?.message}>
        <Input id="track-artist" {...form.register("artist")} />
      </Field>
      <Field label={messages.venue.genre} htmlFor="track-genre" error={form.formState.errors.genre?.message}>
        <Input id="track-genre" {...form.register("genre")} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {GENRE_SUGGESTIONS.map((genre) => (
          <button key={genre} type="button" className="cursor-pointer rounded-full bg-white/10 px-2 py-1 text-xs" onClick={() => form.setValue("genre", genre)}>
            {genre}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={messages.venue.duration} htmlFor="track-duration" error={form.formState.errors.durationSec?.message}>
          <Input id="track-duration" type="number" {...form.register("durationSec", { valueAsNumber: true })} />
        </Field>
        <Field label={messages.venue.price} htmlFor="track-price" error={form.formState.errors.priceKzt?.message}>
          <Input id="track-price" type="number" {...form.register("priceKzt", { valueAsNumber: true })} />
        </Field>
      </div>
      <div className="flex items-center justify-between">
        <span id="track-enabled">{messages.venue.enabled}</span>
        <Switch labelledBy="track-enabled" checked={enabled} onCheckedChange={(checked) => form.setValue("enabled", checked)} />
      </div>
      <Button type="submit" disabled={action.isPending}>{messages.venue.addSubmit}</Button>
    </form>
  );
}

const QR_SIZES = [
  { id: 160, labelKey: "sizeSm" },
  { id: 240, labelKey: "sizeMd" },
  { id: 320, labelKey: "sizeLg" },
] as const;

export function VenueQrPage() {
  const messages = useMessages();
  const { venue } = useActiveVenue("dashboard");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [size, setSize] = useState<(typeof QR_SIZES)[number]["id"]>(240);
  const [captionDraft, setCaptionDraft] = useState<{ venueId: string; text: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const url = venue ? `${window.location.origin}/v/${venue.slug}` : "";
  const caption =
    venue && captionDraft?.venueId === venue.id ? captionDraft.text : venue ? `${venue.tableLabel} 1` : "";
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !url) return;
    let cancelled = false;
    toCanvas(canvas, url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#14160a", light: "#f4f7e4" },
    }).then(
      () => {
        if (!cancelled) setFailed(false);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url, size]);
  if (!venue) return null;
  const sizeLabel = (id: (typeof QR_SIZES)[number]["id"]) => {
    if (id === 160) return messages.venue.sizeSm;
    if (id === 320) return messages.venue.sizeLg;
    return messages.venue.sizeMd;
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <div>
        <h1 className="font-display text-3xl">{messages.nav.qr}</h1>
        <p className="mt-2 text-sm text-zinc-400">{messages.venue.qrLead}</p>
        <Field label={messages.venue.link} htmlFor="qr-link">
          <Input id="qr-link" ref={linkRef} readOnly value={url} className="mt-2" />
        </Field>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={messages.venue.size}>
          {QR_SIZES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={size === item.id}
              onClick={() => setSize(item.id)}
              className={chip(size === item.id)}
            >
              {sizeLabel(item.id)}
            </button>
          ))}
        </div>
        <Field label={messages.venue.cardCaption} htmlFor="card-caption">
          <Input
            id="card-caption"
            className="mt-2"
            value={caption}
            onChange={(event) => {
              if (!venue) return;
              setCaptionDraft({ venueId: venue.id, text: event.target.value });
            }}
          />
        </Field>
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const node = linkRef.current;
              void navigator.clipboard.writeText(url).then(
                () => toast.success(messages.toast.copied),
                () => {
                  node?.focus();
                  node?.select();
                  toast.error(messages.toast.copyFailed);
                },
              );
            }}
          >
            {messages.venue.copy}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas || failed) {
                toast.error(messages.toast.pngFailed);
                return;
              }
              const anchor = document.createElement("a");
              anchor.href = canvas.toDataURL("image/png");
              anchor.download = `shaiqa-${venue.slug}-qr.png`;
              anchor.click();
              toast.success(messages.toast.pngSaved);
            }}
          >
            {messages.venue.png}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>{messages.venue.print}</Button>
        </div>
        {failed ? <p className="mt-3 text-sm text-destructive">{messages.toast.pngFailed}</p> : null}
      </div>
      <article className="qr-print-card mx-auto w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 text-center text-black">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{messages.brand}</p>
        <h2 className="mt-2 font-display text-2xl">{venue.name}</h2>
        <p className="mt-1 text-sm">{caption}</p>
        <canvas ref={canvasRef} className="mx-auto mt-4 max-w-full" />
        <p className="mt-4 font-display text-xl">{messages.venue.printPhrase}</p>
        <p className="mt-2 break-all text-xs text-zinc-500">{url}</p>
      </article>
    </div>
  );
}
