import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useRepoMutation } from "../../app/hooks.ts";
import { quickBidAmounts } from "../../domain/pricing.ts";
import { djOrderSchema, guestDetailsSchema, type DjOrderInput, type GuestDetails } from "../../domain/schemas.ts";
import type { Track, Venue } from "../../domain/types.ts";
import { repository } from "../../mocks/repository.ts";
import { useMessages } from "../../shared/i18n/context.ts";
import { formatKzt, interpolate } from "../../shared/lib/format.ts";
import { cn } from "../../shared/lib/utils.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Field, Input, Textarea } from "../../shared/ui/field.tsx";

function fieldError(message: string | undefined): string | undefined {
  return message;
}

export function OrderForm({
  venue,
  track,
  onDone,
}: {
  venue: Venue;
  track: Track;
  onDone: (result: { kind: "request" | "draft"; id: string }) => void;
}) {
  if (venue.mode === "DJ") return <DjOrderForm venue={venue} track={track} onDone={onDone} />;
  return <JukeboxOrderForm venue={venue} track={track} onDone={onDone} />;
}

function DjOrderForm({
  venue,
  track,
  onDone,
}: {
  venue: Venue;
  track: Track;
  onDone: (result: { kind: "request" | "draft"; id: string }) => void;
}) {
  const messages = useMessages();
  const action = useRepoMutation();
  const schema = djOrderSchema(venue.minBidKzt);
  const form = useForm<DjOrderInput>({
    resolver: zodResolver(schema) as Resolver<DjOrderInput>,
    defaultValues: { guestName: "", tableLabel: "", note: "", amountKzt: venue.minBidKzt },
  });
  const amount = form.watch("amountKzt");
  const amounts = quickBidAmounts(venue.minBidKzt);
  const nameError = fieldError(form.formState.errors.guestName?.message);
  const tableError = fieldError(form.formState.errors.tableLabel?.message);
  const noteError = fieldError(form.formState.errors.note?.message);
  const amountError = fieldError(form.formState.errors.amountKzt?.message);

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => {
        let id = "";
        action.mutate(
          () => {
            id = repository.createDjRequest({
              venueId: venue.id,
              trackId: track.id,
              guestName: values.guestName,
              tableLabel: values.tableLabel,
              note: values.note,
              amountKzt: values.amountKzt,
            });
          },
          {
            onSuccess: () => {
              toast.success(messages.toast.requestCreated);
              onDone({ kind: "request", id });
            },
          },
        );
      })}
    >
      <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-warning">
        {messages.guest.warning}
      </p>
      <p className="text-sm text-muted-foreground">{interpolate(messages.guest.rulesDj, { min: formatKzt(venue.minBidKzt) })}</p>
      <Field label={messages.guest.name} htmlFor="guest-name" error={nameError}>
        <Input id="guest-name" autoComplete="name" aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "guest-name-error" : undefined} {...form.register("guestName")} />
      </Field>
      <Field label={`${venue.tableLabel}: ${messages.guest.table}`} htmlFor="guest-table" error={tableError}>
        <Input id="guest-table" aria-invalid={Boolean(tableError)} aria-describedby={tableError ? "guest-table-error" : undefined} {...form.register("tableLabel")} />
      </Field>
      <Field label={messages.guest.note} htmlFor="guest-note" hint={messages.guest.noteOptional} error={noteError}>
        <Textarea id="guest-note" aria-invalid={Boolean(noteError)} aria-describedby={noteError ? "guest-note-error" : undefined} {...form.register("note")} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{messages.guest.quick}</legend>
        <div className="flex flex-wrap gap-2">
          {amounts.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={amount === value}
              onClick={() => form.setValue("amountKzt", value, { shouldValidate: true })}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold",
                amount === value ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {formatKzt(value)}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label={messages.guest.customAmount} htmlFor="guest-amount" error={amountError}>
        <Input
          id="guest-amount"
          type="number"
          inputMode="numeric"
          min={venue.minBidKzt}
          step={100}
          aria-invalid={Boolean(amountError)}
          aria-describedby={amountError ? "guest-amount-error" : undefined}
          {...form.register("amountKzt", { valueAsNumber: true })}
        />
      </Field>
      <Button type="submit" size="lg" disabled={!venue.isOpen || action.isPending}>
        {action.isPending ? messages.guest.submitting : messages.guest.submitDj}
      </Button>
      {!venue.isOpen ? <p className="text-sm text-muted-foreground">{messages.guest.closed}</p> : null}
    </form>
  );
}

function JukeboxOrderForm({
  venue,
  track,
  onDone,
}: {
  venue: Venue;
  track: Track;
  onDone: (result: { kind: "request" | "draft"; id: string }) => void;
}) {
  const messages = useMessages();
  const action = useRepoMutation();
  const form = useForm<GuestDetails>({
    resolver: zodResolver(guestDetailsSchema) as Resolver<GuestDetails>,
    defaultValues: { guestName: "", tableLabel: "", note: "" },
  });
  const nameError = form.formState.errors.guestName?.message;
  const tableError = form.formState.errors.tableLabel?.message;
  const noteError = form.formState.errors.note?.message;

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => {
        let id = "";
        action.mutate(
          () => {
            id = repository.createCheckoutDraft({
              venueId: venue.id,
              trackId: track.id,
              guestName: values.guestName,
              tableLabel: values.tableLabel,
              note: values.note,
            });
          },
          {
            onSuccess: () => {
              toast.success(messages.toast.draftCreated);
              onDone({ kind: "draft", id });
            },
          },
        );
      })}
    >
      <p className="text-sm text-muted-foreground">{messages.guest.rulesBox}</p>
      <p className="font-display text-2xl text-primary">{formatKzt(track.priceKzt)}</p>
      <Field label={messages.guest.name} htmlFor="box-name" error={nameError}>
        <Input id="box-name" autoComplete="name" aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "box-name-error" : undefined} {...form.register("guestName")} />
      </Field>
      <Field label={`${venue.tableLabel}: ${messages.guest.table}`} htmlFor="box-table" error={tableError}>
        <Input id="box-table" aria-invalid={Boolean(tableError)} aria-describedby={tableError ? "box-table-error" : undefined} {...form.register("tableLabel")} />
      </Field>
      <Field label={messages.guest.note} htmlFor="box-note" hint={messages.guest.noteOptional} error={noteError}>
        <Textarea id="box-note" aria-invalid={Boolean(noteError)} aria-describedby={noteError ? "box-note-error" : undefined} {...form.register("note")} />
      </Field>
      <Button type="submit" size="lg" disabled={!venue.isOpen || action.isPending}>
        {action.isPending ? messages.guest.submitting : messages.guest.submitBox}
      </Button>
      {!venue.isOpen ? <p className="text-sm text-muted-foreground">{messages.guest.closed}</p> : null}
    </form>
  );
}
