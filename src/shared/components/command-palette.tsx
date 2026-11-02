import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDemoDb } from "../../app/hooks.ts";
import { useMessages } from "../i18n/context.ts";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog.tsx";
import { ResetDemoButton } from "./locale-and-reset.tsx";

export function CommandPalette() {
  const messages = useMessages();
  const navigate = useNavigate();
  const db = useDemoDb();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const places = [
    [messages.nav.home, "/"],
    [messages.nav.demo, "/demo"],
    [messages.nav.dj, "/dj"],
    [messages.nav.requests, "/dj/requests"],
    [messages.nav.queue, "/dj/queue"],
    [messages.nav.history, "/dj/history"],
    [messages.nav.venue, "/venue"],
    [messages.nav.settings, "/venue/settings"],
    [messages.nav.catalog, "/venue/catalog"],
    [messages.nav.qr, "/venue/qr"],
    [messages.nav.admin, "/admin"],
  ] as const;

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 right-4 z-40 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm shadow-lg"
        onClick={() => setOpen(true)}
      >
        {messages.openCommand}
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{messages.commandKbd}</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0" hideClose>
          <DialogTitle className="sr-only">{messages.command.title}</DialogTitle>
          <Command label={messages.command.title} className="bg-popover text-foreground">
            <Command.Input
              placeholder={messages.command.placeholder}
              className="h-12 w-full border-b border-border bg-transparent px-4 text-base outline-none"
            />
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-sm text-muted-foreground">{messages.command.empty}</Command.Empty>
              <Command.Group heading={messages.command.places} className="text-xs text-muted-foreground">
                {places.map(([label, to]) => (
                  <Command.Item
                    key={to}
                    value={`${label} ${to}`}
                    onSelect={() => go(to)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-accent"
                  >
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading={messages.command.venues} className="mt-2 text-xs text-muted-foreground">
                {(db.data?.venues ?? []).map((venue) => (
                  <Command.Item
                    key={venue.id}
                    value={`${venue.name} ${venue.city} ${venue.slug}`}
                    onSelect={() => go(`/v/${venue.slug}`)}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-accent"
                  >
                    {venue.name}
                    <span className="ml-2 text-muted-foreground">{venue.city}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading={messages.command.actions} className="mt-2 px-2 pb-2">
                <ResetDemoButton variant="outline" />
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
