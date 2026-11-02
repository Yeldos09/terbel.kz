import { z } from "zod";
import { VENUE_KINDS, VENUE_MODES } from "./types.ts";

export const guestDetailsSchema = z.object({
  guestName: z.string().trim().min(1, "Представьтесь").max(40, "Имя короче 40 символов"),
  tableLabel: z.string().trim().min(1, "Укажите стол").max(24, "Слишком длинная подпись"),
  note: z.string().trim().max(140, "Пожелание короче 140 символов"),
});

export function djOrderSchema(minBidKzt: number) {
  return guestDetailsSchema.extend({
    amountKzt: z
      .number({ error: "Укажите сумму в тенге" })
      .int("Только целые тенге")
      .min(minBidKzt, "Сумма ниже минимума заведения")
      .max(500_000, "Слишком большая сумма для демо"),
  });
}

export const venueSettingsSchema = z.object({
  name: z.string().trim().min(2, "Название от 2 символов").max(60, "Название короче 60 символов"),
  city: z.string().trim().min(2, "Укажите город").max(40),
  address: z.string().trim().min(2, "Укажите адрес").max(80),
  kind: z.enum(VENUE_KINDS),
  mode: z.enum(VENUE_MODES),
  minBidKzt: z.number({ error: "Укажите минимум" }).int().min(100, "Минимум от 100 ₸").max(100_000),
  greeting: z.string().trim().min(2, "Короткая фраза для гостей").max(160),
  description: z.string().trim().max(280, "Описание короче 280 символов"),
  tableLabel: z.string().trim().min(2, "Как называть стол").max(24),
  acceptWindowMinutes: z.number({ error: "Укажите минуты" }).int().min(5, "Не меньше 5 минут").max(180),
  isOpen: z.boolean(),
});

export const trackFormSchema = z.object({
  title: z.string().trim().min(1, "Нужно название").max(80),
  artist: z.string().trim().min(1, "Нужен исполнитель").max(80),
  genre: z.string().trim().min(1, "Нужен жанр").max(24),
  durationSec: z.number({ error: "Длительность в секундах" }).int().min(30).max(900),
  priceKzt: z.number({ error: "Укажите цену" }).int().min(100, "Цена от 100 ₸").max(200_000),
  enabled: z.boolean(),
});

export const trackPriceSchema = z.number().int().min(100).max(200_000);

export type GuestDetails = z.infer<typeof guestDetailsSchema>;
export type DjOrderInput = z.infer<ReturnType<typeof djOrderSchema>>;
export type VenueSettingsInput = z.infer<typeof venueSettingsSchema>;
export type TrackFormInput = z.infer<typeof trackFormSchema>;
