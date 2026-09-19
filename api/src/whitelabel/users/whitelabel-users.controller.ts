import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WhitelabelUsersService } from './whitelabel-users.service';
import { WhitelabelSessionGuard } from '../guard/whitelabel-session.guard';
import { WhitelabelRolesGuard } from '../guard/whitelabel-roles.guard';
import { WhiteLabelRoles } from '../decorator/whitelabel-roles.decorator';
import { CurrentWhiteLabel } from '../decorator/current-whitelabel.decorator';
import { CurrentWhiteLabelUser } from '../decorator/current-whitelabel-user.decorator';
import type { WhiteLabel, WhiteLabelUser } from 'src/generated/prisma/client';
import { WhiteLabelUserRole } from 'src/generated/prisma/enums';
import { CreateWhitelabelUserDto } from './dto/create-whitelabel-user.dto';
import { UpdateWhitelabelUserRoleDto } from './dto/update-whitelabel-user-role.dto';
import { QueryWhitelabelUsersDto } from './dto/query-whitelabel-users.dto';

@Controller('users')
@UseGuards(WhitelabelSessionGuard, WhitelabelRolesGuard)
@WhiteLabelRoles(
  WhiteLabelUserRole.OWNER,
  WhiteLabelUserRole.PARTNER,
  WhiteLabelUserRole.ADMIN,
  WhiteLabelUserRole.MANAGER,
)
export class WhitelabelUsersController {
  constructor(private readonly usersService: WhitelabelUsersService) {}

  @Get()
  async list(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Query() query: QueryWhitelabelUsersDto,
  ) {
    return await this.usersService.listUsers(whiteLabel.id, query);
  }

  @Post()
  async create(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @CurrentWhiteLabelUser() currentUser: WhiteLabelUser,
    @Body() dto: CreateWhitelabelUserDto,
  ) {
    return await this.usersService.createUser(whiteLabel.id, currentUser, dto);
  }

  @Get(':code')
  async get(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @Param('code') code: string,
  ) {
    return await this.usersService.getUser(whiteLabel.id, code);
  }

  @Patch(':code/role')
  async updateRole(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @CurrentWhiteLabelUser() currentUser: WhiteLabelUser,
    @Param('code') code: string,
    @Body() dto: UpdateWhitelabelUserRoleDto,
  ) {
    return await this.usersService.updateRole(
      whiteLabel.id,
      currentUser,
      code,
      dto,
    );
  }

  @Patch(':code/lock')
  async toggleLock(
    @CurrentWhiteLabel() whiteLabel: WhiteLabel,
    @CurrentWhiteLabelUser() currentUser: WhiteLabelUser,
    @Param('code') code: string,
  ) {
    return await this.usersService.toggleLock(whiteLabel.id, currentUser, code);
  }
}
