export interface Env {
  TENANT_KV: KVNamespace;
  MEDIA_BUCKET: R2Bucket;
  PLATFORM_BASE_DOMAIN?: string;
  API_ORIGIN_URL?: string;
  FALLBACK_BACKSTAGE_DOMAIN?: string;
  ENVIRONMENT?: string;
}

interface TenantResolutionData {
  found: boolean;
  id?: string;
  code?: string;
  name?: string;
  subdomain?: string;
  status?: string;
  customDomain?: string;
  backstageDomain?: string;
  primaryColor?: string;
}

interface TerritorialRights {
  releaseId?: string;
  permittedTerritories?: string[]; // ISO 3166-1 alpha-2 e.g. ["US", "CA", "GB", "BD"]
  excludedTerritories?: string[];  // e.g. ["KP", "IR", "SY"]
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
    const clientCountry = (request.cf?.country as string) || 'XX';

    // -------------------------------------------------------------
    // 1. CORS Preflight Handling
    // -------------------------------------------------------------
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range, X-Requested-With',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges, ETag',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // -------------------------------------------------------------
    // 2. Direct R2 Audio Streaming with Byte-Range (206 Partial Content) Caching
    // Paths: /media/*, /stream/*, /audio/*, /tracks/*
    // -------------------------------------------------------------
    if (
      url.pathname.startsWith('/media/') ||
      url.pathname.startsWith('/stream/') ||
      url.pathname.startsWith('/audio/') ||
      url.pathname.startsWith('/tracks/')
    ) {
      return handleAudioStreaming(request, env, ctx, clientCountry);
    }

    // -------------------------------------------------------------
    // 3. Sub-millisecond KV Tenant Host Resolution
    // Resolves *.platform.royalmotionit.com and custom SaaS domains
    // -------------------------------------------------------------
    const tenantInfo = await resolveTenant(host, env);

    if (tenantInfo && !tenantInfo.found) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: `WhiteLabel tenant not found for host: ${host}`,
          host,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (tenantInfo?.status === 'SUSPENDED') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'WhiteLabel tenant subscription is currently suspended.',
          host,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // -------------------------------------------------------------
    // 4. Edge Request Forwarding to Backend Origin with Tenant Headers
    // -------------------------------------------------------------
    const apiOrigin = env.API_ORIGIN_URL || 'https://api.platform.royalmotionit.com';
    const originUrl = new URL(request.url);
    const backendUrl = new URL(originUrl.pathname + originUrl.search, apiOrigin);

    const forwardHeaders = new Headers(request.headers);
    if (tenantInfo?.id) {
      forwardHeaders.set('x-tenant-id', tenantInfo.id);
      forwardHeaders.set('x-tenant-code', tenantInfo.code || '');
      forwardHeaders.set('x-tenant-subdomain', tenantInfo.subdomain || '');
      forwardHeaders.set('x-tenant-host', host);
    }
    forwardHeaders.set('x-client-country', clientCountry);
    forwardHeaders.set('x-forwarded-host', host);

    const backendRequest = new Request(backendUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body: request.body,
      redirect: 'follow',
    });

    return fetch(backendRequest);
  },
};

/**
 * Handles R2 Audio Streaming with byte-range slicing (206 Partial Content),
 * DDEX territory geo-blocking (HTTP 451), and Cloudflare Edge caching.
 */
