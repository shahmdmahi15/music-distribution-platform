import * as crypto from 'crypto';
import { isIP } from 'net';
import { Request } from 'express';

/** Carries the end-user IP, set by the platform server. */
export const CLIENT_IP_HEADER = 'x-real-ip';

/** Proves the request came from the platform server and not a browser. */
export const INTERNAL_SECRET_HEADER = 'x-internal-secret';

function secretsMatch(presented: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(presented).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Resolves the originating client IP for a request.
 *
 * The API sits behind the Next.js server, so the socket peer is always the
 * platform server rather than the end user. The forwarded header is therefore
 * the only source of the real IP - but it is browser-controlled on the way in,
 * so it is trusted only when it arrives with the shared internal secret. Any
 * other caller falls back to the socket address, which cannot be forged.
 */
export function resolveClientIp(request: Request): string {
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  const presentedSecret = request.headers[INTERNAL_SECRET_HEADER];

  if (
    expectedSecret &&
    typeof presentedSecret === 'string' &&
    secretsMatch(presentedSecret, expectedSecret)
  ) {
    const forwarded = request.headers[CLIENT_IP_HEADER];

    if (typeof forwarded === 'string') {
      // The platform server sends one address; reading from the right means a
      // hop appended in transit cannot displace it.
      const hops = forwarded
        .split(',')
        .map((hop) => hop.trim())
        .filter(Boolean);

      for (let index = hops.length - 1; index >= 0; index--) {
        const hop = hops[index];
        if (hop && isIP(hop)) {
          return hop;
        }
      }
    }
  }

  return request.ip || request.socket.remoteAddress || '0.0.0.0';
}
