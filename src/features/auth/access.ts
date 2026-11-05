import type { Session } from "./store.ts";

export type StaffArea = "dj" | "venue" | "platform";

export function areaForPath(pathname: string): StaffArea | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "platform";
  if (pathname === "/dj" || pathname.startsWith("/dj/")) return "dj";
  if (pathname === "/venue" || pathname.startsWith("/venue/")) return "venue";
  return null;
}

export function canEnter(session: Session | null, area: StaffArea): boolean {
  if (!session) return false;
  if (area === "platform") return session.role === "platform";
  return session.role === "venue" || session.role === "platform";
}

export function canManageVenue(session: Session | null, venueId: string): boolean {
  if (!session) return false;
  if (session.role === "platform") return true;
  return session.role === "venue" && session.venueId === venueId;
}

export function homeFor(session: Session): string {
  return session.role === "platform" ? "/admin" : "/venue";
}

export function safeNext(raw: string | null, session: Session): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return homeFor(session);
  const path = raw.split("?")[0] ?? "";
  const area = areaForPath(path);
  if (!area || !canEnter(session, area)) return homeFor(session);
  return path;
}

export function staffHref(path: string, session: Session | null): string {
  const area = areaForPath(path);
  if (!area || canEnter(session, area)) return path;
  return `/login?next=${encodeURIComponent(path)}`;
}
