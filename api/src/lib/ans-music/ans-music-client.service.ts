import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnsMusicConfigService } from './ans-music.config';
import {
  AnsChannel,
  AnsChannelListResponse,
  AnsChannelRequest,
  AnsListReleasesQuery,
  AnsMeResponse,
  AnsRelease,
  AnsReleaseInput,
  AnsReleaseListResponse,
  AnsReleasePatch,
  AnsSimulateStatusRequest,
  AnsUploadCompleteRequest,
  AnsUploadCompleteResponse,
  AnsUploadPartsRequest,
  AnsUploadPartsResponse,
  AnsUploadStartRequest,
  AnsUploadStartResponse,
  AnsWebhookGetResponse,
  AnsWebhookSetRequest,
  AnsWebhookSetResponse,
  AnsWebhookTestResponse,
} from './ans-music.types';

@Injectable()
export class AnsMusicClientService {
  private readonly logger = new Logger(AnsMusicClientService.name);

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly ansConfig?: AnsMusicConfigService,
  ) {}

  private getBaseUrl(): string {
    if (this.ansConfig) {
      return this.ansConfig.baseUrl;
    }
    return (
      this.configService.get<string>('ANS_MUSIC_API_URL') ||
      this.configService.get<string>('ANS_API_BASE_URL') ||
      'https://server.ansmusic.io/partner'
    ).replace(/\/+$/, '');
  }

  private getApiKey(): string {
    if (this.ansConfig) {
      return this.ansConfig.apiKey;
    }
    return (
      this.configService.get<string>('ANS_MUSIC_API_KEY') ||
      this.configService.get<string>('ANS_TEST_API_KEY') ||
      'ans_test_4cfc31c23807b5010539a68f2bd57c0e8d807337458cd40e'
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: any) {
      this.logger.error(
        `Network error calling ANS Music API at ${url}: ${err.message}`,
      );
      throw new HttpException(
        err.message || 'ANS Music upstream network failure',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (response.status === 429) {
      const resetHeader =
        response.headers.get('RateLimit-Reset') ||
        response.headers.get('retry-after') ||
        '1';
      const waitSeconds = Math.max(1, parseInt(resetHeader, 10) || 1);

      if (retryCount < 3) {
        this.logger.warn(
          `ANS Music rate limit (429) hit. Backing off for ${waitSeconds}s (attempt ${retryCount + 1}/3)`,
        );
        await this.sleep(waitSeconds * 1000);
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw new HttpException(
        'ANS Music Rate limit exceeded after retries',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let body: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = null;
      }
    } else {
      body = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (typeof body === 'object' && body?.message) ||
        (typeof body === 'object' && body?.error) ||
        `ANS API request failed with status ${response.status}`;

      if (response.status === 401) {
        throw new UnauthorizedException(errorMessage);
      }
      if (response.status === 403) {
        throw new HttpException(errorMessage, HttpStatus.FORBIDDEN);
      }
      if (response.status === 404) {
        throw new NotFoundException(errorMessage);
      }
      if (response.status === 409) {
        if (body?.data) {
          return body.data as T;
        }
        if (body?.existingRelease) {
          return body.existingRelease as T;
        }
        if (body?.existingChannel) {
          return body.existingChannel as T;
        }
        return (body || {}) as T;
      }
      if (response.status === 400) {
        const errorDetail =
          body?.errorMessages && Array.isArray(body.errorMessages)
            ? body.errorMessages.map((e: any) => e.message).join('; ')
            : errorMessage;
        throw new BadRequestException(errorDetail);
      }

      throw new HttpException(errorMessage, response.status);
    }

    // Standard ANS Response envelope unwrapping: { statusCode, success, message, data }
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data as T;
    }

    return body as T;
  }

  /**
   * GET /me (or /partner/me)
   */
  async getMe(): Promise<AnsMeResponse> {
    return this.request<AnsMeResponse>('/me', {
      method: 'GET',
    });
  }

  /**
   * POST /releases
   */
  async createRelease(payload: AnsReleaseInput): Promise<AnsRelease> {
    const headers: Record<string, string> = {};
    if (payload.externalId) {
      headers['X-Idempotency-Key'] = payload.externalId;
    }
    return this.request<AnsRelease>('/releases', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  /**
   * GET /releases
   */
  async listReleases(
    query?: AnsListReleasesQuery,
  ): Promise<AnsReleaseListResponse> {
    const params = new URLSearchParams();
    if (query?.updatedSince) params.set('updatedSince', query.updatedSince);
    if (query?.externalId) params.set('externalId', query.externalId);
    if (query?.isrc) params.set('isrc', query.isrc);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const qs = params.toString();
    const endpoint = `/releases${qs ? `?${qs}` : ''}`;

    return this.request<AnsReleaseListResponse>(endpoint, {
      method: 'GET',
    });
  }

  /**
   * GET /releases/:id
   */
  async getRelease(id: string): Promise<AnsRelease> {
    return this.request<AnsRelease>(`/releases/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  /**
   * PATCH /releases/:id
   */
  async updateRelease(
    id: string,
    patch: AnsReleasePatch,
  ): Promise<AnsRelease> {
    return this.request<AnsRelease>(`/releases/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  /**
   * POST /releases/:id/simulate (Sandbox test keys only)
   */
  async simulateStatus(
    id: string,
    status: AnsSimulateStatusRequest['status'],
    extra?: { reason?: string },
  ): Promise<AnsRelease> {
    const payload: AnsSimulateStatusRequest = {
      status,
      ...(extra || {}),
    };

    return this.request<AnsRelease>(
      `/releases/${encodeURIComponent(id)}/simulate`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }

  /**
   * POST /channels (Request VEVO channel)
   */
  async requestChannel(payload: AnsChannelRequest): Promise<AnsChannel> {
    return this.request<AnsChannel>('/channels', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * GET /channels
   */
  async listChannels(): Promise<AnsChannelListResponse> {
    return this.request<AnsChannelListResponse>('/channels', {
      method: 'GET',
    });
  }

  /**
   * POST /uploads (Starts single or multipart direct S3 upload)
   */
  async startUpload(
    params: AnsUploadStartRequest,
  ): Promise<AnsUploadStartResponse> {
    return this.request<AnsUploadStartResponse>('/uploads', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * POST /uploads/parts (Signs up to 200 multipart parts)
   */
  async signUploadParts(
    params: AnsUploadPartsRequest,
  ): Promise<AnsUploadPartsResponse> {
    return this.request<AnsUploadPartsResponse>('/uploads/parts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * POST /uploads/complete (Finalizes multipart upload)
   */
  async completeUpload(
    params: AnsUploadCompleteRequest,
  ): Promise<AnsUploadCompleteResponse> {
    return this.request<AnsUploadCompleteResponse>('/uploads/complete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * GET /webhook (Reads webhook configuration)
   */
  async getWebhook(): Promise<AnsWebhookGetResponse> {
    return this.request<AnsWebhookGetResponse>('/webhook', {
      method: 'GET',
    });
  }

  /**
   * PUT /webhook (Sets webhook URL and returns signing secret once)
   */
  async setWebhook(
    params: AnsWebhookSetRequest,
  ): Promise<AnsWebhookSetResponse> {
    return this.request<AnsWebhookSetResponse>('/webhook', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  /**
   * POST /webhook/test (Dispatches test event)
   */
  async testWebhook(): Promise<AnsWebhookTestResponse> {
    return this.request<AnsWebhookTestResponse>('/webhook/test', {
      method: 'POST',
    });
  }
}
