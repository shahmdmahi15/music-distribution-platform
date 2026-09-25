import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { EnvironmentVariables } from 'src/config/env.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const databaseUrl = configService.get('DATABASE_URL', { infer: true });

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureAllSequences();
  }

  /**
   * Idempotently creates all code generation sequences if they do not already exist.
   */
  async ensureAllSequences() {
    try {
      await this.$executeRawUnsafe(`
        CREATE SEQUENCE IF NOT EXISTS platformuser_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS whitelabeluser_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS whitelabel_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS platformsubscription_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS platformsubscriptionpayment_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS session_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS oauthaccount_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS whitelabelpartner_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS whitelabeltopartist_code_seq START 1;
        CREATE SEQUENCE IF NOT EXISTS whitelabeldocument_code_seq START 1;
      `);
    } catch (error) {
      console.warn(
        '[PrismaService] Could not ensure sequences on startup:',
        error,
      );
    }
  }

  /** Releases pooled connections so shutdown does not have to wait on them. */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
