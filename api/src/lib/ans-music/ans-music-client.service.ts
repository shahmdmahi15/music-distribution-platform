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
  AnsChannelRequest,
  AnsEnvelope,
  AnsMeResponse,
  AnsRelease,
  AnsReleaseInput,
  AnsReleasePatch,
  AnsUploadMultipartCompleteRequest,
  AnsUploadMultipartSignPartsRequest,
  AnsUploadMultipartSignPartsResponse,
  AnsUploadMultipartStartRequest,
  AnsUploadMultipartStartResponse,
  AnsUploadSingleRequest,
  AnsUploadSingleResponse,
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
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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
      this.logger.error(`Network error calling ANS Music API at ${url}: ${err.message}`);
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
      if (response.status === 404) {
        throw new NotFoundException(errorMessage);
      }
      if (response.status === 409) {
        if (body?.existingRelease) {
          return body.existingRelease as T;
        }
        if (body?.existingChannel) {
          return body.existingChannel as T;
        }
        // If data is returned in standard envelope on 409
        if (body?.data) {
          return body.data as T;
        }
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

    // Unwrap standard envelope if present: { success: true, data: ... }
    if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
      return body.data as T;
    }

    return body as T;
  }

  async getMe(): Promise<AnsMeResponse> {
    return this.request<AnsMeResponse>('/me', {
      method: 'GET',
    });
  }

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

  async getRelease(id: string): Promise<AnsRelease> {
    return this.request<AnsRelease>(`/releases/${id}`, {
      method: 'GET',
    });
  }

  async updateRelease(id: string, patch: AnsReleasePatch): Promise<AnsRelease> {
    return this.request<AnsRelease>(`/releases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  async requestChannel(payload: AnsChannelRequest): Promise<AnsChannel> {
    const headers: Record<string, string> = {};
    if (payload.externalId) {
      headers['X-Idempotency-Key'] = payload.externalId;
    }

    return this.request<AnsChannel>('/channels/request', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  async listChannels(): Promise<AnsChannel[]> {
    return this.request<AnsChannel[]>('/channels', {
      method: 'GET',
    });
  }

  async simulateStatus(
    id: string,
    status: string,
    extra?: { reason?: string },
  ): Promise<any> {
    const payload = {
      status,
      ...(extra || {}),
    };

    return this.request<any>(`/sandbox/releases/${id}/simulate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async startUpload(
    params: AnsUploadSingleRequest,
  ): Promise<AnsUploadSingleResponse> {
    return this.request<AnsUploadSingleResponse>('/uploads/single', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async startMultipartUpload(
    params: AnsUploadMultipartStartRequest,
  ): Promise<AnsUploadMultipartStartResponse> {
    return this.request<AnsUploadMultipartStartResponse>('/uploads/multipart/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async signUploadParts(
    params: AnsUploadMultipartSignPartsRequest,
  ): Promise<AnsUploadMultipartSignPartsResponse> {
    return this.request<AnsUploadMultipartSignPartsResponse>('/uploads/multipart/sign-parts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async completeUpload(
    params: AnsUploadMultipartCompleteRequest,
  ): Promise<{ storageKey: string; location: string }> {
    return this.request<{ storageKey: string; location: string }>('/uploads/multipart/complete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
