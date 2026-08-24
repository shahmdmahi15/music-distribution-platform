import { Module } from '@nestjs/common';
import { AdminWhitelabelController } from './whitelabel.controller';
import { AdminWhitelabelService } from './whitelabel.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminWhitelabelController],
  providers: [AdminWhitelabelService],
  exports: [AdminWhitelabelService],
})
export class AdminWhitelabelModule {}
