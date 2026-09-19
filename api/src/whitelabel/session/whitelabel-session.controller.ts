import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WhitelabelSessionService } from './whitelabel-session.service';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { CurrentWhiteLabelUser } from '../decorator/current-whitelabel-user.decorator';
import { type WhiteLabelUser, type Session } from 'src/generated/prisma/client';
import { CurrentSession } from 'src/platform/decorator/current-session-decorator';

@Controller('session')
@UseGuards(WhitelabelSessionGuard)
export class WhitelabelSessionController {
  constructor(
    private readonly sessionService: WhitelabelSessionService,
  ) {}

  @Get('list')
  async list(
    @CurrentWhiteLabelUser() user: WhiteLabelUser,
    @CurrentSession() session: Session,
  ) {
    return await this.sessionService.listSessions(user.id, session.id);
  }

  @Post(':code/revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(
    @CurrentWhiteLabelUser() user: WhiteLabelUser,
    @Param('code') code: string,
  ) {
    return await this.sessionService.revokeSession(user.id, code);
  }

  @Post('revoke-others')
  @HttpCode(HttpStatus.OK)
  async revokeOthers(
    @CurrentWhiteLabelUser() user: WhiteLabelUser,
    @CurrentSession() session: Session,
  ) {
    return await this.sessionService.revokeOtherSessions(user.id, session.id);
  }
}
