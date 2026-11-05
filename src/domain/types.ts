export const VENUE_MODES = ["DJ", "JUKEBOX"] as const;
export type VenueMode = (typeof VENUE_MODES)[number];

export const VENUE_KINDS = ["bar", "restaurant", "lounge", "karaoke"] as const;
export type VenueKind = (typeof VENUE_KINDS)[number];

export const REQUEST_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "QUEUED",
  "PLAYING",
  "COMPLETED",
  "REJECTED",
  "EXPIRED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "NONE",
  "MOCK_HOLD",
  "MOCK_PAID",
  "MOCK_RELEASED",
  "EXPIRED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DECISION_CODES = ["", "dj_rejected", "expired"] as const;
export type DecisionCode = (typeof DECISION_CODES)[number];

export const LOCALES = ["ru", "kk"] as const;
export type Locale = (typeof LOCALES)[number];

export const SCHEMA_VERSION = 3;

export const ACCOUNT_ROLES = ["platform", "venue"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export interface Account {
  id: string;
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  venueId: string | null;
}

export interface Venue {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  kind: VenueKind;
  mode: VenueMode;
  minBidKzt: number;
  greeting: string;
  description: string;
  tableLabel: string;
  acceptWindowMinutes: number;
  isOpen: boolean;
}

export interface Track {
  id: string;
  venueId: string;
  title: string;
  artist: string;
  genre: string;
  durationSec: number;
  priceKzt: number;
  enabled: boolean;
  coverHue: number;
  coverUrl?: string;
}

export interface MusicRequest {
  id: string;
  venueId: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  coverHue: number;
  coverUrl?: string;
  guestName: string;
  tableLabel: string;
  note: string;
  amountKzt: number;
  status: RequestStatus;
  paymentStatus: PaymentStatus;
  mode: VenueMode;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  decisionCode: DecisionCode;
}

export interface QueueItem {
  id: string;
  requestId: string;
  venueId: string;
  position: number;
}

export interface CheckoutDraft {
  id: string;
  venueId: string;
  trackId: string;
  guestName: string;
  tableLabel: string;
  note: string;
  amountKzt: number;
  createdAt: string;
}

export interface DemoDatabase {
  schemaVersion: number;
  accounts: Account[];
  venues: Venue[];
  tracks: Track[];
  requests: MusicRequest[];
  queue: QueueItem[];
  drafts: CheckoutDraft[];
  activeDjVenueId: string;
  activeDashboardVenueId: string;
  locale: Locale;
}

export interface RequestView {
  request: MusicRequest;
  venue: Venue | null;
  track: Track | null;
  position: number | null;
}

export interface QueueView {
  item: QueueItem;
  request: MusicRequest;
  track: Track | null;
}
