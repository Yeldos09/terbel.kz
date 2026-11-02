import { DomainError } from "./errors.ts";
import { assertBid } from "./pricing.ts";
import { appendToQueue, removeFromQueue, reindexQueue } from "./queue.ts";
import type { DemoDatabase, MusicRequest, Track, Venue, VenueMode } from "./types.ts";

function nowIso(): string {
  return new Date().toISOString();
}

export function requireVenue(db: DemoDatabase, venueId: string): Venue {
  const venue = db.venues.find((item) => item.id === venueId);
  if (!venue) throw new DomainError("venue_not_found");
  return venue;
}

export function requireRequest(db: DemoDatabase, requestId: string): MusicRequest {
  const request = db.requests.find((item) => item.id === requestId);
  if (!request) throw new DomainError("request_missing");
  return request;
}

function requireEnabledTrack(db: DemoDatabase, trackId: string, venueId: string): Track {
  const track = db.tracks.find((item) => item.id === trackId && item.venueId === venueId);
  if (!track || !track.enabled) throw new DomainError("track_unavailable");
  return track;
}

function cleanGuest(name: string, table: string, note: string): { guestName: string; tableLabel: string; note: string } {
  const guestName = name.trim();
  const tableLabel = table.trim();
  const cleanNote = note.trim();
  if (guestName.length < 1 || guestName.length > 40) throw new DomainError("guest_name");
  if (tableLabel.length < 1 || tableLabel.length > 24) throw new DomainError("guest_table");
  if (cleanNote.length > 140) throw new DomainError("guest_note");
  return { guestName, tableLabel, note: cleanNote };
}

function assertOpenMode(venue: Venue, mode: VenueMode): void {
  if (!venue.isOpen) throw new DomainError("venue_closed");
  if (venue.mode !== mode) throw new DomainError("wrong_mode");
}

export interface CreateDjInput {
  venueId: string;
  trackId: string;
  guestName: string;
  tableLabel: string;
  note: string;
  amountKzt: number;
}

export function createDjRequest(db: DemoDatabase, input: CreateDjInput, at = nowIso()): string {
  const venue = requireVenue(db, input.venueId);
  assertOpenMode(venue, "DJ");
  const track = requireEnabledTrack(db, input.trackId, venue.id);
  assertBid(input.amountKzt, venue.minBidKzt);
  const guest = cleanGuest(input.guestName, input.tableLabel, input.note);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.parse(at) + venue.acceptWindowMinutes * 60_000).toISOString();
  db.requests.push({
    id,
    venueId: venue.id,
    trackId: track.id,
    trackTitle: track.title,
    trackArtist: track.artist,
    coverHue: track.coverHue,
    coverUrl: track.coverUrl,
    ...guest,
    amountKzt: input.amountKzt,
    status: "PENDING",
    paymentStatus: "MOCK_HOLD",
    mode: "DJ",
    createdAt: at,
    updatedAt: at,
    expiresAt,
    decisionCode: "",
  });
  return id;
}

export interface CreateDraftInput {
  venueId: string;
  trackId: string;
  guestName: string;
  tableLabel: string;
  note: string;
}

export function createCheckoutDraft(db: DemoDatabase, input: CreateDraftInput, at = nowIso()): string {
  const venue = requireVenue(db, input.venueId);
  assertOpenMode(venue, "JUKEBOX");
  const track = requireEnabledTrack(db, input.trackId, venue.id);
  const guest = cleanGuest(input.guestName, input.tableLabel, input.note);
  const id = crypto.randomUUID();
  db.drafts.push({
    id,
    venueId: venue.id,
    trackId: track.id,
    ...guest,
    amountKzt: track.priceKzt,
    createdAt: at,
  });
  return id;
}

