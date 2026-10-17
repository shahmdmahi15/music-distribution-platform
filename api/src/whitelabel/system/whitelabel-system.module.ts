import { Module } from '@nestjs/common';
import { WhitelabelSystemController } from './whitelabel-system.controller';
import { WhitelabelSystemService } from './whitelabel-system.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { WhitelabelBundleModule } from 'src/platform/client/whitelabel/bundle/whitelabel-bundle.module';

@Module({
  imports: [PrismaModule, WhitelabelBundleModule],
  controllers: [WhitelabelSystemController],
  providers: [WhitelabelSystemService],
  exports: [WhitelabelSystemService],
})
export class WhitelabelSystemModule {}