async function handleAudioStreaming(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  clientCountry: string,
): Promise<Response> {
  const url = new URL(request.url);

  // Extract storage key from pathname (e.g. /media/tracks/audio-123.mp3 -> tracks/audio-123.mp3)
  const key = url.pathname.replace(/^\/(?:media|stream|audio|tracks)\//, '');
  if (!key) {
    return new Response('File key required', { status: 400 });
  }

  // -------------------------------------------------------------
  // DDEX Territorial Geo-Blocking (HTTP 451)
  // Checks KV metadata for release/track territorial distribution rights
  // -------------------------------------------------------------
  const rightsKey = `rights:${key.split('/')[0]}`;
  const rightsJson = await env.TENANT_KV.get(rightsKey, { type: 'json' });
  const rights = rightsJson as TerritorialRights | null;

  if (rights) {
    const isExcluded =
      rights.excludedTerritories &&
      rights.excludedTerritories.includes(clientCountry.toUpperCase());

    const isPermitted =
      !rights.permittedTerritories ||
      rights.permittedTerritories.length === 0 ||
      rights.permittedTerritories.includes(clientCountry.toUpperCase());

    if (isExcluded || !isPermitted) {
      return new Response(
        JSON.stringify({
          error: 'Unavailable For Legal Reasons',
          status: 451,
          country: clientCountry,
          reason:
            'DDEX Territorial Licensing Restriction: This musical release is not licensed for distribution or playback in your territory.',
          legalNotice:
            'Access restricted in compliance with international DDEX ERN territorial distribution agreements.',
        }),
        {
          status: 451,
          headers: {
            'Content-Type': 'application/json',
            'Link': '<https://ddex.net/standards/ern/>; rel="blocked-by"',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }
  }

  // -------------------------------------------------------------
  // Range Request Parsing
  // -------------------------------------------------------------
  const rangeHeader = request.headers.get('Range');
  let rangeOption: R2Range | undefined = undefined;

  if (rangeHeader) {
    const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (matches) {
      const start = matches[1] ? parseInt(matches[1], 10) : undefined;
      const end = matches[2] ? parseInt(matches[2], 10) : undefined;

      if (start !== undefined && end !== undefined) {
        rangeOption = { offset: start, length: end - start + 1 };
      } else if (start !== undefined) {
        rangeOption = { offset: start };
      } else if (end !== undefined) {
        rangeOption = { suffix: end };
      }
    }
  }

  // -------------------------------------------------------------
  // Fetch from Cloudflare R2
  // -------------------------------------------------------------
  const r2Object = await env.MEDIA_BUCKET.get(key, {
    range: rangeOption,
    onlyIf: request.headers,
  });

  if (!r2Object) {
    return new Response(JSON.stringify({ error: 'Media object not found', key }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle conditional request (304 Not Modified)
  if (!('body' in r2Object)) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: r2Object.httpEtag,
      },
    });
  }

  const contentType =
    r2Object.httpMetadata?.contentType || guessAudioMimeType(key);

  const responseHeaders = new Headers();
  r2Object.writeHttpMetadata(responseHeaders);
  responseHeaders.set('ETag', r2Object.httpEtag);
  responseHeaders.set('Content-Type', contentType);
  responseHeaders.set('Accept-Ranges', 'bytes');
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, ETag');
  responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

  // Handle Byte-Range 206 Partial Content
  if (r2Object.range) {
    const range = r2Object.range as { offset: number; length: number };
    const totalSize = r2Object.size;
    const endOffset = range.offset + range.length - 1;

    responseHeaders.set(
      'Content-Range',
      `bytes ${range.offset}-${endOffset}/${totalSize}`,
    );
    responseHeaders.set('Content-Length', range.length.toString());

    return new Response(r2Object.body, {
      status: 206,
      statusText: 'Partial Content',
      headers: responseHeaders,
    });
  }

  // Return full 200 OK
  responseHeaders.set('Content-Length', r2Object.size.toString());
  return new Response(r2Object.body, {
    status: 200,
    headers: responseHeaders,
  });
}

/**
 * Resolves tenant domain from sub-millisecond Cloudflare KV,
 * falling back to Platform backend resolver if cache miss.
 */
async function resolveTenant(
  host: string,
  env: Env,
): Promise<TenantResolutionData | null> {
  const cleanHost = host.trim().toLowerCase();

  // 1. Edge KV Sub-Millisecond Lookup
  const cached = await env.TENANT_KV.get<TenantResolutionData>(cleanHost, {
    type: 'json',
  });
  if (cached) {
    return cached;
  }

  // 2. Extract subdomain if on *.platform.royalmotionit.com
  const baseDomain = (env.PLATFORM_BASE_DOMAIN || 'platform.royalmotionit.com').toLowerCase();
  let subdomain = '';

  if (cleanHost.endsWith(`.${baseDomain}`)) {
    subdomain = cleanHost.replace(`.${baseDomain}`, '');
  }

  // 3. Fallback to API resolver
  const apiOrigin = env.API_ORIGIN_URL || 'https://api.platform.royalmotionit.com';
  const queryParam = subdomain
    ? `subdomain=${encodeURIComponent(subdomain)}`
    : `customDomain=${encodeURIComponent(cleanHost)}`;

  try {
    const res = await fetch(
      `${apiOrigin}/whitelabel/tenant/resolve-subdomain?${queryParam}`,
    );
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as TenantResolutionData;

    // Cache in KV for 300 seconds (5 minutes)
    if (data && data.found) {
      await env.TENANT_KV.put(cleanHost, JSON.stringify(data), {
        expirationTtl: 300,
      });
    }

    return data;
  } catch {
    return null;
  }
}

function guessAudioMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.flac')) return 'audio/flac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  return 'application/octet-stream';
}
