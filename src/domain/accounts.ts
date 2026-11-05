import { DomainError } from "./errors.ts";
import type { RegisterVenueInput } from "./schemas.ts";
import type { Account, DemoDatabase, Track } from "./types.ts";

const STARTER = [
  ["Blinding Lights", "The Weeknd", "Pop", 200, 28],
  ["Save Your Tears", "The Weeknd", "Pop", 215, 200],
  ["Там ревели горы", "Miyagi & Эндшпиль", "Hip-hop", 214, 36],
  ["Это любовь", "Скриптонит", "Hip-hop", 187, 48],
  ["5000", "Ирина Кайратовна", "Q-pop", 176, 300],
  ["Sunset Lover", "Petit Biscuit", "Lounge", 237, 24],
] as const;

function nid(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

export function findAccount(db: DemoDatabase, email: string, password: string): Account {
  const normalized = email.trim().toLowerCase();
  const account = db.accounts.find((item) => item.email === normalized && item.password === password);
  if (!account) throw new DomainError("auth_invalid");
  return account;
}

export function registerVenue(db: DemoDatabase, input: RegisterVenueInput): Account {
  const email = input.email.trim().toLowerCase();
  const slug = input.slug.trim().toLowerCase();
  if (db.accounts.some((account) => account.email === email)) throw new DomainError("auth_email_taken");
  if (db.venues.some((venue) => venue.slug === slug)) throw new DomainError("auth_slug_taken");
  const venueId = nid("ven");
  const accountId = nid("acc");
  db.venues.push({
    id: venueId,
    slug,
    name: input.name.trim(),
    city: input.city.trim(),
    address: "адрес уточнит заведение",
    kind: input.kind,
    mode: input.mode,
    minBidKzt: 1_000,
    greeting:
      input.mode === "DJ"
        ? "Предложите сумму. DJ сам решит, ставить ли трек."
        : "Выберите трек и закажите его по цене заведения.",
    description: "",
    tableLabel: "Стол",
    acceptWindowMinutes: 45,
    isOpen: true,
  });
  const account: Account = {
    id: accountId,
    role: "venue",
    name: input.ownerName.trim(),
    email,
    password: input.password,
    venueId,
  };
  db.accounts.push(account);
  const tracks: Track[] = STARTER.map((item, index) => {
    const [title, artist, genre, durationSec, coverHue] = item;
    return {
      id: `trk_${venueId}_${index}`,
      venueId,
      title,
      artist,
      genre,
      durationSec,
      priceKzt: 1_500,
      enabled: true,
      coverHue,
    };
  });
  db.tracks.push(...tracks);
  return account;
}
