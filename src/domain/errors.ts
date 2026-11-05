export const ERROR_CODES = [
  "venue_not_found",
  "venue_closed",
  "wrong_mode",
  "track_unavailable",
  "bid_invalid",
  "bid_too_low",
  "bid_too_high",
  "guest_name",
  "guest_table",
  "guest_note",
  "not_pending",
  "not_queueable",
  "not_queued",
  "not_playing",
  "queue_missing",
  "queue_edge_up",
  "queue_edge_down",
  "queue_playing_pinned",
  "queue_reorder",
  "draft_missing",
  "track_invalid",
  "settings_invalid",
  "request_missing",
  "auth_invalid",
  "auth_email_taken",
  "auth_slug_taken",
  "auth_forbidden",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly vars?: Record<string, string | number>;

  constructor(code: ErrorCode, vars?: Record<string, string | number>) {
    super(code);
    this.name = "DomainError";
    this.code = code;
    this.vars = vars;
  }
}
