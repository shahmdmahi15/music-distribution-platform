import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { EnvironmentVariables } from 'src/config/env.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const databaseUrl = configService.get('DATABASE_URL', { infer: true });

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    super({ adapter });
  }

  /** Releases pooled connections so shutdown does not have to wait on them. */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
