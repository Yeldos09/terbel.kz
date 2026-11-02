import { DomainError } from "./errors.ts";
import { assertTrackPrice } from "./pricing.ts";
import type { TrackFormInput, VenueSettingsInput } from "./schemas.ts";
import type { DemoDatabase, Track } from "./types.ts";
import { requireVenue } from "./requests.ts";

export function applyVenueSettings(db: DemoDatabase, venueId: string, input: VenueSettingsInput): void {
  const venue = requireVenue(db, venueId);
  Object.assign(venue, input);
}

export function addTrack(db: DemoDatabase, venueId: string, input: TrackFormInput): string {
  requireVenue(db, venueId);
  assertTrackPrice(input.priceKzt);
  const title = input.title.trim();
  const artist = input.artist.trim();
  const genre = input.genre.trim();
  if (!title || !artist || !genre || title.length > 80 || artist.length > 80 || genre.length > 24) {
    throw new DomainError("track_invalid");
  }
  if (!Number.isInteger(input.durationSec) || input.durationSec < 30 || input.durationSec > 900) {
    throw new DomainError("track_invalid");
  }
  const id = crypto.randomUUID();
  const track: Track = {
    id,
    venueId,
    title,
    artist,
    genre,
    durationSec: input.durationSec,
    priceKzt: input.priceKzt,
    enabled: input.enabled,
    coverHue: Math.round((title.length * 47 + artist.length * 13) % 360),
  };
  db.tracks.push(track);
  return id;
}

export function setTrackPrice(db: DemoDatabase, trackId: string, priceKzt: number): void {
  const track = db.tracks.find((item) => item.id === trackId);
  if (!track) throw new DomainError("track_unavailable");
  assertTrackPrice(priceKzt);
  track.priceKzt = priceKzt;
}

export function setTrackEnabled(db: DemoDatabase, trackId: string, enabled: boolean): void {
  const track = db.tracks.find((item) => item.id === trackId);
  if (!track) throw new DomainError("track_unavailable");
  track.enabled = enabled;
}

export function removeTrack(db: DemoDatabase, trackId: string): void {
  const exists = db.tracks.some((track) => track.id === trackId);
  if (!exists) throw new DomainError("track_unavailable");
  db.tracks = db.tracks.filter((track) => track.id !== trackId);
}
