import { DomainError } from "./errors.ts";
import { formatKzt } from "../shared/lib/format.ts";

export function quickBidAmounts(minBidKzt: number): number[] {
  return [...new Set([minBidKzt, minBidKzt + 500, minBidKzt + 1_000, minBidKzt + 2_000])].filter(
    (amount) => amount > 0,
  );
}

export function assertBid(amountKzt: number, minBidKzt: number): void {
  if (!Number.isInteger(amountKzt)) throw new DomainError("bid_invalid");
  if (amountKzt < minBidKzt) throw new DomainError("bid_too_low", { min: formatKzt(minBidKzt) });
  if (amountKzt > 500_000) throw new DomainError("bid_too_high");
}

export function assertTrackPrice(priceKzt: number): void {
  if (!Number.isInteger(priceKzt) || priceKzt < 100 || priceKzt > 200_000) {
    throw new DomainError("track_invalid");
  }
}
