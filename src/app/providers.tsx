import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { repository } from "../mocks/repository.ts";
import { I18nProvider } from "../shared/i18n/provider.tsx";
import { TooltipProvider } from "../shared/ui/tooltip.tsx";
import { queryClient } from "./query-client.ts";
import { DEMO_QUERY_KEY } from "./query-key.ts";
import { ThemeProvider } from "./theme.tsx";

function DemoSync() {
  const client = useQueryClient();
  useEffect(() => {
    return repository.subscribe(() => {
      void client.invalidateQueries({ queryKey: DEMO_QUERY_KEY });
    });
  }, [client]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoSync />
      <ThemeProvider>
        <I18nProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
