import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DEMO_QUERY_KEY } from "../../app/query-key.ts";
import { registerVenueSchema, type RegisterVenueInput } from "../../domain/schemas.ts";
import type { Account, VenueKind, VenueMode } from "../../domain/types.ts";
import { repository } from "../../mocks/repository.ts";
import { useMessages } from "../../shared/i18n/context.ts";
import { describeError } from "../../shared/lib/describe-error.ts";
import { Button } from "../../shared/ui/button.tsx";
import { Field, Input } from "../../shared/ui/field.tsx";
import { SelectField } from "../../shared/ui/select.tsx";

export function RegisterVenueForm() {
  const messages = useMessages();
  const client = useQueryClient();
  const [created, setCreated] = useState<Account | null>(null);
  const form = useForm<RegisterVenueInput>({
    resolver: zodResolver(registerVenueSchema) as Resolver<RegisterVenueInput>,
    defaultValues: {
      name: "",
      city: "Алматы",
      kind: "bar",
      mode: "DJ",
      slug: "",
      ownerName: "",
      email: "",
      password: "",
    },
  });
  const kind = form.watch("kind");
  const mode = form.watch("mode");
  const kinds = (["bar", "restaurant", "lounge", "karaoke"] as const).map((value) => ({
    value,
    label: messages.kind[value],
  }));
  const modes = (["DJ", "JUKEBOX"] as const).map((value) => ({
    value,
    label: messages.mode[value],
  }));

  return (
    <section className="grid gap-4 rounded-2xl border border-border p-4">
      <div>
        <h2 className="font-display text-2xl">{messages.cabinet.registerTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{messages.cabinet.registerLead}</p>
      </div>
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => {
          try {
            const account = repository.registerVenue(values);
            setCreated(account);
            form.reset({ ...values, name: "", slug: "", ownerName: "", email: "", password: "" });
            void client.invalidateQueries({ queryKey: DEMO_QUERY_KEY });
            toast.success(messages.toast.cabinetCreated);
          } catch (error) {
            toast.error(describeError(error, messages));
          }
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={messages.venue.name} htmlFor="reg-name" error={form.formState.errors.name?.message}>
            <Input id="reg-name" {...form.register("name")} />
          </Field>
          <Field label={messages.venue.city} htmlFor="reg-city" error={form.formState.errors.city?.message}>
            <Input id="reg-city" {...form.register("city")} />
          </Field>
          <Field label={messages.venue.kind} htmlFor="reg-kind">
            <SelectField
              id="reg-kind"
              ariaLabel={messages.venue.kind}
              value={kind}
              onValueChange={(value) => form.setValue("kind", value as VenueKind)}
              options={kinds}
            />
          </Field>
          <Field label={messages.venue.mode} htmlFor="reg-mode">
            <SelectField
              id="reg-mode"
              ariaLabel={messages.venue.mode}
              value={mode}
              onValueChange={(value) => form.setValue("mode", value as VenueMode)}
              options={modes}
            />
          </Field>
          <Field label={messages.cabinet.slug} htmlFor="reg-slug" hint={messages.cabinet.slugHint} error={form.formState.errors.slug?.message}>
            <Input id="reg-slug" autoComplete="off" {...form.register("slug")} />
          </Field>
          <Field label={messages.cabinet.owner} htmlFor="reg-owner" error={form.formState.errors.ownerName?.message}>
            <Input id="reg-owner" {...form.register("ownerName")} />
          </Field>
          <Field label={messages.cabinet.email} htmlFor="reg-email" error={form.formState.errors.email?.message}>
            <Input id="reg-email" type="email" autoComplete="off" {...form.register("email")} />
          </Field>
          <Field label={messages.cabinet.password} htmlFor="reg-password" error={form.formState.errors.password?.message}>
            <Input id="reg-password" type="text" autoComplete="new-password" {...form.register("password")} />
          </Field>
        </div>
        <Button type="submit" className="w-fit">{messages.cabinet.registerTitle}</Button>
      </form>
      {created ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm leading-6">
          <p className="font-semibold">{messages.cabinet.created}</p>
          <p className="mt-1">{messages.cabinet.createdLead}</p>
          <p className="mt-2">
            {created.name} · {created.email} · {created.password}
          </p>
        </div>
      ) : null}
    </section>
  );
}
