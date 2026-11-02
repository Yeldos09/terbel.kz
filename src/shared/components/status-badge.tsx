import type { PaymentStatus, RequestStatus } from "../../domain/types.ts";
import { useMessages } from "../i18n/context.ts";
import { cn } from "../lib/utils.ts";
import { Badge } from "../ui/misc.tsx";

const tones: Record<RequestStatus, string> = {
  PENDING: "bg-amber-300/15 text-amber-100",
  ACCEPTED: "bg-sky-300/15 text-sky-100",
  QUEUED: "bg-violet-300/15 text-violet-100",
  PLAYING: "bg-primary/20 text-primary",
  COMPLETED: "bg-white/10 text-zinc-200",
  REJECTED: "bg-destructive/20 text-red-100",
  EXPIRED: "bg-white/5 text-zinc-400",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const messages = useMessages();
  return <Badge className={cn(tones[status])}>{messages.status[status]}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const messages = useMessages();
  return <Badge className="bg-white/5 text-zinc-300">{messages.payment[status]}</Badge>;
}
