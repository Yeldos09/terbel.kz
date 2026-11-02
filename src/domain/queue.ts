import { DomainError } from "./errors.ts";
import type { DemoDatabase, QueueItem } from "./types.ts";

export function venueQueue(db: DemoDatabase, venueId: string): QueueItem[] {
  return db.queue
    .filter((item) => item.venueId === venueId)
    .sort((a, b) => a.position - b.position);
}

export function reindexQueue(db: DemoDatabase, venueId: string): void {
  const items = venueQueue(db, venueId);
  const playingId = db.requests.find(
    (request) => request.venueId === venueId && request.status === "PLAYING",
  )?.id;
  const playing = playingId ? items.filter((item) => item.requestId === playingId) : [];
  const rest = items.filter((item) => item.requestId !== playingId);
  const ordered = [...playing, ...rest];
  ordered.forEach((item, index) => {
    item.position = index + 1;
  });
  db.queue = [...db.queue.filter((item) => item.venueId !== venueId), ...ordered];
}

export function appendToQueue(db: DemoDatabase, venueId: string, requestId: string): void {
  if (db.queue.some((item) => item.requestId === requestId)) return;
  const max = venueQueue(db, venueId).reduce((highest, item) => Math.max(highest, item.position), 0);
  db.queue.push({
    id: `q_${requestId}`,
    requestId,
    venueId,
    position: max + 1,
  });
  reindexQueue(db, venueId);
}

export function removeFromQueue(db: DemoDatabase, requestId: string, venueId: string): void {
  db.queue = db.queue.filter((item) => item.requestId !== requestId);
  reindexQueue(db, venueId);
}

export function moveQueueItem(
  db: DemoDatabase,
  venueId: string,
  requestId: string,
  direction: -1 | 1,
): void {
  const request = db.requests.find((item) => item.id === requestId);
  if (!request || request.venueId !== venueId) throw new DomainError("queue_missing");
  if (request.status === "PLAYING") throw new DomainError("queue_playing_pinned");
  const items = venueQueue(db, venueId);
  const index = items.findIndex((item) => item.requestId === requestId);
  if (index < 0) throw new DomainError("queue_missing");
  const target = index + direction;
  if (target < 0) throw new DomainError("queue_edge_up");
  if (target >= items.length) throw new DomainError("queue_edge_down");
  const targetRequest = db.requests.find((item) => item.id === items[target]?.requestId);
  if (targetRequest?.status === "PLAYING") throw new DomainError("queue_playing_pinned");
  const current = items[index];
  const next = items[target];
  if (!current || !next) throw new DomainError("queue_missing");
  const swap = current.position;
  current.position = next.position;
  next.position = swap;
  reindexQueue(db, venueId);
}

export function reorderQueue(
  db: DemoDatabase,
  venueId: string,
  activeId: string,
  overId: string,
): void {
  if (activeId === overId) return;
  const activeRequest = db.requests.find((item) => item.id === activeId);
  const overRequest = db.requests.find((item) => item.id === overId);
  if (!activeRequest || !overRequest) throw new DomainError("queue_reorder");
  if (activeRequest.status === "PLAYING" || overRequest.status === "PLAYING") {
    throw new DomainError("queue_playing_pinned");
  }
  const items = venueQueue(db, venueId);
  const active = items.find((item) => item.requestId === activeId);
  if (!active) throw new DomainError("queue_reorder");
  const without = items.filter((item) => item.requestId !== activeId);
  const overIndex = without.findIndex((item) => item.requestId === overId);
  if (overIndex < 0) throw new DomainError("queue_reorder");
  without.splice(overIndex, 0, active);
  without.forEach((item, index) => {
    item.position = index + 1;
  });
  db.queue = [...db.queue.filter((item) => item.venueId !== venueId), ...without];
  reindexQueue(db, venueId);
}

export function buildQueue(requests: DemoDatabase["requests"]): QueueItem[] {
  const byVenue = new Map<string, DemoDatabase["requests"]>();
  for (const request of requests) {
    if (request.status !== "QUEUED" && request.status !== "PLAYING") continue;
    const list = byVenue.get(request.venueId) ?? [];
    list.push(request);
    byVenue.set(request.venueId, list);
  }
  const items: QueueItem[] = [];
  for (const [venueId, list] of byVenue) {
    const ordered = [
      ...list.filter((request) => request.status === "PLAYING"),
      ...list.filter((request) => request.status === "QUEUED"),
    ];
    ordered.forEach((request, index) => {
      items.push({
        id: `q_${request.id}`,
        requestId: request.id,
        venueId,
        position: index + 1,
      });
    });
  }
  return items;
}
