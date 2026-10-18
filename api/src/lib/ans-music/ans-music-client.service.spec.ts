import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AnsMusicClientService } from './ans-music-client.service';

describe('AnsMusicClientService', () => {
  let service: AnsMusicClientService;
  let fetchMock: jest.SpyInstance;

  const mockApiUrl = 'https://api.ansmusic.test/v1';
  const mockApiKey = 'ans_test_live_key_9999';

  beforeEach(async () => {
    fetchMock = jest.spyOn(global, 'fetch');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnsMusicClientService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'ANS_MUSIC_API_URL') return mockApiUrl;
              if (key === 'ANS_MUSIC_API_KEY') return mockApiKey;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AnsMusicClientService>(AnsMusicClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe()', () => {
    it('should retrieve tenant profile with mock response and live verification', async () => {
      const mockMeResponse = {
        accountId: 'acc_ans_tenant_100',
        companyName: 'RoyalMotion Music Group',
        email: 'ops@royalmotionit.com',
        environment: 'live' as const,
        scopes: ['release:write', 'release:read', 'channel:write'],
        createdAt: '2026-01-01',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockMeResponse }),
      });

      const result = await service.getMe();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, requestInit] = fetchMock.mock.calls[0];
      expect(url).toBe(`${mockApiUrl}/me`);
      expect(requestInit.method).toBe('GET');
      expect(requestInit.headers).toMatchObject({
        Authorization: `Bearer ${mockApiKey}`,
        'x-api-key': mockApiKey,
      });

      expect(result).toEqual(mockMeResponse);
      expect(result.environment).toBe('live');
    });

    it('should throw UnauthorizedException when API key is rejected (HTTP 401)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Invalid API key or token expired' }),
      });

      await expect(service.getMe()).rejects.toThrow(UnauthorizedException);
    });

    it('should throw HttpException when upstream server returns 500 error', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Internal upstream revelator failure' }),
      });

      await expect(service.getMe()).rejects.toThrow(HttpException);
    });
  });

  describe('createRelease() with externalId idempotency', () => {
    const validCreatePayload = {
      externalId: 'rel_royal_ext_2026_001',
      title: 'Neon Odyssey',
      type: 'SINGLE' as const,
      genre: 'Electronic',
      subgenre: 'Synthwave',
      releaseDate: '2026-11-01',
      cLine: '2026 RoyalMotion Records',
      pLine: '2026 RoyalMotion Records',
      coverArtUrl: 'https://storage.royalmotionit.com/covers/neon.jpg',
      tracks: [
        {
          externalId: 'trk_ext_001',
          trackNumber: 1,
          discNumber: 1,
          title: 'Neon Odyssey (Original Mix)',
          durationSeconds: 245,
          audioUrl: 'https://storage.royalmotionit.com/audio/neon.wav',
          explicit: false,
          contributors: [{ name: 'Kavinsky', role: 'PRIMARY_ARTIST' }],
        },
      ],
      contributors: [{ name: 'Kavinsky', role: 'PRIMARY_ARTIST' }],
    };

    it('should send release payload and include externalId idempotency key in headers and body', async () => {
      const mockCreatedResponse = {
        id: 'ans_rel_999888',
        externalId: validCreatePayload.externalId,
        title: validCreatePayload.title,
        status: 'SUBMITTED',
        upc: '793573179012',
        tracks: [
          {
            id: 'ans_trk_111',
            externalId: 'trk_ext_001',
            isrc: 'USRM12600001',
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockCreatedResponse }),
      });

      const response = await service.createRelease(validCreatePayload);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${mockApiUrl}/releases`);
      expect(init.method).toBe('POST');
      expect(init.headers).toMatchObject({
        Authorization: `Bearer ${mockApiKey}`,
        'X-Idempotency-Key': validCreatePayload.externalId,
      });

      const sentBody = JSON.parse(init.body as string);
      expect(sentBody.externalId).toBe(validCreatePayload.externalId);
      expect(response).toEqual(mockCreatedResponse);
    });

    it('should gracefully handle 409 Conflict if release was already created under same externalId', async () => {
      const existingRelease = {
        id: 'ans_rel_already_exists',
        externalId: validCreatePayload.externalId,
        title: 'Neon Odyssey',
        status: 'SUBMITTED',
        upc: '793573179012',
        isDuplicate: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'Conflict',
          message: 'Release with this externalId already exists',
          existingRelease,
        }),
      });

      const response = await service.createRelease(validCreatePayload);
      expect(response).toEqual(existingRelease);
    });

    it('should throw BadRequestException when upstream returns validation errors (400)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'BadRequest',
          message: 'Validation failed: cover art must be at least 3000x3000px',
        }),
      });

      await expect(service.createRelease(validCreatePayload)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateRelease() patch payload', () => {
    it('should send PATCH request with partial update payload to correct endpoint', async () => {
      const releaseId = 'ans_rel_999888';
      const patchDto = {
        title: 'Neon Odyssey (Remastered 2026)',
        releaseDate: '2026-11-15',
      };

      const mockUpdated = {
        id: releaseId,
        title: patchDto.title,
        releaseDate: patchDto.releaseDate,
        status: 'PENDING',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockUpdated }),
      });

      const result = await service.updateRelease(releaseId, patchDto);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${mockApiUrl}/releases/${releaseId}`);
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body as string)).toEqual(patchDto);
      expect(result).toEqual(mockUpdated);
    });

    it('should throw NotFoundException if target release does not exist (404)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Release not found' }),
      });

      await expect(
        service.updateRelease('non_existent_rel', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestChannel() creation and deduplication', () => {
    const channelPayload = {
      externalId: 'chan_req_vevo_101',
      artistName: 'Zubair Al Mahmud',
      channelName: 'ZubairAlMahmudVEVO',
      artistBio: 'Official VEVO channel for Zubair Al Mahmud',
      avatarUrl: 'https://storage.royalmotionit.com/avatars/zubair.jpg',
      bannerUrl: 'https://storage.royalmotionit.com/banners/zubair.jpg',
    };

    it('should submit VEVO channel creation request and return pending request state', async () => {
      const mockChannelResponse = {
        id: 'ans_chan_55001',
        externalId: channelPayload.externalId,
        channelName: channelPayload.channelName,
        artistName: channelPayload.artistName,
        status: 'PENDING',
        submittedAt: '2026-10-15T12:00:00Z',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockChannelResponse }),
      });

      const result = await service.requestChannel(channelPayload);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${mockApiUrl}/channels`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual(channelPayload);
      expect(result).toEqual(mockChannelResponse);
    });

    it('should deduplicate when duplicate channel request is made with the same externalId', async () => {
      const existingChannel = {
        id: 'ans_chan_existing_55001',
        externalId: channelPayload.externalId,
        channelName: channelPayload.channelName,
        artistName: channelPayload.artistName,
        status: 'PENDING',
        isDuplicate: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'Conflict',
          message: 'Channel request with this externalId already exists',
          existingChannel,
        }),
      });

      const result = await service.requestChannel(channelPayload);
      expect(result).toEqual(existingChannel);
    });
  });

  describe('simulateStatus() for sandbox transitions', () => {
    it('should trigger sandbox status transition to APPROVED', async () => {
      const releaseId = 'ans_rel_sandbox_01';
      const mockTransition = {
        releaseId,
        previousStatus: 'SUBMITTED',
        currentStatus: 'APPROVED',
        upc: '793573179999',
        isrcs: ['USRM12699901'],
        simulated: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockTransition }),
      });

      const result = await service.simulateStatus(releaseId, 'APPROVED');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${mockApiUrl}/releases/${releaseId}/simulate`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ status: 'APPROVED' });
      expect(result).toEqual(mockTransition);
    });
  });
});
