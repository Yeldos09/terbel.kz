import { useSyncExternalStore } from "react";
import { repository } from "../../mocks/repository.ts";
import { sessionState, type Session } from "./store.ts";

export type { Session } from "./store.ts";

export const sessionStore = {
  get(): Session | null {
    return sessionState.get();
  },
  subscribe(listener: () => void): () => void {
    return sessionState.subscribe(listener);
  },
  login(email: string, password: string): Session {
    const account = repository.login(email, password);
    const session: Session = {
      accountId: account.id,
      role: account.role,
      venueId: account.venueId,
      name: account.name,
      email: account.email,
    };
    sessionState.set(session);
    if (account.venueId) {
      repository.setActiveDashboardVenue(account.venueId);
      repository.setActiveDjVenue(account.venueId);
    }
    return session;
  },
  logout(): void {
    sessionState.clear();
  },
};

export function useSession(): Session | null {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get, sessionStore.get);
}
