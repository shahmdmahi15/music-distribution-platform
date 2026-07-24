import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { PlatformModule } from './platform/platform.module';
import { WhitelabelModule } from './whitelabel/whitelabel.module';

@Module({
  imports: [
    PlatformModule,
    WhitelabelModule,
    RouterModule.register([
      {
        path: 'users',
        children: [
          { path: '', module: PlatformModule },
          { path: '', module: WhitelabelModule },
        ],
      },
    ]),
  ],
})
export class UsersModule {}
