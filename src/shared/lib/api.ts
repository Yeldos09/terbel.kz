/** Reserved for a future backend. The demo never calls this URL. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

export function reservedApiBaseUrl(): string {
  return API_BASE_URL;
}
