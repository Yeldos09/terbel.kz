import { DomainError } from "../../domain/errors.ts";
import type { Messages } from "../i18n/types.ts";
import { interpolate } from "./format.ts";

export function describeError(error: unknown, messages: Messages): string {
  if (error instanceof DomainError) {
    const template = messages.errors[error.code];
    return interpolate(template, error.vars);
  }
  return messages.errors.unknown;
}
