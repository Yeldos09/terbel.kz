import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, type ReactNode } from "react";
import { DEMO_QUERY_KEY } from "../../app/query-key.ts";
import { repository } from "../../mocks/repository.ts";
import { I18nContext } from "./context.ts";
import { messagesFor } from "./merge.ts";

export function I18nProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: DEMO_QUERY_KEY,
    queryFn: () => repository.read(),
  });
  const locale = query.data?.locale ?? "ru";
  const messages = useMemo(() => messagesFor(locale), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <I18nContext.Provider value={{ locale, messages, setLocale: repository.setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}
