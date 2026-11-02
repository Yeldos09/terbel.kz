import { createContext, useContext } from "react";
import type { Locale } from "../../domain/types.ts";
import type { Messages } from "./types.ts";

export interface I18nValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}

export function useMessages(): Messages {
  return useI18n().messages;
}
