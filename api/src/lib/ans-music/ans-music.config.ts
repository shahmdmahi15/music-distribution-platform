import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnsMusicConfigService {
  constructor(private readonly config: ConfigService) {}

  get environment(): 'test' | 'live' {
    return (
      this.config.get<string>('ANS_ENVIRONMENT') || 'test'
    ).toLowerCase() === 'live'
      ? 'live'
      : 'test';
  }

  get baseUrl(): string {
    return (
      this.config.get<string>('ANS_API_BASE_URL') ||
      this.config.get<string>('ANS_MUSIC_API_URL') ||
      'https://server.ansmusic.io/partner'
    ).replace(/\/+$/, '');
  }

  get apiKey(): string {
    const configuredKey = this.config.get<string>('ANS_MUSIC_API_KEY');
    if (configuredKey) {
      return configuredKey;
    }

    if (this.environment === 'live') {
      return (
        this.config.get<string>('ANS_LIVE_API_KEY') ||
        'ans_live_ac2beb0fe91f82a8c4d1703f5b3b9fb298df855a701d512b'
      );
    }
    return (
      this.config.get<string>('ANS_TEST_API_KEY') ||
      'ans_test_4cfc31c23807b5010539a68f2bd57c0e8d807337458cd40e'
    );
  }

  get webhookSecret(): string {
    return (
      this.config.get<string>('ANS_WEBHOOK_SECRET') ||
      'rmit_ans_webhook_hmac_secret_2026_secure'
    );
  }
}
