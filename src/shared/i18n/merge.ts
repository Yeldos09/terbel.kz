import type { Locale } from "../../domain/types.ts";
import { kk } from "./kk.ts";
import { ru } from "./ru.ts";
import type { DeepPartial, Messages } from "./types.ts";

function mergeValue<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined) return base;
  if (typeof base === "string") return (override as T) ?? base;
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as T;
  if (base && typeof base === "object") {
    const source = base as Record<string, unknown>;
    const extra = override as Record<string, unknown>;
    const next: Record<string, unknown> = { ...source };
    for (const key of Object.keys(extra)) {
      next[key] = mergeValue(source[key], extra[key] as DeepPartial<unknown>);
    }
    return next as T;
  }
  return base;
}

export function messagesFor(locale: Locale): Messages {
  if (locale === "ru") return ru;
  return mergeValue(ru, kk);
}
