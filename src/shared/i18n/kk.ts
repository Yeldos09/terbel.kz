import type { DeepPartial, Messages } from "./types.ts";

/** Kazakh overrides. Missing keys fall back to Russian. */
export const kk: DeepPartial<Messages> = {
  localeHint: "Қазақша нұсқа әзірге орыс мәтініне сүйенеді. Аударма кейін қосылады.",
  langLabel: "Тіл",
  themeLabel: "Тақырып",
  themeDark: "Қараңғы",
  themeLight: "Жарық",
};
