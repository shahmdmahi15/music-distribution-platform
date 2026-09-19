import { isIP } from "node:net";

export function resolveForwardedIp(headerList: Headers): string | undefined {
  const forwardedFor = headerList.get("x-forwarded-for");

  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);

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
