import { isIP } from "node:net";

/**
 * Derives the end-user IP from the headers our edge proxy adds, for forwarding
 * to the API.
 *
 * `X-Forwarded-For` is a comma-separated chain of the hops a request passed
 * through, and a browser can put anything it likes in it. Only entries appended
 * by infrastructure we control are trustworthy, so the RIGHTMOST entry is used:
 * a standard proxy (`$proxy_add_x_forwarded_for` in nginx) appends the peer it
 * saw, which is the closest available approximation of the real client address.
 *
 * Taking the leftmost entry instead — as this used to — hands the client control
 * of the value. That matters because the API trusts what we forward (we
 * authenticate it with a shared secret) and keys rate limiting off it, so a
 * forged value buys a fresh throttle bucket per request.
 *
 * `X-Real-IP` is a fallback only: proxies conventionally overwrite it rather than
 * append, but nothing enforces that, whereas a rightmost XFF entry is only
 * believed because a hop we control put it there.
 *
 * Returns `undefined` when no well-formed address is present, so the caller can
 * omit the headers entirely and let the API fall back to the socket peer. That
 * funnels such requests into one shared throttle bucket, which fails closed
 * rather than open.
 */
export function resolveForwardedIp(headerList: Headers): string | undefined {
  const forwardedFor = headerList.get("x-forwarded-for");

  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);

    // Nearest hop first: the further left, the more client-controlled.
    for (let index = hops.length - 1; index >= 0; index--) {
      const hop = hops[index];
      if (hop && isIP(hop)) {
        return hop;
      }
    }
  }

  const realIp = headerList.get("x-real-ip")?.trim();

  return realIp && isIP(realIp) ? realIp : undefined;
}
