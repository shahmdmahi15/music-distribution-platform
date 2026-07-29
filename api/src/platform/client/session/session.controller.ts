import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { SessionService } from './session.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { RevokeSessionDto } from './dto/revoke-session.dto';
import { CurrentSession } from 'src/platform/decorator/current-session-decorator';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('all')
  async getAllSessions(@CurrentUser('id') id: string) {
    return await this.sessionService.getAllSessions(id);
  }

  @Patch('revoke/all-others')
  async revokeAllOtherSessions(
    @CurrentUser('id') userId: string,
    @CurrentSession('id') currentSessionId: string,
  ) {
    return await this.sessionService.revokeAllOtherSessions(
      userId,
      currentSessionId,
    );
  }

  @Patch('revoke/:sessionId')
  async revokeSession(
    @CurrentUser('id') id: string,
    @Param() dto: RevokeSessionDto,
  ) {
    return await this.sessionService.revokeSession(id, dto);
  }
}
