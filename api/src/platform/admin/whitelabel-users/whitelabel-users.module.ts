import { Module } from '@nestjs/common';
import { WhitelabelUsersController } from './whitelabel-users.controller';
import { WhitelabelUsersService } from './whitelabel-users.service';

@Module({
  controllers: [WhitelabelUsersController],
  providers: [WhitelabelUsersService],
})
export class WhitelabelUsersModule {}
