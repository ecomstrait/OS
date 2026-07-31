/**
 * The EcomStrait merchant app's base URL, normalised.
 *
 * `ECOMSTRAIT_MERCHANT_URL` is typed into a hosting dashboard by hand, so it
 * arrives as `os-merchant.vercel.app` about as often as with a scheme. `fetch`
 * rejects the bare host with a bare `ERR_INVALID_URL` far from the setting that
 * caused it — so assume https and tolerate a trailing slash.
 *
 * Returns null when unset, letting callers show their own configuration notice.
 */
export function merchantBaseUrl(): string | null {
  const raw = process.env.ECOMSTRAIT_MERCHANT_URL?.trim();
  if (!raw) return null;
  const local = raw.startsWith("localhost") || raw.startsWith("127.0.0.1");
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `${local ? "http" : "https"}://${raw}`;
  return withScheme.replace(/\/+$/, "");
}
