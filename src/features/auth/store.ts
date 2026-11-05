import type { AccountRole } from "../../domain/types.ts";

const STORAGE_KEY = "terbel.kz.session";

export interface Session {
  accountId: string;
  role: AccountRole;
  venueId: string | null;
  name: string;
  email: string;
}

type Listener = () => void;

function readStored(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const session = parsed as Session;
    if (typeof session.accountId !== "string" || typeof session.email !== "string") return null;
    if (session.role !== "platform" && session.role !== "venue") return null;
    if (session.role === "venue" && typeof session.venueId !== "string") return null;
    if (session.role === "platform" && session.venueId !== null) return null;
    return session;
  } catch {
    return null;
  }
}

let current: Session | null = readStored();
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(session: Session | null): void {
  current = session;
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* tab storage can be blocked */
  }
  emit();
}

export const sessionState = {
  get(): Session | null {
    return current;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  set(session: Session): void {
    persist(session);
  },
  clear(): void {
    persist(null);
  },
};
