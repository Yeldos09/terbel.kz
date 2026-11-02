import type { DemoDatabase, QueueView, RequestView, Track, Venue } from "./types.ts";
import { venueQueue } from "./queue.ts";

export function venueBySlug(db: DemoDatabase, slug: string): Venue | null {
  return db.venues.find((venue) => venue.slug === slug) ?? null;
}

export function venueById(db: DemoDatabase, venueId: string): Venue | null {
  return db.venues.find((venue) => venue.id === venueId) ?? null;
}

export function tracksForVenue(
  db: DemoDatabase,
  venueId: string,
  enabledOnly = false,
): Track[] {
  return db.tracks.filter((track) => track.venueId === venueId && (!enabledOnly || track.enabled));
}

export function requestView(db: DemoDatabase, requestId: string): RequestView | null {
  const request = db.requests.find((item) => item.id === requestId);
  if (!request) return null;
  return {
    request,
    venue: venueById(db, request.venueId),
    track: db.tracks.find((track) => track.id === request.trackId) ?? null,
    position: db.queue.find((item) => item.requestId === request.id)?.position ?? null,
  };
}

export function queueViews(db: DemoDatabase, venueId: string): QueueView[] {
  return venueQueue(db, venueId).flatMap((item) => {
    const request = db.requests.find((entry) => entry.id === item.requestId);
    if (!request) return [];
    return [
      {
        item,
        request,
        track: db.tracks.find((track) => track.id === request.trackId) ?? null,
      },
    ];
  });
}

export function draftView(db: DemoDatabase, draftId: string) {
  const draft = db.drafts.find((item) => item.id === draftId) ?? null;
  if (!draft) return null;
  return {
    draft,
    venue: venueById(db, draft.venueId),
    track: db.tracks.find((track) => track.id === draft.trackId) ?? null,
    paidRequest: db.requests.find((request) => request.id === draftId) ?? null,
  };
}
