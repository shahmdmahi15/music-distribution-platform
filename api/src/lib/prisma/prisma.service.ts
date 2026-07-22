import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { EnvironmentVariables } from 'src/config/env.config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const databaseUrl = configService.get('DATABASE_URL', { infer: true });

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    super({ adapter });
  }
}
