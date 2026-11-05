import type { PaymentStatus, RequestStatus } from "../../domain/types.ts";
import { useMessages } from "../i18n/context.ts";
import { cn } from "../lib/utils.ts";
import { Badge } from "../ui/misc.tsx";

const tones: Record<RequestStatus, string> = {
  PENDING: "bg-[var(--tone-pending-bg)] text-[var(--tone-pending-fg)]",
  ACCEPTED: "bg-[var(--tone-accepted-bg)] text-[var(--tone-accepted-fg)]",
  QUEUED: "bg-[var(--tone-queued-bg)] text-[var(--tone-queued-fg)]",
  PLAYING: "bg-primary/20 text-primary",
  COMPLETED: "bg-accent text-subtle",
  REJECTED: "bg-destructive/20 text-[var(--tone-rejected-fg)]",
  EXPIRED: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const messages = useMessages();
  return <Badge className={cn(tones[status])}>{messages.status[status]}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const messages = useMessages();
  return <Badge className="bg-muted text-subtle">{messages.payment[status]}</Badge>;
}