export function confirmCheckout(db: DemoDatabase, draftId: string, at = nowIso()): string {
  const draft = db.drafts.find((item) => item.id === draftId);
  if (!draft) throw new DomainError("draft_missing");
  const venue = requireVenue(db, draft.venueId);
  assertOpenMode(venue, "JUKEBOX");
  const track = requireEnabledTrack(db, draft.trackId, venue.id);
  db.requests.push({
    id: draft.id,
    venueId: venue.id,
    trackId: track.id,
    trackTitle: track.title,
    trackArtist: track.artist,
    coverHue: track.coverHue,
    coverUrl: track.coverUrl,
    guestName: draft.guestName,
    tableLabel: draft.tableLabel,
    note: draft.note,
    amountKzt: track.priceKzt,
    status: "QUEUED",
    paymentStatus: "MOCK_PAID",
    mode: "JUKEBOX",
    createdAt: at,
    updatedAt: at,
    expiresAt: at,
    decisionCode: "",
  });
  db.drafts = db.drafts.filter((item) => item.id !== draft.id);
  appendToQueue(db, venue.id, draft.id);
  return draft.id;
}

export function acceptRequest(db: DemoDatabase, requestId: string, at = nowIso()): void {
  const request = requireRequest(db, requestId);
  if (request.status !== "PENDING") throw new DomainError("not_pending");
  request.status = "ACCEPTED";
  request.updatedAt = at;
}

export function enqueueRequest(db: DemoDatabase, requestId: string, at = nowIso()): void {
  const request = requireRequest(db, requestId);
  if (request.status !== "PENDING" && request.status !== "ACCEPTED") {
    throw new DomainError("not_queueable");
  }
  request.status = "QUEUED";
  request.updatedAt = at;
  appendToQueue(db, request.venueId, request.id);
}

export function rejectRequest(db: DemoDatabase, requestId: string, at = nowIso()): void {
  const request = requireRequest(db, requestId);
  if (request.status !== "PENDING" && request.status !== "ACCEPTED") {
    throw new DomainError("not_pending");
  }
  request.status = "REJECTED";
  request.paymentStatus = "MOCK_RELEASED";
  request.decisionCode = "dj_rejected";
  request.updatedAt = at;
  removeFromQueue(db, request.id, request.venueId);
}

export function startPlaying(db: DemoDatabase, requestId: string, at = nowIso()): void {
  const request = requireRequest(db, requestId);
  if (request.status !== "QUEUED") throw new DomainError("not_queued");
  for (const other of db.requests) {
    if (other.venueId === request.venueId && other.status === "PLAYING") {
      other.status = "COMPLETED";
      other.updatedAt = at;
      db.queue = db.queue.filter((item) => item.requestId !== other.id);
    }
  }
  request.status = "PLAYING";
  request.updatedAt = at;
  reindexQueue(db, request.venueId);
}

export function completePlaying(db: DemoDatabase, requestId: string, at = nowIso()): void {
  const request = requireRequest(db, requestId);
  if (request.status !== "PLAYING") throw new DomainError("not_playing");
  request.status = "COMPLETED";
  request.updatedAt = at;
  removeFromQueue(db, request.id, request.venueId);
}

export function returnToQueue(db: DemoDatabase, requestId: string, at = nowIso()): void {
  const request = requireRequest(db, requestId);
  if (request.status !== "PLAYING") throw new DomainError("not_playing");
  request.status = "QUEUED";
  request.updatedAt = at;
  const item = db.queue.find((entry) => entry.requestId === request.id);
  if (item) item.position = 10_000;
  reindexQueue(db, request.venueId);
}

export function dequeueToAccepted(db: DemoDatabase, requestId: string, at = nowIso()): void {
  const request = requireRequest(db, requestId);
  if (request.status !== "QUEUED") throw new DomainError("not_queued");
  request.status = "ACCEPTED";
  request.updatedAt = at;
  removeFromQueue(db, request.id, request.venueId);
}

export function expireStale(db: DemoDatabase, at = nowIso()): boolean {
  const now = Date.parse(at);
  let changed = false;
  for (const request of db.requests) {
    const waiting = request.status === "PENDING" || request.status === "ACCEPTED";
    if (!waiting || Date.parse(request.expiresAt) > now) continue;
    request.status = "EXPIRED";
    request.paymentStatus = "EXPIRED";
    request.decisionCode = "expired";
    request.updatedAt = at;
    db.queue = db.queue.filter((item) => item.requestId !== request.id);
    changed = true;
  }
  return changed;
}
