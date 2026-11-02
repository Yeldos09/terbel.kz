import { addTrack, applyVenueSettings, removeTrack, setTrackEnabled, setTrackPrice } from "../domain/catalog.ts";
import { DomainError } from "../domain/errors.ts";
import { expireStale } from "../domain/requests.ts";
import {
  acceptRequest,
  completePlaying,
  confirmCheckout,
  createCheckoutDraft,
  createDjRequest,
  dequeueToAccepted,
  enqueueRequest,
  rejectRequest,
  returnToQueue,
  startPlaying,
  type CreateDjInput,
  type CreateDraftInput,
} from "../domain/requests.ts";
import { moveQueueItem, reorderQueue } from "../domain/queue.ts";
import { trackFormSchema, trackPriceSchema, venueSettingsSchema, type TrackFormInput, type VenueSettingsInput } from "../domain/schemas.ts";
import { LOCALES, SCHEMA_VERSION, type DemoDatabase, type Locale } from "../domain/types.ts";
import { createSeed } from "./seed.ts";

const STORAGE_KEY = "shaiqa.kz.demo.v1";

export type Recovery = "invalid";

type Listener = () => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDatabase(value: unknown): value is DemoDatabase {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== SCHEMA_VERSION) return false;
  if (!Array.isArray(value.venues) || value.venues.length === 0) return false;
  if (!Array.isArray(value.tracks) || !Array.isArray(value.requests)) return false;
  if (!Array.isArray(value.queue) || !Array.isArray(value.drafts)) return false;
  if (typeof value.activeDjVenueId !== "string" || typeof value.activeDashboardVenueId !== "string") return false;
  if (!LOCALES.includes(value.locale as Locale)) return false;
  const venue = value.venues[0];
  if (!isRecord(venue) || typeof venue.id !== "string" || typeof venue.slug !== "string") return false;
  if (venue.mode !== "DJ" && venue.mode !== "JUKEBOX") return false;
  for (const request of value.requests) {
    if (!isRecord(request)) return false;
    if (typeof request.id !== "string" || typeof request.status !== "string") return false;
    if (typeof request.paymentStatus !== "string" || typeof request.venueId !== "string") return false;
  }
  for (const track of value.tracks) {
    if (!isRecord(track) || typeof track.id !== "string" || typeof track.title !== "string") return false;
  }
  for (const item of value.queue) {
    if (!isRecord(item) || typeof item.requestId !== "string" || typeof item.position !== "number") return false;
  }
  return true;
}

function browserStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    localStorage.getItem(STORAGE_KEY);
    return localStorage;
  } catch {
    return null;
  }
}

function writeStorage(store: Storage, db: DemoDatabase): void {
  store.setItem(STORAGE_KEY, JSON.stringify(db));
}

function databaseFromRaw(raw: string | null): { db: DemoDatabase; recovery: Recovery | null } {
  if (!raw) return { db: createSeed(), recovery: null };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDatabase(parsed)) return { db: createSeed(), recovery: "invalid" };
    return { db: parsed, recovery: null };
  } catch {
    return { db: createSeed(), recovery: "invalid" };
  }
}

function boot(): { db: DemoDatabase; recovery: Recovery | null; memoryOnly: boolean } {
  const store = browserStorage();
  if (!store) return { db: createSeed(), recovery: null, memoryOnly: true };
  const raw = store.getItem(STORAGE_KEY);
  const loaded = databaseFromRaw(raw);
  try {
    if (raw === null || loaded.recovery) writeStorage(store, loaded.db);
    return { db: loaded.db, recovery: loaded.recovery, memoryOnly: false };
  } catch {
    return { db: loaded.db, recovery: loaded.recovery, memoryOnly: true };
  }
}

const booted = boot();
let current: DemoDatabase = booted.db;
let recovery: Recovery | null = booted.recovery;
let memoryOnly = booted.memoryOnly;
const listeners = new Set<Listener>();

