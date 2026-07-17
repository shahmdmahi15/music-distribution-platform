import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/env.validation';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onModuleInit() {
    const redisUrl = this.configService.get('REDIS_URL', { infer: true });

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err: Error) =>
      console.error('Redis Client Error', err),
    );

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Optional helper to expose the client in case you need it in other services
   */
  getClient(): RedisClientType {
    return this.client;
  }
}
