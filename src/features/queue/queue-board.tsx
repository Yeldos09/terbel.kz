import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useDemoDb, useRepoMutation } from "../../app/hooks.ts";
import { canManageVenue } from "../auth/access.ts";
import { useSession } from "../auth/session.ts";
import { queueViews } from "../../domain/selectors.ts";
import type { QueueView } from "../../domain/types.ts";
import { repository } from "../../mocks/repository.ts";
import { CoverArt } from "../../shared/components/cover-art.tsx";
import { StatusBadge } from "../../shared/components/status-badge.tsx";
import { useMessages } from "../../shared/i18n/context.ts";
import { formatKzt } from "../../shared/lib/format.ts";
import { Button } from "../../shared/ui/button.tsx";
import { EmptyState } from "../../shared/ui/misc.tsx";
import { Tooltip } from "../../shared/ui/tooltip.tsx";

export function QueueBoard({ venueId, guestPath }: { venueId: string; guestPath: string }) {
  const messages = useMessages();
  const session = useSession();
  const db = useDemoDb();
  const action = useRepoMutation();
  const manage = canManageVenue(session, venueId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const rows = db.data ? queueViews(db.data, venueId) : [];
  const run = (task: () => void, success: string) => {
    action.mutate(task, { onSuccess: () => toast.success(success) });
  };

  if (!db.data) return null;
  if (rows.length === 0) {
    return (
      <EmptyState
        title={messages.dj.emptyQueue}
        text={messages.dj.lead}
        action={
          <Button asChild>
            <Link to={guestPath}>{messages.demo.openGuest}</Link>
          </Button>
        }
      />
    );
  }

  const onDragEnd = (event: DragEndEvent) => {
    if (!manage) return;
    const overId = event.over?.id;
    if (!overId || event.active.id === overId) return;
    run(
      () => repository.reorderQueue(venueId, String(event.active.id), String(overId)),
      messages.toast.moved,
    );
  };

  return (
    <div className="grid gap-3">
      {manage ? null : <p className="text-sm text-muted-foreground">{messages.cabinet.staffQueue}</p>}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={rows.map((row) => row.request.id)} strategy={verticalListSortingStrategy}>
        <ol className="grid gap-3">
          {rows.map((row, index) => (
            <QueueRow
              key={row.request.id}
              row={row}
              index={index}
              total={rows.length}
              onMove={(direction) => run(() => repository.moveQueue(venueId, row.request.id, direction), messages.toast.moved)}
              onAir={() => run(() => repository.startPlaying(row.request.id), messages.toast.playing)}
              onFinish={() => run(() => repository.completePlaying(row.request.id), messages.toast.completed)}
              onReturn={() => run(() => repository.returnToQueue(row.request.id), messages.toast.returned)}
              onDequeue={() => run(() => repository.dequeueToAccepted(row.request.id), messages.toast.dequeued)}
              manage={manage}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
    </div>
  );
}

function QueueRow({
  row,
  index,
  total,
  onMove,
  onAir,
  onFinish,
  onReturn,
  onDequeue,
  manage,
}: {
  row: QueueView;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onAir: () => void;
  onFinish: () => void;
  onReturn: () => void;
  onDequeue: () => void;
  manage: boolean;
}) {
  const messages = useMessages();
  const playing = row.request.status === "PLAYING";
  const sortable = useSortable({ id: row.request.id, disabled: playing || !manage });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };
  const cannotUp = playing || index === 0;
  const cannotDown = playing || index === total - 1;

  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      className="rounded-2xl border border-border bg-card p-3"
    >
      <div className="flex gap-3">
        {manage ? (
          <Tooltip label={messages.dj.drag}>
            <button
              type="button"
              className="mt-1 cursor-grab text-muted-foreground disabled:cursor-not-allowed"
              role="button"
              tabIndex={playing ? -1 : 0}
              aria-roledescription="sortable"
              aria-disabled={playing}
              aria-label={messages.dj.drag}
              disabled={playing}
              {...(sortable.listeners as HTMLAttributes<HTMLButtonElement> | undefined)}
            >
              <GripVertical className="h-5 w-5" />
            </button>
          </Tooltip>
        ) : null}
        <CoverArt
          title={row.request.trackTitle}
          artist={row.request.trackArtist}
          hue={row.request.coverHue}
          coverUrl={row.track?.coverUrl ?? row.request.coverUrl}
          className="h-14 w-14 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">#{row.item.position}</span>
            <StatusBadge status={row.request.status} />
          </div>
          <p className="truncate font-semibold">{row.request.trackTitle}</p>
          <p className="truncate text-sm text-muted-foreground">
            {row.request.trackArtist} · {row.request.guestName} · {formatKzt(row.request.amountKzt)}
          </p>
        </div>
      </div>
      {manage ? <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={cannotUp} aria-label={cannotUp ? messages.errors.queue_edge_up : messages.dj.up} onClick={() => onMove(-1)}>
          {messages.dj.up}
        </Button>
        <Button size="sm" variant="secondary" disabled={cannotDown} aria-label={cannotDown ? messages.errors.queue_edge_down : messages.dj.down} onClick={() => onMove(1)}>
          {messages.dj.down}
        </Button>
        {row.request.status === "QUEUED" ? (
          <>
            <Button size="sm" onClick={onAir}>{messages.dj.toAir}</Button>
            <Button size="sm" variant="outline" onClick={onDequeue}>{messages.dj.takeOff}</Button>
          </>
        ) : null}
        {playing ? (
          <>
            <Button size="sm" onClick={onFinish}>{messages.dj.finish}</Button>
            <Button size="sm" variant="outline" onClick={onReturn}>{messages.dj.return}</Button>
          </>
        ) : null}
      </div> : null}
    </li>
  );
}
