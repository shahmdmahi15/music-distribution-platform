import { Global, Module } from '@nestjs/common';
import { SessionAuthService } from './session-auth.service';

@Global()
@Module({
  providers: [SessionAuthService],
  exports: [SessionAuthService],
})
export class SessionModule {}
