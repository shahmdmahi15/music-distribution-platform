import { Body, Controller, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CurrentUser } from 'src/platform/decorator/current-user.decorator';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { UpdateProfileNameDto } from './dto/update-profile-name.dto';

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

  @Patch('name')
  async updateProfileName(
    @CurrentUser('id') id: string,
    @Body() dto: UpdateProfileNameDto,
  ) {
    return await this.profileService.updateProfileName(id, dto);
  }
}
