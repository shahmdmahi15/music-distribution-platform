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
  async getUsers(
    @Query() dto: GetPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.getUsers(dto, actor);
  }

  @Get('stats')
  async getStats() {
    return await this.platformUsersService.getStats();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.platformUsersService.getUserById(id);
  }

  @Post()
  async createUser(
    @Body() dto: CreatePlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.createUser(dto, actor);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.updateUser(id, dto, actor);
  }

  @Patch(':id/lock')
  async lockUser(
    @Param('id') id: string,
    @Body() dto: LockPlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.lockUser(id, dto, actor);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordPlatformUserDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.resetPassword(id, dto, actor);
  }

  @Post(':id/reset-attempts')
  async resetAttempts(@Param('id') id: string) {
    return await this.platformUsersService.resetAttempts(id);
  }

  @Post(':id/revoke-sessions')
  async revokeSessions(
    @Param('id') id: string,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.revokeSessions(id, actor);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.deleteUser(id, actor);
  }

  @Post('bulk/lock')
  async bulkLockUsers(
    @Body() dto: BulkLockPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkLockUsers(dto, actor);
  }

  @Post('bulk/role')
  async bulkChangeRole(
    @Body() dto: BulkRolePlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkChangeRole(dto, actor);
  }

  @Post('bulk/revoke-sessions')
  async bulkRevokeSessions(
    @Body() dto: BulkActionPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkRevokeSessions(dto, actor);
  }

  @Post('bulk/delete')
  async bulkDeleteUsers(
    @Body() dto: BulkActionPlatformUsersDto,
    @CurrentUser() actor: PlatformUser,
  ) {
    return await this.platformUsersService.bulkDeleteUsers(dto, actor);
  }
}
