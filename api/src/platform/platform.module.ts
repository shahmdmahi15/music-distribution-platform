import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    RouterModule.register([
      {
        path: 'platform',
        children: [
          { path: 'users', module: UserModule },
          { path: 'auth', module: AuthModule },
        ],
      },
    ]),
  ],
})
export class PlatformModule {}
