import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { UpdateProfileNameDto } from './dto/update-profile-name.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch('image')
  async updateProfileImage(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateProfileImageDto,
  ) {
    return await this.profileService.updateProfileImage(id, dto);
  }

  @Delete('image')
  async removeProfileImage(@CurrentUser('id') id: string) {
    return await this.profileService.removeProfileImage(id);
  }

  @Patch('name')
  async updateProfileName(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateProfileNameDto,
  ) {
    return await this.profileService.updateProfileName(id, dto);
  }

  @Patch('password')
  async updatePassword(
    @CurrentUser('id') id: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    return await this.profileService.updatePassword(id, dto);
  }

  @Get('linked-accounts')
  async getLinkedAccounts(@CurrentUser('id') id: string) {
    return await this.profileService.getLinkedAccounts(id);
  }
}
