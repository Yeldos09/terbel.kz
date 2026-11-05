import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useRepoMutation } from "../../app/hooks.ts";
import type { MusicRequest } from "../../domain/types.ts";
import { canManageVenue } from "../auth/access.ts";
import { useSession } from "../auth/session.ts";
import { repository } from "../../mocks/repository.ts";
import { ConfirmDialog } from "../../shared/components/confirm-dialog.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { Button } from "../../shared/ui/button.tsx";

export function RequestActions({ request }: { request: MusicRequest }) {
  const messages = useMessages();
  const session = useSession();
  const action = useRepoMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  if (!canManageVenue(session, request.venueId)) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {messages.cabinet.venueDecides}{" "}
        <Link className="text-primary" to="/login?next=/dj/requests">{messages.cabinet.enter}</Link>
      </p>
    );
  }
  const run = (task: () => void, success: string) => {
    action.mutate(task, { onSuccess: () => toast.success(success) });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {request.status === "PENDING" ? (
        <>
          <Button onClick={() => run(() => repository.enqueue(request.id), messages.toast.queued)}>
            {messages.dj.acceptQueue}
          </Button>
          <Button variant="secondary" onClick={() => run(() => repository.accept(request.id), messages.toast.accepted)}>
            {messages.dj.acceptOnly}
          </Button>
        </>
      ) : null}
      {request.status === "ACCEPTED" ? (
        <Button onClick={() => run(() => repository.enqueue(request.id), messages.toast.queued)}>
          {messages.dj.toQueue}
        </Button>
      ) : null}
      {request.status === "PENDING" || request.status === "ACCEPTED" ? (
        <Button variant="destructive" onClick={() => setRejectOpen(true)}>
          {messages.dj.reject}
        </Button>
      ) : null}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={messages.confirm.rejectTitle}
        description={messages.confirm.rejectBody}
        confirmLabel={messages.confirm.rejectAction}
        destructive
        onConfirm={() => run(() => repository.reject(request.id), messages.toast.rejected)}
      />
    </div>
  );
}
