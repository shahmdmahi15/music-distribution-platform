import { Module } from '@nestjs/common';
import { ClientWhitelabelController } from './whitelabel.controller';
import { ClientWhitelabelService } from './whitelabel.service';
import { PrismaModule } from 'src/lib/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClientWhitelabelController],
  providers: [ClientWhitelabelService],
  exports: [ClientWhitelabelService],
})
export class ClientWhitelabelModule {}