function persist(db: DemoDatabase): void {
  const store = browserStorage();
  if (!store) {
    memoryOnly = true;
    return;
  }
  try {
    writeStorage(store, db);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function commit(mutate: (draft: DemoDatabase) => void): void {
  const draft = structuredClone(current);
  expireStale(draft);
  mutate(draft);
  current = draft;
  persist(draft);
  emit();
}

function read(): DemoDatabase {
  const draft = structuredClone(current);
  if (expireStale(draft)) {
    current = draft;
    persist(draft);
  }
  return structuredClone(current);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    const loaded = databaseFromRaw(event.newValue);
    current = loaded.db;
    if (loaded.recovery) {
      recovery = loaded.recovery;
      persist(loaded.db);
    }
    emit();
  });
}

export const repository = {
  storageKey: STORAGE_KEY,
  read,
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  consumeRecovery(): Recovery | null {
    const value = recovery;
    recovery = null;
    return value;
  },
  isMemoryOnly(): boolean {
    return memoryOnly;
  },
  reset(): void {
    current = createSeed();
    persist(current);
    emit();
  },
  setLocale(locale: Locale): void {
    if (!LOCALES.includes(locale)) return;
    commit((draft) => {
      draft.locale = locale;
    });
  },
  setActiveDjVenue(venueId: string): void {
    commit((draft) => {
      if (!draft.venues.some((venue) => venue.id === venueId)) throw new DomainError("venue_not_found");
      draft.activeDjVenueId = venueId;
    });
  },
  setActiveDashboardVenue(venueId: string): void {
    commit((draft) => {
      if (!draft.venues.some((venue) => venue.id === venueId)) throw new DomainError("venue_not_found");
      draft.activeDashboardVenueId = venueId;
    });
  },
  createDjRequest(input: CreateDjInput): string {
    let id = "";
    commit((draft) => {
      id = createDjRequest(draft, input);
    });
    return id;
  },
  createCheckoutDraft(input: CreateDraftInput): string {
    let id = "";
    commit((draft) => {
      id = createCheckoutDraft(draft, input);
    });
    return id;
  },
  confirmCheckout(draftId: string): string {
    let id = "";
    commit((draft) => {
      id = confirmCheckout(draft, draftId);
    });
    return id;
  },
  accept(requestId: string): void {
    commit((draft) => acceptRequest(draft, requestId));
  },
  enqueue(requestId: string): void {
    commit((draft) => enqueueRequest(draft, requestId));
  },
  reject(requestId: string): void {
    commit((draft) => rejectRequest(draft, requestId));
  },
  startPlaying(requestId: string): void {
    commit((draft) => startPlaying(draft, requestId));
  },
  completePlaying(requestId: string): void {
    commit((draft) => completePlaying(draft, requestId));
  },
  returnToQueue(requestId: string): void {
    commit((draft) => returnToQueue(draft, requestId));
  },
  dequeueToAccepted(requestId: string): void {
    commit((draft) => dequeueToAccepted(draft, requestId));
  },
  moveQueue(venueId: string, requestId: string, direction: -1 | 1): void {
    commit((draft) => moveQueueItem(draft, venueId, requestId, direction));
  },
  reorderQueue(venueId: string, activeId: string, overId: string): void {
    commit((draft) => reorderQueue(draft, venueId, activeId, overId));
  },
  updateVenue(venueId: string, input: VenueSettingsInput): void {
    const parsed = venueSettingsSchema.safeParse(input);
    if (!parsed.success) throw new DomainError("settings_invalid");
    commit((draft) => applyVenueSettings(draft, venueId, parsed.data));
  },
  addTrack(venueId: string, input: TrackFormInput): string {
    const parsed = trackFormSchema.safeParse(input);
    if (!parsed.success) throw new DomainError("track_invalid");
    let id = "";
    commit((draft) => {
      id = addTrack(draft, venueId, parsed.data);
    });
    return id;
  },
  setTrackPrice(trackId: string, priceKzt: number): void {
    const parsed = trackPriceSchema.safeParse(priceKzt);
    if (!parsed.success) throw new DomainError("track_invalid");
    commit((draft) => setTrackPrice(draft, trackId, parsed.data));
  },
  setTrackEnabled(trackId: string, enabled: boolean): void {
    commit((draft) => setTrackEnabled(draft, trackId, enabled));
  },
  removeTrack(trackId: string): void {
    commit((draft) => removeTrack(draft, trackId));
  },
};
