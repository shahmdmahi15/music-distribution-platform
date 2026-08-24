import { Module } from '@nestjs/common';
import { WhitelabelService } from './whitelabel.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WhitelabelService],
  exports: [WhitelabelService],
})
export class WhitelabelModule {}
