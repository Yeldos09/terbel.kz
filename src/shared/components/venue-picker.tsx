import { Link } from "react-router";
import { toast } from "sonner";
import { useDemoDb } from "../../app/hooks.ts";
import { sessionStore, useSession } from "../../features/auth/session.ts";
import type { Venue } from "../../domain/types.ts";
import { repository } from "../../mocks/repository.ts";
import { useMessages } from "../i18n/context.ts";
import { Button } from "../ui/button.tsx";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../ui/menu.tsx";

export function VenuePicker({
  venue,
  which,
}: {
  venue: Venue;
  which: "dj" | "dashboard";
}) {
  const messages = useMessages();
  const session = useSession();
  const db = useDemoDb();
  const locked = session?.role === "venue";

  const leave = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        sessionStore.logout();
        toast.success(messages.toast.loggedOut);
      }}
    >
      {messages.cabinet.logout}
    </Button>
  );

  if (locked && session) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-semibold">{venue.name}</p>
        <p className="text-xs text-faint">{session.email}</p>
        <p className="text-xs leading-5 text-muted-foreground">{messages.cabinet.locked}</p>
        {leave}
      </div>
    );
  }

  if (session?.role === "platform") {
    return (
      <div className="grid gap-2">
        <p className="text-xs text-faint">{session.email}</p>
        <Menu>
          <MenuTrigger asChild>
            <Button variant="outline">{venue.name}</Button>
          </MenuTrigger>
          <MenuContent>
            {(db.data?.venues ?? []).map((item) => (
              <MenuItem
                key={item.id}
                onSelect={() => {
                  if (which === "dj") repository.setActiveDjVenue(item.id);
                  else repository.setActiveDashboardVenue(item.id);
                  toast.success(messages.toast.venueSwitched);
                }}
              >
                {item.name} · {messages.mode[item.mode]}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
        {leave}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Menu>
        <MenuTrigger asChild>
          <Button variant="outline">{venue.name}</Button>
        </MenuTrigger>
        <MenuContent>
          {(db.data?.venues ?? []).map((item) => (
            <MenuItem
              key={item.id}
              onSelect={() => {
                if (which === "dj") repository.setActiveDjVenue(item.id);
                else repository.setActiveDashboardVenue(item.id);
                toast.success(messages.toast.venueSwitched);
              }}
            >
              {item.name} · {messages.mode[item.mode]}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
      <Button asChild size="sm" variant="outline">
        <Link to="/login">{messages.cabinet.enter}</Link>
      </Button>
    </div>
  );
}
