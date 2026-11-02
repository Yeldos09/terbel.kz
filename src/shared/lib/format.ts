const kzt = new Intl.NumberFormat("ru-KZ", { maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("ru-KZ");
const dateTime = new Intl.DateTimeFormat("ru-KZ", {
  timeZone: "Asia/Almaty",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dayFormat = new Intl.DateTimeFormat("ru-KZ", {
  timeZone: "Asia/Almaty",
  day: "2-digit",
  month: "short",
});
const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Almaty",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatKzt(amount: number): string {
  return `${kzt.format(amount)} ₸`;
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}

export function almatyDayKey(iso: string): string {
  return dayKey.format(new Date(iso));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
