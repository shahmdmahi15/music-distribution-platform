import { Module } from '@nestjs/common';
import { DdexGeneratorService } from './ddex-generator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DdexGeneratorService],
  exports: [DdexGeneratorService],
})
export class DdexModule {}
