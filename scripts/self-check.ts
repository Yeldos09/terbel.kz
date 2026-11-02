import { DomainError } from "../src/domain/errors.ts";
import {
  acceptRequest,
  confirmCheckout,
  createCheckoutDraft,
  createDjRequest,
  enqueueRequest,
  expireStale,
  rejectRequest,
  startPlaying,
} from "../src/domain/requests.ts";
import { moveQueueItem, reorderQueue } from "../src/domain/queue.ts";
import { REQUEST_STATUSES, type DemoDatabase } from "../src/domain/types.ts";
import { createSeed } from "../src/mocks/seed.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function clone(db: DemoDatabase): DemoDatabase {
  return structuredClone(db);
}

const seed = createSeed(Date.parse("2026-11-02T12:00:00.000Z"));
assert(seed.tracks.length >= 40, "нужны десятки треков");
assert(seed.venues.length >= 5, "нужно несколько заведений");
for (const status of REQUEST_STATUSES) {
  assert(seed.requests.some((request) => request.status === status), `нет статуса ${status}`);
}
for (const venue of seed.venues) {
  const rows = seed.queue.filter((item) => item.venueId === venue.id).sort((a, b) => a.position - b.position);
  rows.forEach((item, index) => assert(item.position === index + 1, "позиции очереди сбились"));
  const playing = seed.requests.find((request) => request.venueId === venue.id && request.status === "PLAYING");
  if (playing) assert(rows[0]?.requestId === playing.id, "эфир не первый");
}

const loft = seed.venues.find((venue) => venue.slug === "loft-47");
const kitchen = seed.venues.find((venue) => venue.slug === "nochnaya-kuhnya");
assert(loft && kitchen, "нет демо-заведений");
const loftTrack = seed.tracks.find((track) => track.venueId === loft.id && track.enabled);
const kitchenTrack = seed.tracks.find((track) => track.venueId === kitchen.id && track.enabled);
assert(loftTrack && kitchenTrack, "нет треков");

const low = clone(seed);
let lowFailed = false;
try {
  createDjRequest(low, {
    venueId: loft.id,
    trackId: loftTrack.id,
    guestName: "Тест",
    tableLabel: "1",
    note: "",
    amountKzt: loft.minBidKzt - 1,
  });
} catch (error) {
  lowFailed = error instanceof DomainError && error.code === "bid_too_low";
}
assert(lowFailed, "низкая ставка должна отклоняться");

const dj = clone(seed);
const requestId = createDjRequest(dj, {
  venueId: loft.id,
  trackId: loftTrack.id,
  guestName: "Тест",
  tableLabel: "1",
  note: "тихо",
  amountKzt: loft.minBidKzt,
});
const created = dj.requests.find((request) => request.id === requestId);
assert(created?.status === "PENDING" && created.paymentStatus === "MOCK_HOLD", "заявка DJ не PENDING");
assert(!dj.queue.some((item) => item.requestId === requestId), "заявка не должна сразу быть в очереди");
enqueueRequest(dj, requestId);
assert(dj.requests.find((request) => request.id === requestId)?.status === "QUEUED", "нет очереди");

const queued = dj.queue.filter((item) => item.venueId === loft.id).sort((a, b) => a.position - b.position);
const movable = queued.find((item) => dj.requests.find((request) => request.id === item.requestId)?.status === "QUEUED");
assert(movable, "нечего двигать");
const before = movable.position;
if (before < queued.length) {
  moveQueueItem(dj, loft.id, movable.requestId, 1);
  const after = dj.queue.find((item) => item.requestId === movable.requestId);
  assert(after && after.position !== before, "кнопка вниз не сдвинула очередь");
  moveQueueItem(dj, loft.id, movable.requestId, -1);
}

const playing = dj.requests.find((request) => request.venueId === loft.id && request.status === "PLAYING");
assert(playing, "нет эфира");
startPlaying(dj, requestId);
assert(dj.requests.find((request) => request.id === playing.id)?.status === "COMPLETED", "прошлый эфир не завершился");
assert(dj.requests.find((request) => request.id === requestId)?.status === "PLAYING", "новый эфир не включился");

const second = createDjRequest(dj, {
  venueId: loft.id,
  trackId: loftTrack.id,
  guestName: "Второй",
  tableLabel: "2",
  note: "",
  amountKzt: loft.minBidKzt + 500,
});
rejectRequest(dj, second);
const rejected = dj.requests.find((request) => request.id === second);
assert(rejected?.status === "REJECTED" && rejected.paymentStatus === "MOCK_RELEASED", "отказ без учебного статуса оплаты");
assert(rejected?.decisionCode === "dj_rejected", "нет кода отказа");

const box = clone(seed);
const draftId = createCheckoutDraft(box, {
  venueId: kitchen.id,
  trackId: kitchenTrack.id,
  guestName: "Гость",
  tableLabel: "4",
  note: "",
});
confirmCheckout(box, draftId);
const paid = box.requests.find((request) => request.id === draftId);
assert(paid?.status === "QUEUED" && paid.paymentStatus === "MOCK_PAID", "джукбокс не встал в очередь");
assert(!box.drafts.some((draft) => draft.id === draftId), "черновик не закрылся");

const expiring = clone(seed);
const pending = expiring.requests.find((request) => request.status === "PENDING");
assert(pending, "нет ожидания");
pending.expiresAt = "2020-01-01T00:00:00.000Z";
assert(expireStale(expiring, "2026-11-02T12:00:00.000Z"), "просрочка не сработала");
assert(expiring.requests.find((request) => request.id === pending.id)?.status === "EXPIRED", "статус не EXPIRED");

acceptRequest(clone(seed), seed.requests.find((request) => request.id === "req_loft_pending_a")?.id ?? "");
const reorderDb = clone(seed);
const loftQueue = reorderDb.queue.filter((item) => item.venueId === loft.id && reorderDb.requests.find((request) => request.id === item.requestId)?.status === "QUEUED");
if (loftQueue.length >= 2) {
  const first = loftQueue[0];
  const secondItem = loftQueue[1];
  if (first && secondItem) reorderQueue(reorderDb, loft.id, secondItem.requestId, first.requestId);
}

console.log("self-check ok", seed.tracks.length, "tracks", seed.requests.length, "requests");
