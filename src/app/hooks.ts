import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { venueById } from "../domain/selectors.ts";
import { repository } from "../mocks/repository.ts";
import { useMessages } from "../shared/i18n/context.ts";
import { describeError } from "../shared/lib/describe-error.ts";
import { DEMO_QUERY_KEY } from "./query-key.ts";
import { useSession } from "../features/auth/session.ts";

export function useDemoDb(refetchInterval?: number) {
  return useQuery({
    queryKey: DEMO_QUERY_KEY,
    queryFn: () => repository.read(),
    refetchInterval,
  });
}

export function useActiveVenue(which: "dj" | "dashboard") {
  const query = useDemoDb();
  const session = useSession();
  const fallbackId = which === "dj" ? query.data?.activeDjVenueId : query.data?.activeDashboardVenueId;
  const locked = session?.role === "venue";
  const id = locked ? session.venueId : fallbackId;
  const found = query.data ? venueById(query.data, id ?? "") : null;
  const venue = found ?? (locked || !query.data ? null : query.data.venues[0] ?? null);
  return { query, venue, locked };
}

export function useRepoMutation() {
  const messages = useMessages();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (task: () => void) => {
      task();
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: DEMO_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(describeError(error, messages));
    },
  });
}
