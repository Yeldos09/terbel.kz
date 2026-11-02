import { almatyDayKey, formatDay } from "../shared/lib/format.ts";
import { REQUEST_STATUSES, type DemoDatabase, type RequestStatus, type VenueMode } from "./types.ts";

export interface StatusPoint {
  status: RequestStatus;
  count: number;
}

export interface VenuePoint {
  name: string;
  count: number;
  amount: number;
}

export interface DayPoint {
  day: string;
  count: number;
}

export interface ModePoint {
  mode: VenueMode;
  count: number;
}

export interface DemoAnalytics {
  byStatus: StatusPoint[];
  byVenue: VenuePoint[];
  byDay: DayPoint[];
  byMode: ModePoint[];
  totals: {
    requests: number;
    queued: number;
    venues: number;
    exampleAmount: number;
  };
}

export function buildAnalytics(db: DemoDatabase): DemoAnalytics {
  const byStatus = REQUEST_STATUSES.map((status) => ({
    status,
    count: db.requests.filter((request) => request.status === status).length,
  }));
  const byVenue = db.venues.map((venue) => {
    const rows = db.requests.filter((request) => request.venueId === venue.id);
    const counted = rows.filter((request) => request.status !== "REJECTED" && request.status !== "EXPIRED");
    return {
      name: venue.name,
      count: rows.length,
      amount: counted.reduce((sum, request) => sum + request.amountKzt, 0),
    };
  });
  const dayMap = new Map<string, { label: string; count: number }>();
  for (const request of db.requests) {
    const key = almatyDayKey(request.createdAt);
    const current = dayMap.get(key) ?? { label: formatDay(request.createdAt), count: 0 };
    current.count += 1;
    dayMap.set(key, current);
  }
  const byDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => ({ day: value.label, count: value.count }));
  const byMode: ModePoint[] = [
    { mode: "DJ", count: db.requests.filter((request) => request.mode === "DJ").length },
    { mode: "JUKEBOX", count: db.requests.filter((request) => request.mode === "JUKEBOX").length },
  ];
  const activeQueue = db.requests.filter(
    (request) => request.status === "QUEUED" || request.status === "PLAYING",
  ).length;
  return {
    byStatus,
    byVenue,
    byDay,
    byMode,
    totals: {
      requests: db.requests.length,
      queued: activeQueue,
      venues: db.venues.length,
      exampleAmount: byVenue.reduce((sum, venue) => sum + venue.amount, 0),
    },
  };
}
