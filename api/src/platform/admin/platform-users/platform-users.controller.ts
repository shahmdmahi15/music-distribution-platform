import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PlatformUsersService } from './platform-users.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { Roles } from 'src/platform/decorator/roles.decorator';
import {
  ADMIN_ROLES,
  OWNER_ADMIN_ROLES,
} from 'src/platform/session/session-auth.service';
import type { PlatformUser } from 'src/generated/prisma/client';
import { GetPlatformUsersDto } from './dto/get-platform-users.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { UpdatePlatformUserDto } from './dto/update-platform-user.dto';
import { LockPlatformUserDto } from './dto/lock-platform-user.dto';
import { ResetPasswordPlatformUserDto } from './dto/reset-password-platform-user.dto';
import {
  BulkActionPlatformUsersDto,
  BulkLockPlatformUsersDto,
  BulkRolePlatformUsersDto,
} from './dto/bulk-platform-users.dto';

@Controller('platform-users')
export class PlatformUsersController {
  constructor(private readonly platformUsersService: PlatformUsersService) {}

  @Get()
  @Roles(...ADMIN_ROLES)
  async getUsers(
    @Query() dto: GetPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.getUsers(dto, actor);
  }

  @Get('stats')
  @Roles(...ADMIN_ROLES)
  async getStats() {
    return await this.platformUsersService.getStats();
  }

  @Get(':id')
  @Roles(...ADMIN_ROLES)
  async getUserById(@Param('id') id: string) {
    return await this.platformUsersService.getUserById(id);
  }

  @Post('bulk/lock')
  @Roles(...OWNER_ADMIN_ROLES)
  async bulkLockUsers(
    @Body() dto: BulkLockPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkLockUsers(dto, actor);
  }

  @Post('bulk/role')
  @Roles(...OWNER_ADMIN_ROLES)
  async bulkChangeRole(
    @Body() dto: BulkRolePlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkChangeRole(dto, actor);
  }

  @Post('bulk/revoke-sessions')
  @Roles(...OWNER_ADMIN_ROLES)
  async bulkRevokeSessions(
    @Body() dto: BulkActionPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkRevokeSessions(dto, actor);
  }

  @Post('bulk/delete')
  @Roles(...OWNER_ADMIN_ROLES)
  async bulkDeleteUsers(
    @Body() dto: BulkActionPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkDeleteUsers(dto, actor);
  }

  @Post()
  @Roles(...OWNER_ADMIN_ROLES)
  async createUser(
    @Body() dto: CreatePlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.createUser(dto, actor);
  }

  @Patch(':id')
  @Roles(...OWNER_ADMIN_ROLES)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.updateUser(id, dto, actor);
  }

  @Patch(':id/lock')
  @Roles(...OWNER_ADMIN_ROLES)
  async lockUser(
    @Param('id') id: string,
    @Body() dto: LockPlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.lockUser(id, dto, actor);
  }

  @Post(':id/reset-password')
  @Roles(...OWNER_ADMIN_ROLES)
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordPlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.resetPassword(id, dto, actor);
  }

  @Post(':id/reset-attempts')
  @Roles(...OWNER_ADMIN_ROLES)
  async resetAttempts(@Param('id') id: string) {
    return await this.platformUsersService.resetAttempts(id);
  }

  @Post(':id/revoke-sessions')
  @Roles(...OWNER_ADMIN_ROLES)
  async revokeSessions(
    @Param('id') id: string,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.revokeSessions(id, actor);
  }

  @Delete(':id')
  @Roles(...OWNER_ADMIN_ROLES)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.deleteUser(id, actor);
  }
}
