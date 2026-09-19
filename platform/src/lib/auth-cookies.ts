/**
 * Holds the 2FA challenge issued after a successful password check.
 *
 * Kept in an httpOnly cookie rather than a redirect URL so it stays out of
 * browser history and cannot leak through a Referer header. The `__Host-`
 * prefix pins it to this origin and requires Secure + Path=/ on every write,
 * including the write that clears it.
 */
export const MFA_CHALLENGE_COOKIE = "__Host-MFA_CHALLENGE";

/** Mirrors the API's challenge TTL so the cookie never outlives the challenge. */
export const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
