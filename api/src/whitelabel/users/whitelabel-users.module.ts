import { Module } from '@nestjs/common';
import { WhitelabelUsersController } from './whitelabel-users.controller';
import { WhitelabelUsersService } from './whitelabel-users.service';
import { WhitelabelSessionModule } from '../session/whitelabel-session.module';
import { PrismaModule } from 'src/lib/prisma/prisma.module';
import { StorageModule } from 'src/lib/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule, WhitelabelSessionModule],
  controllers: [WhitelabelUsersController],
  providers: [WhitelabelUsersService],
  exports: [WhitelabelUsersService],
})
export class WhitelabelUsersModule {}
